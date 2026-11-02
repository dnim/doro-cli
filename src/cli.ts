#!/usr/bin/env node

import { DoroApp } from './app';
import { loadSettings } from './config';

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.includes('--version') || args.includes('-v')) {
    /* oxlint-disable no-console */
    // oxlint-disable-next-line typescript/no-require-imports
    const pkg = require('../package.json');
    console.log(pkg.version);
    /* oxlint-enable no-console */
    return;
  }
  if (args.includes('--help') || args.includes('-h')) {
    /* oxlint-disable no-console */
    console.log('doro - minimal terminal pomodoro timer');
    console.log('');
    console.log('Usage: doro [options]');
    console.log('');
    console.log('Options:');
    console.log('  -v, --version  Show version');
    console.log('  -h, --help     Show help');
    /* oxlint-enable no-console */
    process.exit(0);
  }

  const settings = await loadSettings();
  const app = new DoroApp(settings);
  app.bindProcessSignals();
  app.start();
}

void main();
