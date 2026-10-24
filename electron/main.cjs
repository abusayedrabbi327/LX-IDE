const { app, BrowserWindow, shell, utilityProcess } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');
const os = require('os');
const { fork } = require('child_process');

let mainWindow = null;
let serverProcess = null;
const SERVER_PORT = 4000;

// Enforce single instance
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(startApp);
}

function getServerPath() {
  if (app.isPackaged) {
    const unpacked = path.join(process.resourcesPath, 'app.asar.unpacked', 'server', 'index.js');
    if (fs.existsSync(unpacked)) {
      return unpacked;
    }
  }
  return path.join(__dirname, '..', 'server', 'index.js');
}

function getServerCwd() {
  if (app.isPackaged) {
    // Working directory must be a real physical directory on disk, never an asar archive!
    const userData = app.getPath('userData');
    if (!fs.existsSync(userData)) {
      try { fs.mkdirSync(userData, { recursive: true }); } catch {}
    }
    return userData;
  }
  return path.join(__dirname, '..');
}

function startServer() {
  const serverPath = getServerPath();
  const serverCwd = getServerCwd();

  const env = {
    ...process.env,
    PORT: String(SERVER_PORT),
    NODE_ENV: 'production',
    RESOURCES_PATH: process.resourcesPath || path.join(__dirname, '..'),
    TECTONIC_PATH: path.join(process.resourcesPath || path.join(__dirname, '..'), 'bin', 'tectonic.exe')
  };

  if (process.env.PORTABLE_EXECUTABLE_DIR) {
    env.PORTABLE_EXECUTABLE_DIR = process.env.PORTABLE_EXECUTABLE_DIR;
  }

  // Setup SSD logging in ~/.lxide/server.log
  const logDir = path.join(os.homedir(), '.lxide');
  if (!fs.existsSync(logDir)) {
    try { fs.mkdirSync(logDir, { recursive: true }); } catch {}
  }
  const logFile = fs.createWriteStream(path.join(logDir, 'server.log'), { flags: 'a' });
  logFile.write(`\n[${new Date().toISOString()}] Launching LX-IDE Server: ${serverPath} (cwd: ${serverCwd})\n`);

  try {
    if (utilityProcess && typeof utilityProcess.fork === 'function') {
      serverProcess = utilityProcess.fork(serverPath, [], {
        env,
        stdio: 'pipe',
        cwd: serverCwd
      });
      if (serverProcess.stdout) serverProcess.stdout.pipe(logFile);
      if (serverProcess.stderr) serverProcess.stderr.pipe(logFile);
    } else {
      serverProcess = fork(serverPath, [], {
        env,
        stdio: 'pipe',
        cwd: serverCwd
      });
      if (serverProcess.stdout) serverProcess.stdout.pipe(logFile);
      if (serverProcess.stderr) serverProcess.stderr.pipe(logFile);
    }

    serverProcess.on('error', (err) => {
      logFile.write(`[Server Process Error]: ${err.stack || err}\n`);
    });

    serverProcess.on('exit', (code, signal) => {
      logFile.write(`[Server Process Exited]: code=${code}, signal=${signal}\n`);
    });
  } catch (err) {
    logFile.write(`[Failed to spawn server process]: ${err.stack || err}\n`);
  }
}

function waitForServer(callback, maxAttempts = 60) {
  let attempts = 0;
  let finished = false;

  const done = () => {
    if (!finished) {
      finished = true;
      callback();
    }
  };

  const check = () => {
    if (finished) return;
    const req = http.get(`http://127.0.0.1:${SERVER_PORT}/api/settings`, (res) => {
      res.resume(); // consume response stream to free memory/socket
      if (res.statusCode === 200) {
        done();
      } else {
        retry();
      }
    });
    req.on('error', () => {
      retry();
    });
    req.setTimeout(1000, () => {
      req.destroy();
      retry();
    });
  };

  const retry = () => {
    if (finished) return;
    attempts++;
    if (attempts < maxAttempts) {
      setTimeout(check, 200);
    } else {
      console.warn('Server took longer than expected to start, attempting to open window...');
      done();
    }
  };

  check();
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'LX-IDE — Offline LaTeX Studio',
    backgroundColor: '#0b101b',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  });

  mainWindow.loadURL(`http://127.0.0.1:${SERVER_PORT}`);

  // Automatically retry loading if page fails to load on first attempt
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.loadURL(`http://127.0.0.1:${SERVER_PORT}`);
      }
    }, 1200);
  });

  // Handle external links in user default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      if (!url.includes(`127.0.0.1:${SERVER_PORT}`) && !url.includes(`localhost:${SERVER_PORT}`)) {
        shell.openExternal(url);
        return { action: 'deny' };
      }
    }
    return { action: 'allow' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startApp() {
  startServer();
  waitForServer(() => {
    createMainWindow();
  });
}

app.on('window-all-closed', () => {
  if (serverProcess) {
    try {
      serverProcess.kill();
    } catch {}
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('quit', () => {
  if (serverProcess) {
    try {
      serverProcess.kill();
    } catch {}
  }
});
