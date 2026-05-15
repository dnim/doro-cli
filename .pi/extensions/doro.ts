/**
 * doro-cli Extension
 *
 * Provides named, domain-specific tools so the agent never has to recall
 * the exact npm script names or backlog CLI flags.
 *
 * Tools:
 *   unit_tests        – vitest run
 *   visual_tests      – build + playwright test
 *   update_snapshots  – build + playwright test --update-snapshots
 *   typecheck         – tsc --noEmit
 *   lint              – eslint .
 *   task_list         – npx backlog task list
 */

import { Type } from '@earendil-works/pi-ai';
import { defineTool, type ExtensionAPI } from '@earendil-works/pi-coding-agent';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

function run(cmd: string, args: string[], cwd: string): string {
  const result = spawnSync(cmd, args, {
    cwd,
    encoding: 'utf8',
    timeout: 120_000,
    env: { ...process.env, FORCE_COLOR: '0' }
  });
  const out = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
  if (result.status !== 0) {
    throw new Error(out || `Process exited with code ${result.status}`);
  }
  return out || '(no output)';
}

function npmTool(name: string, label: string, description: string, scriptName: string) {
  return defineTool({
    name,
    label,
    description,
    parameters: Type.Object({}),
    async execute(_id, _params, _signal, _onUpdate, ctx) {
      const cwd = resolve(ctx.workingDirectory);
      const output = run('npm', ['run', scriptName], cwd);
      return {
        content: [{ type: 'text', text: output }],
        details: { script: scriptName, cwd }
      };
    }
  });
}

export default function (pi: ExtensionAPI) {
  pi.registerTool(
    npmTool(
      'unit_tests',
      'Unit Tests',
      'Run the doro-cli unit test suite (vitest). Use after code changes before requesting commit approval.',
      'test:unit'
    )
  );

  pi.registerTool(
    npmTool(
      'visual_tests',
      'Visual Tests',
      "Build doro-cli and run Playwright visual regression tests. Use to verify TUI rendering hasn't regressed.",
      'test:visual'
    )
  );

  pi.registerTool(
    npmTool(
      'update_snapshots',
      'Update Snapshots',
      'Build doro-cli and update Playwright visual regression snapshots. Only use when intentional visual changes were made.',
      'test:visual:update'
    )
  );

  pi.registerTool(
    npmTool(
      'typecheck',
      'Typecheck',
      'Run TypeScript type checking (tsc --noEmit) across the whole project.',
      'typecheck'
    )
  );

  pi.registerTool(
    npmTool(
      'lint',
      'Lint',
      'Run ESLint across the whole project. Use before requesting commit approval.',
      'lint'
    )
  );

  pi.registerTool(
    npmTool(
      'unit_tests_changed',
      'Unit Tests (Changed)',
      'Run vitest only for tests related to files changed since the last commit. Faster than full unit_tests; use for quick feedback during development.',
      'test:unit:changed'
    )
  );

  pi.registerTool(
    npmTool(
      'lint_changed',
      'Lint (Changed)',
      'Run ESLint only on TypeScript files changed since the last commit (staged + unstaged). Faster than full lint; use for quick feedback during development.',
      'lint:changed'
    )
  );

  pi.registerTool(
    defineTool({
      name: 'task_list',
      label: 'Task List',
      description:
        'List all Backlog.md tasks with their current status. Use before creating a new task to avoid duplicates.',
      parameters: Type.Object({}),
      async execute(_id, _params, _signal, _onUpdate, ctx) {
        const cwd = resolve(ctx.workingDirectory);
        const output = run('npx', ['backlog', 'task', 'list'], cwd);
        return {
          content: [{ type: 'text', text: output }],
          details: { cwd }
        };
      }
    })
  );
}
