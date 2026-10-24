# ⚡ LX-IDE — Offline LaTeX Studio

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Windows%20|%20Web-emerald)](https://github.com/abusayedrabbi327/LX-IDE)
[![Framework](https://img.shields.io/badge/Stack-Electron%20%2B%20React%20%2B%20Express-indigo)](https://github.com/abusayedrabbi327/LX-IDE)
[![Compiler](https://img.shields.io/badge/Engine-Tectonic%20(Embedded%20Offline)-orange)](https://tectonic-typesetting.github.io/)

> **LX-IDE** is a modern, privacy-first, standalone LaTeX editorial studio inspired by Overleaf. It delivers a full-featured academic writing experience with a bundled zero-config compiler, real-time PDF preview, visual revision diffs, and transparent SSD file management—**100% offline with zero cloud dependency**.

---

## ✨ Key Features

- **🚀 100% Offline Zero-Setup Engine**: Powered by an embedded standalone [Tectonic](https://tectonic-typesetting.github.io/) compiler (`bin/tectonic.exe`). Requires **no** 5GB+ TeX Live or MiKTeX installations.
- **🖥️ Overleaf-Grade Studio**:
  - Resizable split-pane layout (Interactive Project Tree ⟷ Code Editor ⟷ PDF Viewer).
  - Dark-mode scientific editor powered by CodeMirror with LaTeX syntax highlighting.
  - Interactive PDF toolbar with sync, zoom controls, and smart fallback retaining the last valid PDF during draft syntax errors.
- **📚 Integrated BibTeX Reference Manager**:
  - Scan, manage, and search citations.
  - 1-click citation insertion (`\cite{...}`) directly into your cursor position.
- **🔍 Real-Time Diagnostic Scanner**:
  - Deterministic sanity checker catching missing `\label`, dangling `\ref`, and unclosed LaTeX environments before compilation.
- **🕒 Visual Revision History & Rollback**:
  - Non-destructive snapshot engine capturing complete project states with custom commit descriptions.
  - GitHub-style colored side-by-side and inline diffs comparing revisions.
  - 1-click version restore.
- **💾 Transparent SSD File System**:
  - Projects live in normal, accessible folders on your SSD (`C:\Users\<user>\Documents\LX-IDE-Projects`).
  - Drag and drop figures, images, or bibliography files directly from Windows File Explorer.
  - Per-user configuration isolation (`~/.lxide/config.json`) preserving individual setups across updates.
- **📦 Native Windows Desktop App**:
  - Run as a lightweight Electron desktop app or through any browser.
  - Packaged portable Windows `.exe` ready for USB drives and instant offline laptop use.

---

## 🚀 Quick Start

### Option 1: 1-Click Launchers (No Terminal Required)
Simply double-click any of the pre-configured Windows launchers:
* **`Start-LX-IDE.bat`**: Master menu to choose between Desktop App or Web Browser mode.
* **`Start-Desktop-App.bat`**: Instantly launches the native Electron desktop studio.
* **`Start-Web-App.bat`**: Starts the backend and opens your default browser at `http://localhost:5173`.
* **`Create-Desktop-Shortcut.bat`**: Places an `LX-IDE` shortcut directly on your Windows Desktop.

---

### Option 2: Running from Terminal

```bash
# 1. Clone the repository
git clone https://github.com/abusayedrabbi327/LX-IDE.git
cd LX-IDE

# 2. Install dependencies
npm install
npm --prefix client install

# 3. Launch in your preferred mode:

# Desktop App Mode (Electron Window)
npm start

# Web Browser Studio Mode (Vite Dev Server + API)
npm run dev
```

---

## 🛠️ Building the Standalone `.exe`

To package a single-file portable Windows executable (`release/LX-IDE.exe`):

```bash
# Builds the production React client and packages with electron-builder
npm run dist
```
The output file will be generated in `release/LX-IDE.exe` (~123 MB, fully portable with the embedded compiler included).

---

## 📁 Project Architecture

```
LX-IDE/
├── bin/
│   └── tectonic.exe              # Bundled portable offline LaTeX compiler
├── client/                       # Modern React 19 + TypeScript + Vite frontend
│   ├── src/
│   │   ├── components/           # Editor, PDF viewer, Dashboard, History, BibTeX
│   │   ├── App.tsx               # Main application controller
│   │   └── index.css             # Tailored dark-mode scientific UI design system
│   └── vite.config.ts
├── electron/
│   └── main.cjs                  # Electron desktop window & backend lifecycle process
├── server/                       # Node.js + Express backend service
│   ├── ai.js                     # AI manuscript editing & proofreading engine
│   ├── compiler.js               # Tectonic execution, log parsing & fallback caching
│   ├── config.js                 # Per-user SSD configuration & path management
│   ├── diagnostics.js            # Deterministic static syntax & reference checker
│   ├── index.js                  # REST API routes & static file server
│   └── projects.js               # Project CRUD, snapshot history & zip archiving
├── package.json
└── README.md
```

---

## ⌨️ Useful Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl + S` | Save active file |
| `Ctrl + Enter` | Recompile project |
| `Ctrl + F` | Search within file |
| `Ctrl + H` | Search and replace |

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
