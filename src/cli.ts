#!/usr/bin/env node

import { PapadoroApp } from './app';

function main(): void {
  const app = new PapadoroApp();
  app.bindProcessSignals();
  app.start();
}

main();
