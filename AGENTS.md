# doro-cli Agent Instructions

`doro-cli` is a keyboard-first Pomodoro timer for Node.js, built with TypeScript and `neo-blessed`.

## Working style

- Be concise; do not narrate routine tool use or repeat established context.
- Prefer direct implementation for implementation requests. Ask only when requirements are genuinely ambiguous.
- Make focused changes, preserve existing patterns, and avoid unrelated files.
- Keep shared project guidance here. Platform-specific files should contain only setup or behavior that cannot live here.

## Project workflow

- Before starting work, use the Backlog CLI to find relevant existing work. Never edit task files directly or invent task IDs. If the CLI is unavailable, state that rather than bypassing it.
- When implementing a tracked task, assign it to yourself and keep its status and acceptance criteria current through the CLI.
- Never work directly on `main`; create a focused feature branch if needed.
- Do not commit or push without explicit user approval. Do not amend existing commits.
- Run the smallest relevant checks during development; before asking to commit, run lint, typecheck, and unit tests.
- For UI changes, add or update Playwright visual snapshots and run the relevant visual tests.

## Commands

- `npm run dev` — run from source
- `npm run build` — compile
- `npm run typecheck` — TypeScript check
- `npm run lint` / `npm run lint:changed` — Oxlint
- `npm run format` / `npm run format:check` — Oxfmt
- `npm run test:unit` / `npm run test:unit:changed` — Vitest
- `npm run test:visual` — Playwright visual tests

Use `package.json` as the source of truth for available scripts.

## Project conventions

- Keep timer transitions in the state machine and rendering in the UI layer.
- Preserve keyboard-first operation and readability in narrow terminals.
- Unit tests use Vitest; follow established test utilities and patterns.
- Use `gh` for GitHub issues, pull requests, and workflow runs.
- Treat Backlog.md as a CLI/MCP product: rely on its documented public interfaces, not internal source APIs.

## Instruction feedback

When asked to improve agent instructions, inspect all affected instruction/config surfaces, propose the specific changes, and wait for approval before editing. After approval, make focused edits; never amend a commit.

## AntiVibe

For `/antivibe` or “deep dive,” use `.agents/skills/antivibe/SKILL.md`.
