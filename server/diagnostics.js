import fs from 'fs';
import path from 'path';

/**
 * Deterministic quality & sanity checker for LaTeX & BibTeX projects
 */
export function runDiagnostics(projectDir) {
  const issues = [];

  // Find all .tex files and .bib files recursively
  const texFiles = [];
  const bibFiles = [];

  function scan(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scan(fullPath);
      } else if (entry.name.endsWith('.tex')) {
        texFiles.push(fullPath);
      } else if (entry.name.endsWith('.bib')) {
        bibFiles.push(fullPath);
      }
    }
  }

  scan(projectDir);

  const labels = new Map(); // labelName -> { file, line }
  const refs = [];          // { refName, file, line }
  const citations = [];     // { citeKey, file, line }
  const bibKeys = new Set();
  const figureIncludes = []; // { figPath, file, line }

  // 1. Parse BibTeX files
  for (const bibFile of bibFiles) {
    const relPath = path.relative(projectDir, bibFile);
    try {
      const content = fs.readFileSync(bibFile, 'utf8');
      const lines = content.split('\n');
      const keyRegex = /@\w+\s*\{\s*([^,\s]+)/g;
      
      lines.forEach((line, index) => {
        let match;
        while ((match = keyRegex.exec(line)) !== null) {
          const key = match[1].trim();
          if (bibKeys.has(key)) {
            issues.push({
              type: 'warning',
              category: 'bibliography',
              message: `Duplicate bibliography key '${key}' in ${relPath}`,
              file: relPath,
              line: index + 1
            });
          } else {
            bibKeys.add(key);
          }
        }
      });
    } catch (err) {
      // ignore read error
    }
  }

  // 2. Parse .tex files
  for (const texFile of texFiles) {
    const relPath = path.relative(projectDir, texFile);
    try {
      const content = fs.readFileSync(texFile, 'utf8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        const lineNum = index + 1;

        // Skip full comment lines
        const trimmed = line.trim();
        if (trimmed.startsWith('%')) return;

        // Check for TODO / FIXME / HACK / XXX
        const todoMatch = line.match(/\b(TODO|FIXME|HACK|XXX|NOTE|BUG)\b[:\s]*(.*)/i);
        if (todoMatch && !trimmed.startsWith('%')) {
          issues.push({
            type: 'info',
            category: 'placeholder',
            message: `Unresolved placeholder: ${todoMatch[1].toUpperCase()} ${todoMatch[2] ? `("${todoMatch[2].slice(0, 40).trim()}")` : ''}`,
            file: relPath,
            line: lineNum
          });
        }

        // Check labels: \label{name}
        const labelRegex = /\\label\{([^}]+)\}/g;
        let lMatch;
        while ((lMatch = labelRegex.exec(line)) !== null) {
          const name = lMatch[1].trim();
          if (labels.has(name)) {
            issues.push({
              type: 'error',
              category: 'label',
              message: `Duplicate label '${name}' already defined in ${labels.get(name).file}:${labels.get(name).line}`,
              file: relPath,
              line: lineNum
            });
          } else {
            labels.set(name, { file: relPath, line: lineNum });
          }
        }

        // Check refs: \ref{name}, \pageref{name}, \eqref{name}, \autoref{name}
        const refRegex = /\\(?:ref|pageref|eqref|autoref|cref|Cref)\{([^}]+)\}/g;
        let rMatch;
        while ((rMatch = refRegex.exec(line)) !== null) {
          refs.push({ refName: rMatch[1].trim(), file: relPath, line: lineNum });
        }

        // Check citations: \cite{k1, k2}, \citep{...}, \citet{...}
        const citeRegex = /\\(?:cite[a-zA-Z*]*|nocite)\{([^}]+)\}/g;
        let cMatch;
        while ((cMatch = citeRegex.exec(line)) !== null) {
          const keys = cMatch[1].split(',').map(k => k.trim());
          for (const key of keys) {
            if (key) citations.push({ citeKey: key, file: relPath, line: lineNum });
          }
        }

        // Check figures: \includegraphics[...]{path}
        const figRegex = /\\includegraphics(?:\[[^\]]*\])?\{([^}]+)\}/g;
        let fMatch;
        while ((fMatch = figRegex.exec(line)) !== null) {
          figureIncludes.push({ figPath: fMatch[1].trim(), file: relPath, line: lineNum });
        }
      });
    } catch (err) {
      // ignore
    }
  }

  // 3. Cross-reference validation
  for (const r of refs) {
    if (!labels.has(r.refName)) {
      issues.push({
        type: 'error',
        category: 'reference',
        message: `Undefined reference '${r.refName}' (no matching \\label found)`,
        file: r.file,
        line: r.line
      });
    }
  }

  // 4. Citation validation against .bib
  if (bibFiles.length > 0) {
    for (const c of citations) {
      if (!bibKeys.has(c.citeKey)) {
        issues.push({
          type: 'warning',
          category: 'citation',
          message: `Citation '${c.citeKey}' not found in any loaded .bib bibliography`,
          file: c.file,
          line: c.line
        });
      }
    }
  }

  // 5. Figure file existence check
  for (const f of figureIncludes) {
    // TeX allows omitting .png, .jpg, .pdf
    const candidates = [
      f.figPath,
      `${f.figPath}.png`,
      `${f.figPath}.jpg`,
      `${f.figPath}.jpeg`,
      `${f.figPath}.pdf`,
      `${f.figPath}.eps`
    ];

    let found = false;
    for (const cand of candidates) {
      const absCand = path.resolve(projectDir, cand);
      if (fs.existsSync(absCand)) {
        found = true;
        break;
      }
    }

    if (!found) {
      issues.push({
        type: 'error',
        category: 'figure',
        message: `Missing figure asset: '${f.figPath}' could not be located in project directory`,
        file: f.file,
        line: f.line
      });
    }
  }

  return issues;
}
