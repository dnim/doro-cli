/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect, Page } from '@playwright/test';
import { createRequire } from 'module';
import * as path from 'path';
import * as fs from 'fs';
import type { IPty } from 'node-pty';

const require = createRequire(import.meta.url);
const pty = require('node-pty');

test.describe('Doro CLI Visual Regression', () => {
  let ptyProcess: IPty;

  test.afterEach(() => {
    if (ptyProcess) {
      ptyProcess.kill();
    }
  });

  async function setupTerminal(
    page: Page,
    cols: number,
    rows: number,
    theme: 'modern' | 'calm' = 'modern'
  ) {
    const rootDir = process.cwd();

    // Create a temporary config directory
    const testConfigDir = path.resolve(rootDir, 'tests/test-config');
    const appConfigDir = path.join(testConfigDir, 'doro-cli-nodejs');
    if (!fs.existsSync(appConfigDir)) {
      fs.mkdirSync(appConfigDir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(appConfigDir, 'settings.json'),
      JSON.stringify({ volumeMode: 'muted', colorScheme: theme })
    );

    const terminalHtml = `file://${path.resolve(rootDir, 'tests/terminal.html')}`;
    await page.goto(terminalHtml);
    await page.waitForFunction(() => (window as any).term);

    // Precise terminal sizing to avoid subpixel shifts
    await page.evaluate(
      ({ c, r }) => {
        const term = (window as any).term;
        term.resize(c, r);

        // Calculate precise pixel dimensions (char width ~9.6px, height ~19px)
        // We use a safe estimate and let padding be constant
        const container = document.getElementById('terminal-container');
        if (container) {
          container.style.width = `${c * 10 + 40}px`; // 40px for padding/borders
          container.style.height = `${r * 20 + 40}px`;
        }
      },
      { c: cols, r: rows }
    );

    const cliPath = path.resolve(rootDir, 'dist/cli.js');
    ptyProcess = pty.spawn('node', [cliPath], {
      name: 'xterm-color',
      cols,
      rows,
      cwd: rootDir,
      env: {
        ...process.env,
        TERM: 'xterm-256color',
        COLORTERM: 'truecolor',
        XDG_CONFIG_HOME: testConfigDir
      }
    });

    await page.exposeFunction('sendPtyData', (data: string) => {
      ptyProcess.write(data);
    });

    ptyProcess.onData((data: string) => {
      page
        .evaluate((d) => (window as any).term.write(d), data)
        .catch(() => {
          /* ignore write errors during teardown */
        });
    });

    await page.evaluate(() => {
      (window as any).term.onData((data: string) => {
        (window as any).sendPtyData(data);
      });
    });

    // Stabilization wait
    await page.waitForTimeout(1500);
  }

  const SIZES = [
    { name: 'large', cols: 80, rows: 24 },
    { name: 'small', cols: 44, rows: 8 },
    { name: 'ultra-small', cols: 24, rows: 5 },
    { name: 'tiny', cols: 16, rows: 3 }
  ];

  const THEMES: ('modern' | 'calm')[] = ['modern', 'calm'];

  for (const theme of THEMES) {
    test.describe(`${theme} theme`, () => {
      for (const size of SIZES) {
        test.describe(`${size.name} terminal (${size.cols}x${size.rows})`, () => {
          test('work mode', async ({ page }) => {
            await setupTerminal(page, size.cols, size.rows, theme);
            await expect(page.locator('#terminal-container')).toHaveScreenshot(
              `${theme}-${size.name}-work.png`
            );
          });

          test('paused state', async ({ page }) => {
            await setupTerminal(page, size.cols, size.rows, theme);
            await page.evaluate(() => (window as any).sendPtyData('p'));
            await page.waitForTimeout(1000);
            await expect(page.locator('#terminal-container')).toHaveScreenshot(
              `${theme}-${size.name}-paused.png`
            );
          });

          test('short rest mode', async ({ page }) => {
            await setupTerminal(page, size.cols, size.rows, theme);
            await page.evaluate(() => (window as any).sendPtyData('s'));
            await page.waitForTimeout(1000);
            await expect(page.locator('#terminal-container')).toHaveScreenshot(
              `${theme}-${size.name}-short.png`
            );
          });

          test('done screen', async ({ page }) => {
            await setupTerminal(page, size.cols, size.rows, theme);
            await page.evaluate(() => (window as any).sendPtyData('D'));
            await page.waitForTimeout(4000);
            await expect(page.locator('#terminal-container')).toHaveScreenshot(
              `${theme}-${size.name}-done.png`
            );
          });

          if (size.name === 'tiny' || size.name === 'ultra-small') {
            test('quiet volume mode', async ({ page }) => {
              await setupTerminal(page, size.cols, size.rows, theme);
              await page.evaluate(() => (window as any).sendPtyData('m')); // Toggle to quiet
              await page.waitForTimeout(1000);
              await expect(page.locator('#terminal-container')).toHaveScreenshot(
                `${theme}-${size.name}-quiet.png`
              );
            });

            test('muted volume mode', async ({ page }) => {
              await setupTerminal(page, size.cols, size.rows, theme);
              await page.evaluate(() => (window as any).sendPtyData('m')); // Toggle to quiet
              await page.waitForTimeout(500);
              await page.evaluate(() => (window as any).sendPtyData('m')); // Toggle to muted
              await page.waitForTimeout(1000);
              await expect(page.locator('#terminal-container')).toHaveScreenshot(
                `${theme}-${size.name}-muted.png`
              );
            });
          }

          // Update prompt scenarios (4 states × 2 themes × 4 sizes = 32 snapshots)
          test('update available prompt', async ({ page }) => {
            await setupTerminal(page, size.cols, size.rows, theme);

            // Trigger Shift+U to show update prompt
            await page.evaluate(() => (window as any).sendPtyData('\u001B[1;2u')); // Shift+U sequence
            await page.waitForTimeout(1500);

            await expect(page.locator('#terminal-container')).toHaveScreenshot(
              `${theme}-${size.name}-update-available.png`
            );
          });

          test('update copy success state', async ({ page }) => {
            await setupTerminal(page, size.cols, size.rows, theme);

            // Simulate accepting an update (this would show copy success state in real app)
            // For VRT purposes, we'll create a test mode that simulates this state
            await page.evaluate(() => {
              // Send a special test command that triggers copy success state
              (window as any).sendPtyData('\u001B[test-update-copy-success]');
            });
            await page.waitForTimeout(1000);

            await expect(page.locator('#terminal-container')).toHaveScreenshot(
              `${theme}-${size.name}-update-copy-success.png`
            );
          });

          test('update copy fallback state', async ({ page }) => {
            await setupTerminal(page, size.cols, size.rows, theme);

            await page.evaluate(() => {
              (window as any).sendPtyData('\u001B[test-update-copy-fallback]');
            });
            await page.waitForTimeout(1000);

            await expect(page.locator('#terminal-container')).toHaveScreenshot(
              `${theme}-${size.name}-update-copy-fallback.png`
            );
          });

          test('update skipped state', async ({ page }) => {
            await setupTerminal(page, size.cols, size.rows, theme);

            await page.evaluate(() => {
              (window as any).sendPtyData('\u001B[test-update-skipped]');
            });
            await page.waitForTimeout(1000);

            await expect(page.locator('#terminal-container')).toHaveScreenshot(
              `${theme}-${size.name}-update-skipped.png`
            );
          });
        });
      }
    });
  }
});
