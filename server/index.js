import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { exec } from 'child_process';

import { compileProject, getLastPdf } from './compiler.js';
import { runDiagnostics } from './diagnostics.js';
import multer from 'multer';
import {
  listProjects,
  createProject,
  deleteProject,
  importZipProject,
  getSnapshotFileContent,
  getProjectTree,
  createSnapshot,
  listSnapshots,
  restoreSnapshot,
  exportProjectZip,
  getProjectStorageDir,
  TEMPLATES
} from './projects.js';
import { requestAiAssistance } from './ai.js';
import { loadUserConfig, saveUserConfig } from './config.js';

import os from 'os';

dotenv.config();

const scratchDir = path.join(os.homedir(), '.lxide', 'scratch');
if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir, { recursive: true });
const upload = multer({ dest: scratchDir });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Mutable app settings loaded from per-user config on SSD (~/.lxide/config.json)
const userConfig = loadUserConfig();
const appSettings = {
  projectsDir: userConfig.projectsDir,
  aiApiKey: userConfig.aiApiKey,
  aiBaseUrl: userConfig.aiBaseUrl,
  aiModel: userConfig.aiModel,
  tectonicPath: userConfig.tectonicPath
};

// Ensure default demo project exists in the active storage directory and has snapshot
function ensureDemoProject() {
  const currentDir = getProjectStorageDir();
  const demoPath = path.join(currentDir, 'PrismForge_Demo');
  if (!fs.existsSync(demoPath)) {
    createProject('PrismForge_Demo', 'article');
  } else {
    try {
      const snaps = listSnapshots(demoPath);
      if (snaps.length === 0) {
        createSnapshot(demoPath, 'Initial demo baseline');
      }
    } catch {}
  }
}
ensureDemoProject();

// Helpers
function getProjectPath(name) {
  const sanitized = name.replace(/[^a-zA-Z0-9_-]/g, '_');
  const projPath = path.join(getProjectStorageDir(), sanitized);
  if (!fs.existsSync(projPath)) {
    throw new Error(`Project '${name}' not found.`);
  }
  return projPath;
}

// -------------------------------------------------------------
// Projects API
// -------------------------------------------------------------
app.get('/api/projects', (req, res) => {
  try {
    const list = listProjects();
    res.json({ projects: list, templates: TEMPLATES });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/projects', (req, res) => {
  try {
    const { name, template = 'article' } = req.body;
    if (!name) return res.status(400).json({ error: 'Project name is required' });
    const project = createProject(name, template);
    res.json({ project });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/projects/import-zip', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No zip file uploaded' });
    }
    const result = importZipProject(req.file.path, req.file.originalname);
    res.json({ success: true, project: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/projects/:name', (req, res) => {
  try {
    const success = deleteProject(req.params.name);
    res.json({ success });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/projects/:name/export', (req, res) => {
  try {
    const projPath = getProjectPath(req.params.name);
    exportProjectZip(projPath, res);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

app.get('/api/projects/:name/tree', (req, res) => {
  try {
    const projPath = getProjectPath(req.params.name);
    const tree = getProjectTree(projPath);
    res.json({ tree });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// Files API
// -------------------------------------------------------------
app.get('/api/projects/:name/file', (req, res) => {
  try {
    const projPath = getProjectPath(req.params.name);
    const filePath = req.query.path;
    if (!filePath) return res.status(400).json({ error: 'Missing path query parameter' });

    const safePath = path.resolve(projPath, filePath);
    if (!safePath.startsWith(projPath)) {
      return res.status(403).json({ error: 'Access denied: Path outside project' });
    }

    if (!fs.existsSync(safePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const content = fs.readFileSync(safePath, 'utf8');
    res.json({ content, path: filePath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/projects/:name/file', (req, res) => {
  try {
    const projPath = getProjectPath(req.params.name);
    const { path: relPath, content } = req.body;
    if (!relPath) return res.status(400).json({ error: 'Missing file path' });

    const safePath = path.resolve(projPath, relPath);
    if (!safePath.startsWith(projPath)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    fs.mkdirSync(path.dirname(safePath), { recursive: true });
    fs.writeFileSync(safePath, content, 'utf8');

    res.json({ success: true, path: relPath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/projects/:name/create-item', (req, res) => {
  try {
    const projPath = getProjectPath(req.params.name);
    const { path: relPath, type = 'file' } = req.body;
    const safePath = path.resolve(projPath, relPath);
    if (!safePath.startsWith(projPath)) return res.status(403).json({ error: 'Access denied' });

    if (type === 'directory') {
      fs.mkdirSync(safePath, { recursive: true });
    } else {
      fs.mkdirSync(path.dirname(safePath), { recursive: true });
      if (!fs.existsSync(safePath)) fs.writeFileSync(safePath, '', 'utf8');
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/projects/:name/delete-item', (req, res) => {
  try {
    const projPath = getProjectPath(req.params.name);
    const { path: relPath } = req.body;
    const safePath = path.resolve(projPath, relPath);
    if (!safePath.startsWith(projPath) || safePath === projPath) {
      return res.status(403).json({ error: 'Cannot delete project root' });
    }

    if (fs.existsSync(safePath)) {
      fs.rmSync(safePath, { recursive: true, force: true });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// Compilation & PDF Preview API
// -------------------------------------------------------------
app.post('/api/projects/:name/compile', async (req, res) => {
  try {
    const projPath = getProjectPath(req.params.name);
    const { mainFile = 'main.tex' } = req.body || {};

    // Automatically snapshot before compile so revision history tracks changes
    try {
      createSnapshot(projPath, `Auto-saved compile (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })})`);
    } catch (snapErr) {
      console.warn('Auto-snapshot warning:', snapErr.message);
    }

    const result = await compileProject({
      projectDir: projPath,
      mainFile,
      tectonicPath: appSettings.tectonicPath
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({
      success: false,
      errors: [{ message: err.message, line: null }],
      warnings: [],
      pdfPath: null
    });
  }
});

app.get('/api/projects/:name/pdf', (req, res) => {
  try {
    const projPath = getProjectPath(req.params.name);
    const pdfPath = getLastPdf(projPath) || path.join(projPath, 'output', 'main.pdf');

    if (!fs.existsSync(pdfPath)) {
      return res.status(404).send('PDF not yet generated. Please compile the project.');
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="main.pdf"');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    return res.sendFile(path.resolve(pdfPath));
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get('/api/projects/:name/has-pdf', (req, res) => {
  try {
    const projPath = getProjectPath(req.params.name);
    const pdfPath = getLastPdf(projPath) || path.join(projPath, 'output', 'main.pdf');
    res.json({ hasPdf: fs.existsSync(pdfPath) });
  } catch (err) {
    res.json({ hasPdf: false });
  }
});

// -------------------------------------------------------------
// Quality Checks / Diagnostics API
// -------------------------------------------------------------
app.get('/api/projects/:name/diagnostics', (req, res) => {
  try {
    const projPath = getProjectPath(req.params.name);
    const issues = runDiagnostics(projPath);
    res.json({ issues });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// Version History & Snapshots API
// -------------------------------------------------------------
app.post('/api/projects/:name/snapshots', (req, res) => {
  try {
    const projPath = getProjectPath(req.params.name);
    const { description } = req.body;
    const snap = createSnapshot(projPath, description || 'Manual snapshot');
    res.json({ snapshot: snap });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/projects/:name/snapshots', (req, res) => {
  try {
    const projPath = getProjectPath(req.params.name);
    const list = listSnapshots(projPath);
    res.json({ snapshots: list });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/projects/:name/snapshots/:id/file', (req, res) => {
  try {
    const projPath = getProjectPath(req.params.name);
    const relPath = req.query.path || 'main.tex';
    const content = getSnapshotFileContent(projPath, req.params.id, relPath);
    if (content === null) {
      return res.status(404).json({ error: 'File not found in snapshot' });
    }
    res.json({ content, path: relPath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/projects/:name/snapshots/:id/restore', (req, res) => {
  try {
    const projPath = getProjectPath(req.params.name);
    const result = restoreSnapshot(projPath, req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// Clean ZIP Export API
// -------------------------------------------------------------
app.get('/api/projects/:name/export', (req, res) => {
  try {
    const projPath = getProjectPath(req.params.name);
    exportProjectZip(projPath, res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// AI Assistant API
// -------------------------------------------------------------
app.post('/api/ai/assist', async (req, res) => {
  try {
    const {
      action,
      selectedText,
      contextText,
      errorDetails,
      userPrompt,
      apiKey: customKey,
      baseUrl: customBase,
      model: customModel
    } = req.body;

    const apiKey = customKey || appSettings.aiApiKey;
    const baseUrl = customBase || appSettings.aiBaseUrl;
    const model = customModel || appSettings.aiModel;

    const result = await requestAiAssistance({
      action,
      selectedText,
      contextText,
      errorDetails,
      userPrompt,
      apiKey,
      baseUrl,
      model
    });

    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// Settings API
// -------------------------------------------------------------
app.get('/api/settings', (req, res) => {
  const current = loadUserConfig();
  res.json({
    projectsDir: current.projectsDir || getProjectStorageDir(),
    aiApiKey: current.aiApiKey ? `${current.aiApiKey.slice(0, 10)}...${current.aiApiKey.slice(-4)}` : '',
    hasApiKey: Boolean(current.aiApiKey),
    aiBaseUrl: current.aiBaseUrl,
    aiModel: current.aiModel,
    tectonicPath: current.tectonicPath
  });
});

app.post('/api/settings', (req, res) => {
  const { projectsDir, aiApiKey, aiBaseUrl, aiModel, tectonicPath } = req.body;
  const updates = {};
  if (projectsDir !== undefined && projectsDir.trim()) updates.projectsDir = projectsDir.trim();
  if (aiApiKey !== undefined && aiApiKey !== 'REDACTED') updates.aiApiKey = aiApiKey;
  if (aiBaseUrl !== undefined) updates.aiBaseUrl = aiBaseUrl;
  if (aiModel !== undefined) updates.aiModel = aiModel;
  if (tectonicPath !== undefined) updates.tectonicPath = tectonicPath;

  const saved = saveUserConfig(updates);
  Object.assign(appSettings, saved);

  // If projects directory changed, make sure demo baseline exists in the new location
  ensureDemoProject();

  res.json({ success: true, settings: saved });
});

// Open folder directly in Windows File Explorer
app.post('/api/open-folder', (req, res) => {
  try {
    const { projectName, folderPath } = req.body || {};
    let target = getProjectStorageDir();
    if (projectName) {
      const sanitized = projectName.replace(/[^a-zA-Z0-9_-]/g, '_');
      target = path.join(target, sanitized);
    } else if (folderPath && folderPath.trim()) {
      target = folderPath.trim();
    }

    if (!fs.existsSync(target)) {
      fs.mkdirSync(target, { recursive: true });
    }

    const winPath = target.replace(/\//g, '\\');
    exec(`explorer.exe "${winPath}"`, (err) => {
      // In Windows, explorer.exe returns exit code 1 even on successful launch
      if (err && err.code !== 1) {
        console.warn('Failed to launch explorer.exe:', err.message);
      }
    });

    res.json({ success: true, path: target });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve production static frontend if built
function getClientDistDir() {
  const candidates = [
    path.resolve(__dirname, '..', 'client', 'dist'),
    process.env.RESOURCES_PATH ? path.resolve(process.env.RESOURCES_PATH, 'app.asar.unpacked', 'client', 'dist') : null,
    process.env.RESOURCES_PATH ? path.resolve(process.env.RESOURCES_PATH, 'client', 'dist') : null,
    path.resolve(process.cwd(), 'client', 'dist')
  ].filter(Boolean);

  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return candidates[0];
}

const clientDist = getClientDistDir();
if (fs.existsSync(clientDist)) {
  console.log(`📦 Serving static frontend from: ${clientDist}`);
  app.use(express.static(clientDist));

  app.get('/', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });

  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/projects')) {
      return res.sendFile(path.join(clientDist, 'index.html'));
    }
    next();
  });
} else {
  console.warn(`⚠️ Warning: clientDist not found at ${clientDist}`);
}

// Start Express Server
const server = app.listen(PORT, '127.0.0.1', () => {
  console.log(`\n======================================================`);
  console.log(`🚀 LX-IDE Backend listening at http://127.0.0.1:${PORT}`);
  console.log(`======================================================\n`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`⚡ Port ${PORT} already active (running in existing instance)`);
  } else {
    console.error('Server listen error:', err);
  }
});
