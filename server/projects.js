import fs from 'fs';
import path from 'path';
import os from 'os';
import { execFileSync } from 'child_process';
import { loadUserConfig } from './config.js';

export function getProjectStorageDir() {
  const cfg = loadUserConfig();
  const dir = cfg.projectsDir || path.resolve(process.cwd(), 'projects');
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch {}
  }
  return dir;
}

export const DEFAULT_PROJECT_DIR = getProjectStorageDir();

// Built-in starter templates
const TEMPLATES = {
  article: {
    name: 'Standard Academic Article',
    description: 'Clean single-column research paper with sections, equations, citations, and figures.',
    files: {
      'main.tex': `\\documentclass[11pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage{amsmath,amssymb}
\\usepackage{graphicx}
\\usepackage{cite}
\\usepackage{hyperref}
\\usepackage{booktabs}

\\title{LX-IDE: High-Precision Local Scientific Writing and Privacy-First Manuscript Synthesis}
\\author{Abu Sayed Rabbi\\\\
\\small Department of Computer Science and Engineering\\\\
\\small \\texttt{abusayedrabbi327@gmail.com}}
\\date{\\today}

\\begin{document}

\\maketitle

\\begin{abstract}
Writing scientific papers requires simultaneous coordination across LaTeX typesetting, reference consistency, and mathematical precision. In this paper, we present an integrated evaluation of local-first research writing studios. We demonstrate that decoupling local deterministic validation from cloud-assisted generative refinement yields higher editorial fidelity and eliminates privacy leakage of sensitive pre-publication discoveries.
\\end{abstract}

\\section{Introduction}
\\label{sec:intro}
Modern computational research relies heavily on mathematical rigor and reproducible dissemination \\cite{vaswani2017attention}. However, traditional workflows remain disjointed, often requiring researchers to bounce between source editors, compiler terminals, reference databases, and external conversational models \\cite{he2016deep}.

In this paper, we outline three primary contributions:
\\begin{enumerate}
    \\item A deterministic static analyzer for cross-references and citation keys.
    \\item A local compilation pipeline that retains previous valid PDFs during build failures.
    \\item A diff-oriented review workflow for non-destructive academic revision.
\\end{enumerate}

\\section{Mathematical Formulation}
\\label{sec:method}
Let the manuscript state space be denoted by $\\mathcal{S} = \\{t_1, t_2, \\dots, t_n\\}$, where each $t_i$ represents a typed LaTeX element. The energy minimization objective for document consistency is defined as:

\\begin{equation}
\\label{eq:consistency}
\\mathcal{L}_{doc} = \\sum_{i=1}^N \\alpha_i \\| \\phi(t_i) - \\psi(\\mathbf{r}_i) \\|^2 + \\lambda \\Omega(\\mathcal{G})
\\end{equation}

where $\\phi$ is the semantic embedding of section $t_i$, $\\psi(\\mathbf{r}_i)$ represents the ground-truth citation context, and $\\Omega(\\mathcal{G})$ penalizes unresolved reference graphs.

\\section{Experimental Evaluation}
\\label{sec:experiments}
We benchmarked compilation latency and editorial throughput across 50 representative academic manuscripts. As summarized in Table~\\ref{tab:results}, deterministic local builds substantially reduce iteration latency.

\\begin{table}[htbp]
\\centering
\\caption{Comparative Latency Benchmarks (Seconds)}
\\label{tab:results}
\\begin{tabular}{lccc}
\\toprule
\\textbf{Workflow Mode} & \\textbf{Cold Build (s)} & \\textbf{Incremental (s)} & \\textbf{Diff Review (s)} \\\\
\\midrule
Traditional Remote & 14.2 & 8.5 & 35.0 \\\\
Local Studio & 4.1 & 1.2 & 3.8 \\\\
\\textbf{PrismForge (Ours)} & \\textbf{1.8} & \\textbf{0.4} & \\textbf{0.9} \\\\
\\bottomrule
\\end{tabular}
\\end{table}

\\section{Conclusion}
\\label{sec:conclusion}
We have introduced an offline-capable, local-first scientific writing architecture. By prioritizing local execution and interactive diff review, researchers maintain absolute control over manuscript integrity.

\\bibliographystyle{plain}
\\bibliography{references}

\\end{document}
`,
      'references.bib': `@article{vaswani2017attention,
  title={Attention is all you need},
  author={Vaswani, Ashish and Shazeer, Noam and Parmar, Niki and Uszkoreit, Jakob and Jones, Llion and Gomez, Aidan N and Kaiser, {\\L}ukasz and Polosukhin, Illia},
  journal={Advances in Neural Information Processing Systems},
  volume={30},
  year={2017}
}

@inproceedings{he2016deep,
  title={Deep residual learning for image recognition},
  author={He, Kaiming and Zhang, Xiangyu and Ren, Shaoqing and Sun, Jian},
  booktitle={Proceedings of the IEEE conference on computer vision and pattern recognition},
  pages={770--778},
  year={2016}
}

@article{smith2023quantum,
  title={Scalable architectures for deterministic state machines},
  author={Smith, John and Doe, Jane},
  journal={Journal of Systems Research},
  volume={42},
  number={3},
  pages={112--128},
  year={2023}
}
`
    }
  },

  ieee: {
    name: 'IEEE Conference Format',
    description: 'Two-column standard IEEE transaction & conference template.',
    files: {
      'main.tex': `\\documentclass[conference]{article}
\\usepackage{amsmath,amssymb}
\\usepackage{cite}
\\usepackage{graphicx}
\\usepackage{booktabs}

\\title{Scalable Verification of Neural Document Architectures}
\\author{
\\IEEEauthorblockN{First Author}
\\IEEEauthorblockA{\\textit{Dept. of Computer Science} \\\\
\\textit{University of Engineering}\\\\
City, Country \\\\
author1@example.com}
\\and
\\IEEEauthorblockN{Second Author}
\\IEEEauthorblockA{\\textit{Dept. of Information Technology} \\\\
\\textit{National Research Lab}\\\\
City, Country \\\\
author2@example.com}
}

\\begin{document}
\\maketitle

\\begin{abstract}
This paper presents a formal framework for verifying LaTeX document graphs against IEEE layout constraints.
\\end{abstract}

\\section{Introduction}
Document structures require exact formatting according to publisher specifications \\cite{vaswani2017attention}.

\\section{Methodology}
\\label{sec:method}
We model formatting as a constraint satisfaction problem:
\\begin{equation}
f(x) = \\sigma(W x + b)
\\end{equation}

\\bibliographystyle{IEEEtran}
\\bibliography{references}
\\end{document}
`,
      'references.bib': `@article{vaswani2017attention,
  title={Attention is all you need},
  author={Vaswani, Ashish and others},
  journal={NeurIPS},
  year={2017}
}
`
    }
  },

  blank: {
    name: 'Blank Project',
    description: 'Minimal starter LaTeX document.',
    files: {
      'main.tex': `\\documentclass{article}
\\usepackage[utf8]{inputenc}

\\title{Untitled Document}
\\author{Your Name}
\\date{\\today}

\\begin{document}

\\maketitle

\\section{Introduction}
Start writing your document here...

\\end{document}
`
    }
  },

  cv: {
    name: 'Curriculum Vitae (CV / Resume)',
    description: 'Clean academic curriculum vitae format.',
    files: {
      'main.tex': `\\documentclass[10pt,a4paper]{article}
\\usepackage[a4paper,margin=0.5in]{geometry}
\\usepackage{hyperref}
\\usepackage{enumitem}

\\pagestyle{empty}

\\begin{document}

\\begin{center}
    {\\LARGE \\textbf{Your Full Name}}\\\\[4pt]
    \\small City, Country $\\cdot$ \\texttt{email@example.com} $\\cdot$ +123 456 7890 $\\cdot$ \\url{linkedin.com/in/username}
\\end{center}

\\vspace{6pt}
\\section*{Education}
\\textbf{University Name} \\hfill City, Country\\\\
\\textit{Bachelor of Science in Computer Science} \\hfill 2022 -- 2026

\\vspace{6pt}
\\section*{Experience & Projects}
\\textbf{Research Assistant} \\hfill 2024 -- Present\\\\
\\textit{Advanced Computing Laboratory}\\\\
Developed high-performance algorithms for distributed systems.

\\vspace{6pt}
\\section*{Skills}
\\textbf{Languages:} Python, C++, LaTeX, JavaScript, TypeScript\\\\
\\textbf{Frameworks:} PyTorch, React, Node.js\\\\
\\textbf{Tools:} Git, Linux, Docker

\\end{document}
`
    }
  }
};

/**
 * Creates project from template or initializes default project
 */
export function createProject(projectName, templateKey = 'article') {
  const sanitized = projectName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const storageDir = getProjectStorageDir();
  const projectPath = path.join(storageDir, sanitized);

  if (fs.existsSync(projectPath)) {
    throw new Error(`Project '${sanitized}' already exists.`);
  }

  fs.mkdirSync(projectPath, { recursive: true });
  fs.mkdirSync(path.join(projectPath, '.prismforge', 'snapshots'), { recursive: true });
  fs.mkdirSync(path.join(projectPath, 'figures'), { recursive: true });

  const template = TEMPLATES[templateKey] || TEMPLATES.article;
  for (const [filename, content] of Object.entries(template.files)) {
    fs.writeFileSync(path.join(projectPath, filename), content, 'utf8');
  }

  // Create project metadata
  const meta = {
    name: sanitized,
    template: templateKey,
    createdAt: new Date().toISOString(),
    mainFile: 'main.tex'
  };
  fs.writeFileSync(path.join(projectPath, '.prismforge', 'project.json'), JSON.stringify(meta, null, 2));

  // Initialize first snapshot
  try {
    createSnapshot(projectPath, 'Initial template baseline');
  } catch {}

  return { name: sanitized, path: projectPath, meta };
}

/**
 * Lists all existing projects
 */
export function listProjects() {
  const storageDir = getProjectStorageDir();
  if (!fs.existsSync(storageDir)) return [];

  const items = fs.readdirSync(storageDir, { withFileTypes: true });
  return items
    .filter(i => i.isDirectory())
    .map(i => {
      const projPath = path.join(storageDir, i.name);
      const metaPath = path.join(projPath, '.prismforge', 'project.json');
      let meta = { name: i.name, mainFile: 'main.tex', createdAt: null };
      if (fs.existsSync(metaPath)) {
        try { meta = JSON.parse(fs.readFileSync(metaPath, 'utf8')); } catch {}
      }
      let stats;
      try { stats = fs.statSync(projPath); } catch {}
      return {
        name: i.name,
        path: projPath,
        mainFile: meta.mainFile || 'main.tex',
        createdAt: meta.createdAt || stats?.birthtime,
        modifiedAt: stats?.mtime || new Date().toISOString()
      };
    });
}

export function deleteProject(projectName) {
  const sanitized = projectName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const storageDir = getProjectStorageDir();
  const projectPath = path.join(storageDir, sanitized);
  if (fs.existsSync(projectPath)) {
    fs.rmSync(projectPath, { recursive: true, force: true });
    return true;
  }
  return false;
}

/**
 * Reads recursive directory tree for the file explorer
 */
export function getProjectTree(projectDir) {
  function scan(currentPath, relPath = '') {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    const items = [];

    for (const entry of entries) {
      if (entry.name === '.prismforge' || entry.name === 'output' || entry.name.startsWith('.')) {
        continue;
      }

      const fullEntry = path.join(currentPath, entry.name);
      const relativeEntry = relPath ? `${relPath}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        items.push({
          name: entry.name,
          path: relativeEntry,
          type: 'directory',
          children: scan(fullEntry, relativeEntry)
        });
      } else {
        const ext = path.extname(entry.name).toLowerCase();
        items.push({
          name: entry.name,
          path: relativeEntry,
          type: 'file',
          ext: ext
        });
      }
    }
    return items;
  }

  return scan(projectDir);
}

/**
 * Creates a timestamped snapshot of project files
 */
export function createSnapshot(projectDir, description = 'Auto snapshot') {
  const snapshotDir = path.join(projectDir, '.prismforge', 'snapshots');
  if (!fs.existsSync(snapshotDir)) fs.mkdirSync(snapshotDir, { recursive: true });

  const timestamp = Date.now();
  const snapshotId = `snap_${timestamp}`;
  const targetDir = path.join(snapshotDir, snapshotId);
  fs.mkdirSync(targetDir, { recursive: true });

  // Copy text files
  const filesToCopy = [];
  function collect(dir, rel = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.name === '.prismforge' || e.name === 'output') continue;
      const full = path.join(dir, e.name);
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) {
        collect(full, r);
      } else if (/\.(tex|bib|txt|md|json)$/i.test(e.name)) {
        filesToCopy.push({ full, rel: r });
      }
    }
  }
  collect(projectDir);

  for (const f of filesToCopy) {
    const dest = path.join(targetDir, f.rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(f.full, dest);
  }

  const meta = {
    id: snapshotId,
    timestamp,
    date: new Date(timestamp).toLocaleString(),
    description,
    filesCount: filesToCopy.length
  };
  fs.writeFileSync(path.join(targetDir, '_meta.json'), JSON.stringify(meta, null, 2));

  return meta;
}

/**
 * Lists all snapshots for a project
 */
export function listSnapshots(projectDir) {
  const snapshotDir = path.join(projectDir, '.prismforge', 'snapshots');
  if (!fs.existsSync(snapshotDir)) return [];

  const dirs = fs.readdirSync(snapshotDir, { withFileTypes: true });
  const list = [];
  for (const d of dirs) {
    if (!d.isDirectory()) continue;
    const metaFile = path.join(snapshotDir, d.name, '_meta.json');
    if (fs.existsSync(metaFile)) {
      try {
        list.push(JSON.parse(fs.readFileSync(metaFile, 'utf8')));
      } catch {}
    }
  }
  return list.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Restores a snapshot
 */
export function restoreSnapshot(projectDir, snapshotId) {
  const snapDir = path.join(projectDir, '.prismforge', 'snapshots', snapshotId);
  if (!fs.existsSync(snapDir)) throw new Error(`Snapshot ${snapshotId} not found`);

  // First create a safety recovery snapshot of current state!
  createSnapshot(projectDir, `Pre-restore safety snapshot before ${snapshotId}`);

  function copyBack(dir, rel = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.name === '_meta.json') continue;
      const full = path.join(dir, e.name);
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) {
        copyBack(full, r);
      } else {
        const target = path.join(projectDir, r);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.copyFileSync(full, target);
      }
    }
  }
  copyBack(snapDir);
  return { success: true, restoredSnapshotId: snapshotId };
}

/**
 * Exports project as a clean ZIP archive (excluding .prismforge and output)
 * Formats archive entries cleanly without './' so Windows Explorer extracts them seamlessly.
 */
export function exportProjectZip(projectDir, res) {
  const projectName = path.basename(projectDir);
  const scratchDir = path.join(os.homedir(), '.lxide', 'scratch');
  if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir, { recursive: true });

  const tempZipPath = path.join(scratchDir, `${projectName}_${Date.now()}.zip`);

  try {
    // Collect root entries excluding internal cache/meta directories
    const entries = fs.readdirSync(projectDir).filter(f => 
      f !== '.prismforge' && f !== 'output' && !f.startsWith('.git')
    );

    if (entries.length === 0) {
      return res.status(400).json({ error: 'Project directory is empty' });
    }

    // Pass entry names directly so that Windows Explorer's built-in extractor
    // does not fail on './' path prefixes
    execFileSync('tar', [
      '-a',
      '-cf',
      tempZipPath,
      '-C',
      projectDir,
      ...entries
    ]);

    res.download(tempZipPath, `${projectName}.zip`, (err) => {
      try {
        if (fs.existsSync(tempZipPath)) fs.unlinkSync(tempZipPath);
      } catch {}
    });
  } catch (err) {
    console.error('Export ZIP error:', err);
    res.status(500).json({ error: 'Failed to create project ZIP: ' + err.message });
  }
}

/**
 * Reads file content from a specific snapshot
 */
export function getSnapshotFileContent(projectDir, snapshotId, relPath = 'main.tex') {
  const filePath = path.join(projectDir, '.prismforge', 'snapshots', snapshotId, relPath);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf8');
}

/**
 * Imports an uploaded .zip archive as a new project
 */
export function importZipProject(zipFilePath, originalFilename) {
  const baseName = path.basename(originalFilename, path.extname(originalFilename)).replace(/[^a-zA-Z0-9_-]/g, '_') || 'Imported_Project';
  const storageDir = getProjectStorageDir();
  
  let targetName = baseName;
  let counter = 1;
  while (fs.existsSync(path.join(storageDir, targetName))) {
    targetName = `${baseName}_${counter++}`;
  }

  const projectPath = path.join(storageDir, targetName);
  fs.mkdirSync(projectPath, { recursive: true });

  // Extract using Windows tar
  execFileSync('tar', ['-xf', zipFilePath, '-C', projectPath]);

  // If the zip contained a single root directory, flatten it
  const entries = fs.readdirSync(projectPath);
  if (entries.length === 1 && fs.statSync(path.join(projectPath, entries[0])).isDirectory()) {
    const subDir = path.join(projectPath, entries[0]);
    const subEntries = fs.readdirSync(subDir);
    for (const sub of subEntries) {
      fs.renameSync(path.join(subDir, sub), path.join(projectPath, sub));
    }
    fs.rmdirSync(subDir);
  }

  // Ensure metadata
  const metaDir = path.join(projectPath, '.prismforge');
  fs.mkdirSync(metaDir, { recursive: true });
  fs.mkdirSync(path.join(metaDir, 'snapshots'), { recursive: true });

  // Locate main tex file
  const rootFiles = fs.readdirSync(projectPath);
  const mainFile = rootFiles.includes('main.tex') ? 'main.tex' : (rootFiles.find(f => f.endsWith('.tex')) || 'main.tex');

  const meta = {
    name: targetName,
    template: 'imported_zip',
    createdAt: new Date().toISOString(),
    mainFile
  };
  fs.writeFileSync(path.join(metaDir, 'project.json'), JSON.stringify(meta, null, 2));

  // Clean temp zip
  try { fs.unlinkSync(zipFilePath); } catch {}

  return { name: targetName, path: projectPath, meta };
}

export { TEMPLATES };

