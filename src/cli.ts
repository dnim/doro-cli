#!/usr/bin/env node

import { DoroApp } from './app';

function main(): void {
  const args = process.argv.slice(2);
  if (args.includes('--version') || args.includes('-v')) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pkg = require('../package.json');
    console.log(pkg.version);
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

  const app = new DoroApp();
  app.bindProcessSignals();
  app.start();
}

main();
