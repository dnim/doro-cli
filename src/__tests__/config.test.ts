import fs from 'node:fs';
import path from 'node:path';
import { loadSettings, saveSettings, resetSettings, type Settings } from '../config';

// Mock env-paths
jest.mock('env-paths', () => {
  return jest.fn().mockReturnValue({
    config: '/mock/config/path'
  });
});

// Mock fs
jest.mock('node:fs', () => ({
  existsSync: jest.fn(),
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    mkdir: jest.fn()
  }
}));

describe('config', () => {
  const mockConfigDir = '/mock/config/path';
  const mockConfigFile = path.join(mockConfigDir, 'settings.json');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loadSettings', () => {
    it('should return default settings if config file does not exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      const settings = await loadSettings();
      expect(settings).toEqual({
        volumeMode: 'normal',
        colorScheme: 'modern',
        checkIntervalHours: 24
      });
    });

    it('should return parsed settings if config file exists', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock).mockResolvedValue(
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
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock).mockRejectedValue(new Error('Read error'));
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
      (fs.existsSync as jest.Mock).mockReturnValue(false);
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
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      const settings: Settings = { volumeMode: 'normal', colorScheme: 'calm' };
      await saveSettings(settings);
      expect(fs.promises.mkdir).not.toHaveBeenCalled();
      expect(fs.promises.writeFile).toHaveBeenCalled();
    });

    it('should log error on save failure', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (fs.promises.writeFile as jest.Mock).mockRejectedValue(new Error('Write error'));

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
