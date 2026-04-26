#!/usr/bin/env node

import { DoroApp } from './app';
import { loadSettings } from './config';

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.includes('--version') || args.includes('-v')) {
    /* eslint-disable no-console */
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pkg = require('../package.json');
    console.log(pkg.version);
    /* eslint-enable no-console */
    return;
  }
  if (args.includes('--help') || args.includes('-h')) {
    /* eslint-disable no-console */
    console.log('doro - minimal terminal pomodoro timer');
    console.log('');
    console.log('Usage: doro [options]');
    console.log('');
    console.log('Options:');
    console.log('  -v, --version  Show version');
    console.log('  -h, --help     Show help');
    /* eslint-enable no-console */
    process.exit(0);
  }

  const settings = await loadSettings();
  const app = new DoroApp(settings);
  app.bindProcessSignals();
  app.start();
}

void main();
