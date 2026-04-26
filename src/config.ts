import fs from 'node:fs';
import path from 'node:path';
import envPaths from 'env-paths';

export type Settings = {
  volumeMode: 'normal' | 'quiet' | 'muted';
  colorScheme: 'modern' | 'calm';
};

const DEFAULT_SETTINGS: Settings = {
  volumeMode: 'normal',
  colorScheme: 'modern'
};

const paths = envPaths('doro-cli');
const CONFIG_DIR = paths.config;
const CONFIG_FILE = path.join(CONFIG_DIR, 'settings.json');

export async function loadSettings(): Promise<Settings> {
  try {
    if (!fs.existsSync(CONFIG_FILE)) {
      return { ...DEFAULT_SETTINGS };
    }
    const data = await fs.promises.readFile(CONFIG_FILE, 'utf8');
    const parsed = JSON.parse(data);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  try {
    if (!fs.existsSync(CONFIG_DIR)) {
      await fs.promises.mkdir(CONFIG_DIR, { recursive: true });
    }
    await fs.promises.writeFile(CONFIG_FILE, JSON.stringify(settings, null, 2), 'utf8');
  } catch (error) {
    /* eslint-disable no-console */
    console.error('Failed to save settings:', error);
    /* eslint-enable no-console */
  }
}

export async function resetSettings(): Promise<Settings> {
  await saveSettings(DEFAULT_SETTINGS);
  return { ...DEFAULT_SETTINGS };
}
