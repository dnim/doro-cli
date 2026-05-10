import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadSettings, saveSettings, resetSettings, type Settings } from '../config';

// Mock env-paths
vi.mock('env-paths', () => {
  return {
    default: vi.fn().mockReturnValue({
      config: '/mock/config/path'
    })
  };
});

// Mock fs
vi.mock('node:fs', () => ({
  default: {
    existsSync: vi.fn(),
    promises: {
      readFile: vi.fn(),
      writeFile: vi.fn(),
      mkdir: vi.fn()
    }
  }
}));

describe('config', () => {
  const mockConfigDir = '/mock/config/path';
  const mockConfigFile = path.join(mockConfigDir, 'settings.json');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadSettings', () => {
    it('should return default settings if config file does not exist', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      const settings = await loadSettings();
      expect(settings).toEqual({
        volumeMode: 'normal',
        colorScheme: 'modern',
        checkIntervalHours: 24
      });
    });

    it('should return parsed settings if config file exists', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.promises.readFile).mockResolvedValue(
        JSON.stringify({ volumeMode: 'quiet', colorScheme: 'calm' })
      );
      const settings = await loadSettings();
      expect(settings).toEqual({
        volumeMode: 'quiet',
        colorScheme: 'calm',
        checkIntervalHours: 24
      });
    });

    it('should return default settings on read error', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.promises.readFile).mockRejectedValue(new Error('Read error'));
      const settings = await loadSettings();
      expect(settings).toEqual({
        volumeMode: 'normal',
        colorScheme: 'modern',
        checkIntervalHours: 24
      });
    });
  });

  describe('saveSettings', () => {
    it('should create directory and write file', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      const settings: Settings = { volumeMode: 'muted', colorScheme: 'modern' };
      await saveSettings(settings);
      expect(fs.promises.mkdir).toHaveBeenCalledWith(mockConfigDir, { recursive: true });
      expect(fs.promises.writeFile).toHaveBeenCalledWith(
        mockConfigFile,
        expect.stringContaining('"volumeMode": "muted"'),
        'utf8'
      );
    });

    it('should not create directory if it exists', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      const settings: Settings = { volumeMode: 'normal', colorScheme: 'calm' };
      await saveSettings(settings);
      expect(fs.promises.mkdir).not.toHaveBeenCalled();
      expect(fs.promises.writeFile).toHaveBeenCalled();
    });

    it('should log error on save failure', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      vi.mocked(fs.promises.writeFile).mockRejectedValue(new Error('Write error'));

      await saveSettings({ volumeMode: 'normal', colorScheme: 'modern' });

      expect(consoleSpy).toHaveBeenCalledWith('Failed to save settings:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('resetSettings', () => {
    it('should save and return default settings', async () => {
      const settings = await resetSettings();
      expect(settings).toEqual({
        volumeMode: 'normal',
        colorScheme: 'modern',
        checkIntervalHours: 24
      });
      expect(fs.promises.writeFile).toHaveBeenCalled();
    });
  });
});
