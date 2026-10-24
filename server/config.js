import fs from 'fs';
import path from 'path';
import os from 'os';

export const CONFIG_DIR = path.join(os.homedir(), '.lxide');
export const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

// Ensure user config directory exists on SSD
if (!fs.existsSync(CONFIG_DIR)) {
  try {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  } catch {}
}

// Determine default project directory on the SSD
export function getDefaultStorageDir() {
  if (process.env.DATA_DIR) {
    return path.resolve(process.env.DATA_DIR);
  }

  // Standard persistent SSD Documents folder
  const docsDir = path.join(os.homedir(), 'Documents', 'LX-IDE-Projects');
  if (fs.existsSync(docsDir)) {
    return docsDir;
  }

  // If running in development repo that already has a local projects folder
  const localProjectsDir = path.resolve(process.cwd(), 'projects');
  if (fs.existsSync(localProjectsDir)) {
    return localProjectsDir;
  }

  // Create standard SSD Documents folder
  try {
    fs.mkdirSync(docsDir, { recursive: true });
  } catch {}
  return docsDir;
}

// Default settings
const DEFAULT_CONFIG = {
  projectsDir: getDefaultStorageDir(),
  aiApiKey: process.env.AI_API_KEY || '',
  aiBaseUrl: process.env.AI_BASE_URL || 'https://openrouter.ai/api/v1',
  aiModel: process.env.AI_MODEL || 'openai/gpt-6-luna',
  tectonicPath: process.env.TECTONIC_PATH || 'bin/tectonic.exe'
};

export function loadUserConfig() {
  let fileConfig = {};
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      fileConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    } catch (e) {
      console.warn('Could not parse ~/.lxide/config.json, using defaults:', e.message);
    }
  }

  const merged = { ...DEFAULT_CONFIG, ...fileConfig };

  // Ensure storage folder exists
  if (merged.projectsDir && !fs.existsSync(merged.projectsDir)) {
    try {
      fs.mkdirSync(merged.projectsDir, { recursive: true });
    } catch (err) {
      console.warn(`Could not create projectsDir ${merged.projectsDir}, reverting to default`);
      merged.projectsDir = getDefaultStorageDir();
    }
  }

  return merged;
}

export function saveUserConfig(updated) {
  const current = loadUserConfig();
  const nextConfig = { ...current, ...updated };

  // Ensure projectsDir is valid
  if (nextConfig.projectsDir && !fs.existsSync(nextConfig.projectsDir)) {
    try {
      fs.mkdirSync(nextConfig.projectsDir, { recursive: true });
    } catch (e) {
      console.error('Failed to create custom projectsDir:', e);
    }
  }

  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(nextConfig, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to write ~/.lxide/config.json:', e);
  }

  return nextConfig;
}
