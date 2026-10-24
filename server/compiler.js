import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

// Store last known successful PDF path per project to maintain preview across compilation failures
const lastKnownPdfs = new Map();

/**
 * Parses raw LaTeX / Tectonic compiler chatter into structured errors, warnings, and bad boxes
 * Matches Overleaf's cleaner behavior: filters engine rerun artifacts, separates bad boxes, deduplicates passes.
 */
/**
 * Unwraps lines that TeX's fixed-width output buffer broke at columns 79-80
 */
function unwrapTexLog(logText) {
  if (!logText) return '';
  const lines = logText.split(/\r?\n/);
  const unwrappedLines = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    while (
      (line.length === 79 || line.length === 80) &&
      i + 1 < lines.length &&
      lines[i + 1].length > 0 &&
      !lines[i + 1].startsWith('(') &&
      !lines[i + 1].startsWith(')') &&
      !lines[i + 1].startsWith('[') &&
      !lines[i + 1].startsWith('!') &&
      !/^note:\s/i.test(lines[i + 1]) &&
      !/^warning:\s/i.test(lines[i + 1])
    ) {
      i++;
      line += lines[i];
    }
    unwrappedLines.push(line);
  }
  return unwrappedLines.join('\n');
}

/**
 * Parses raw LaTeX / Tectonic compiler chatter into structured errors, warnings, and bad boxes
 * Matches Overleaf's cleaner behavior: filters engine rerun artifacts, separates bad boxes, deduplicates passes.
 */
function parseCompilerOutput(logText) {
  const errors = [];
  const warnings = [];
  const badBoxes = [];

  // Unbreak lines split by TeX's 79-column output buffer
  const cleanLog = unwrapTexLog(logText);

  // 1. Tectonic multi-pass handling: focus on the final pass for warnings and box badness
  const passes = cleanLog.split(/note:\s*R?unning TeX\b/i);
  const targetLog = passes.length > 1 ? passes[passes.length - 1] : cleanLog;

  // 2. Parse Errors across the entire log so no critical failure is missed
  const errorRegex = /^!\s+([^\r\n]+)(?:[\r\n]+l\.(\d+)\s*([^\r\n]*))?/gm;
  let errMatch;
  const seenErrors = new Set();
  while ((errMatch = errorRegex.exec(cleanLog)) !== null) {
    const msg = errMatch[1].trim();
    const line = errMatch[2] ? parseInt(errMatch[2], 10) : null;
    const context = errMatch[3] ? errMatch[3].trim() : '';
    const key = `${msg}__${line}`;
    if (!seenErrors.has(key)) {
      seenErrors.add(key);
      errors.push({ message: msg, line, context });
    }
  }

  // Tectonic command-level errors
  const tectonicErrRegex = /^(?:error|fatal):\s*([^\r\n]+)/gm;
  let tecMatch;
  while ((tecMatch = tectonicErrRegex.exec(cleanLog)) !== null) {
    const msg = tecMatch[1].trim();
    if (!seenErrors.has(msg)) {
      seenErrors.add(msg);
      errors.push({ message: msg, line: null, context: '' });
    }
  }

  // 3. Parse Bad Boxes (Overfull / Underfull) from final pass
  const boxRegex = /(Overfull|Underfull)\s+\\[hv]box\s+\([^)]+\)[^\r\n]*/gi;
  let boxMatch;
  const seenBoxes = new Set();
  while ((boxMatch = boxRegex.exec(targetLog)) !== null) {
    const full = boxMatch[0].replace(/\s+/g, ' ').trim();
    const lineMatch = full.match(/lines?\s+(\d+)/i);
    const line = lineMatch ? parseInt(lineMatch[1], 10) : null;
    const key = `${full}__${line}`;
    if (!seenBoxes.has(key)) {
      seenBoxes.add(key);
      badBoxes.push({ message: full, line });
    }
  }

  // 4. Parse Package & LaTeX Warnings from final pass
  // Matches "Package <name> Warning: <msg>" or "LaTeX Warning: <msg>"
  const warnRegex = /(?:LaTeX Warning:|Package\s+([\w-]+)\s+Warning:)\s*([^\r\n]+(?:\r?\n(?![ \t]*(?:LaTeX Warning:|Package |!|\(|\)|\[|\d+\]))[^\r\n]+)*)/gi;
  let warnMatch;
  const seenWarns = new Set();

  while ((warnMatch = warnRegex.exec(targetLog)) !== null) {
    const pkg = warnMatch[1] || 'LaTeX';
    // Clean up LaTeX continuation lines and whitespace
    let rawMsg = warnMatch[2].replace(/\r?\n\s*/g, ' ').replace(/\s+/g, ' ').trim();
    // Remove package continuation echoes like (natbib) or (rerunfilecheck)
    rawMsg = rawMsg.replace(/\([a-zA-Z0-9_-]+\)\s+/g, '');
    rawMsg = rawMsg.replace(/in\s*put\s+line/gi, 'input line');

    // Filter out engine noise and summaries that Overleaf suppresses
    if (/Rerun to get/i.test(rawMsg) ||
        /has changed\.?\s*$/i.test(rawMsg) ||
        /rerun seems needed/i.test(rawMsg) ||
        /Label\(s\) may have changed/i.test(rawMsg) ||
        /Citation\(s\) may have changed/i.test(rawMsg) ||
        /There were undefined (citations|references)/i.test(rawMsg) ||
        /warnings were issued by the TeX engine/i.test(rawMsg) ||
        /inputenc package ignored/i.test(rawMsg) ||
        /Some font shapes were not available/i.test(rawMsg) ||
        /Font shape `[^']*' undefined/i.test(rawMsg) ||
        /Size substitutions with small font sizes/i.test(rawMsg)) {
      continue;
    }

    // Extract line number if present
    const lineMatch = rawMsg.match(/line\s+(\d+)/i) || rawMsg.match(/lines?\s+(\d+)/i);
    const line = lineMatch ? parseInt(lineMatch[1], 10) : null;

    const cleanMsg = pkg === 'LaTeX' ? `LaTeX Warning: ${rawMsg}` : `Package ${pkg} Warning: ${rawMsg}`;
    const key = `${cleanMsg}__${line}`;

    if (!seenWarns.has(key)) {
      seenWarns.add(key);
      warnings.push({
        package: pkg,
        message: cleanMsg,
        line
      });
    }
  }

  return { errors, warnings, badBoxes };
}

export function resolveTectonicBinary(configuredPath) {
  if (configuredPath && fs.existsSync(configuredPath)) return path.resolve(configuredPath);
  if (process.env.TECTONIC_PATH && fs.existsSync(process.env.TECTONIC_PATH)) return path.resolve(process.env.TECTONIC_PATH);

  const candidates = [
    process.env.TECTONIC_PATH,
    process.env.RESOURCES_PATH ? path.resolve(process.env.RESOURCES_PATH, 'bin', 'tectonic.exe') : null,
    process.env.RESOURCES_PATH ? path.resolve(process.env.RESOURCES_PATH, 'app.asar.unpacked', 'bin', 'tectonic.exe') : null,
    path.resolve(process.cwd(), 'bin', 'tectonic.exe'),
    typeof process !== 'undefined' && process.resourcesPath ? path.resolve(process.resourcesPath, 'bin', 'tectonic.exe') : null,
    typeof process !== 'undefined' && process.resourcesPath ? path.resolve(process.resourcesPath, 'app.asar.unpacked', 'bin', 'tectonic.exe') : null,
    typeof process !== 'undefined' && process.execPath ? path.resolve(path.dirname(process.execPath), 'bin', 'tectonic.exe') : null,
    typeof process !== 'undefined' && process.execPath ? path.resolve(path.dirname(process.execPath), 'resources', 'bin', 'tectonic.exe') : null,
  ].filter(Boolean);

  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return candidates[0] || path.resolve(process.cwd(), 'bin', 'tectonic.exe');
}

/**
 * Compiles a LaTeX document using Tectonic
 */
export async function compileProject({ projectDir, mainFile = 'main.tex', tectonicPath }) {
  const resolvedTectonic = resolveTectonicBinary(tectonicPath);

  if (!fs.existsSync(resolvedTectonic)) {
    throw new Error(`Compiler executable not found at: ${resolvedTectonic}`);
  }

  const mainTexPath = path.resolve(projectDir, mainFile);
  if (!fs.existsSync(mainTexPath)) {
    throw new Error(`Main document file not found: ${mainTexPath}`);
  }

  const outDir = path.resolve(projectDir, 'output');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const baseName = path.basename(mainFile, path.extname(mainFile));
  const expectedPdfPath = path.join(outDir, `${baseName}.pdf`);

  return new Promise((resolve) => {
    const startTime = Date.now();
    let stdoutData = '';
    let stderrData = '';

    const args = [
      mainTexPath,
      '--outdir', outDir,
      '--synctex',
      '--keep-logs',
      '--print'
    ];

    const child = spawn(resolvedTectonic, args, {
      cwd: projectDir,
      env: { ...process.env, TECTONIC_COLOR: 'never' },
      windowsHide: true
    });

    child.stdout.on('data', (d) => { stdoutData += d.toString(); });
    child.stderr.on('data', (d) => { stderrData += d.toString(); });

    // 45 second safety timeout
    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
      resolve({
        success: false,
        durationMs: Date.now() - startTime,
        errors: [{ message: 'Compilation timed out after 45 seconds', line: null }],
        warnings: [],
        pdfPath: lastKnownPdfs.get(projectDir) || null,
        log: stdoutData + '\n' + stderrData
      });
    }, 45000);

    child.on('close', (code) => {
      clearTimeout(timeout);
      const combinedLog = stdoutData + '\n' + stderrData;
      const { errors, warnings, badBoxes } = parseCompilerOutput(combinedLog);
      const durationMs = Date.now() - startTime;

      const pdfExists = fs.existsSync(expectedPdfPath);

      if (code === 0 && pdfExists) {
        lastKnownPdfs.set(projectDir, expectedPdfPath);
        resolve({
          success: true,
          code,
          durationMs,
          pdfPath: expectedPdfPath,
          errors,
          warnings,
          badBoxes,
          log: combinedLog
        });
      } else {
        // Retain last known working PDF if available
        const fallbackPdf = lastKnownPdfs.get(projectDir) || (pdfExists ? expectedPdfPath : null);
        resolve({
          success: false,
          code,
          durationMs,
          pdfPath: fallbackPdf,
          errors: errors.length > 0 ? errors : [{ message: 'LaTeX compilation failed with exit code ' + code, line: null }],
          warnings,
          badBoxes,
          log: combinedLog
        });
      }
    });

    child.on('error', (err) => {
      clearTimeout(timeout);
      resolve({
        success: false,
        durationMs: Date.now() - startTime,
        pdfPath: lastKnownPdfs.get(projectDir) || null,
        errors: [{ message: `Process execution error: ${err.message}`, line: null }],
        warnings: [],
        log: err.stack || err.message
      });
    });
  });
}

export function getLastPdf(projectDir) {
  return lastKnownPdfs.get(projectDir) || null;
}
