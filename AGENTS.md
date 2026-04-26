# doro-cli

Minimal terminal Pomodoro timer (Node.js, TypeScript, blessed TUI).

## Git Workflow

- **Never commit or make changes directly on `main`.**
- Always create a branch first:
  - `feature/<name>` for new features
  - `fix/<name>` for bug fixes
  - `chore/<name>` for tooling, config, or maintenance work
  - `release/v<version>` for release preparation
- Only merge to `main` via a pull request.
- **Never push to remote without explicit user approval.**
- **Automatic Lockfile Sync**: If `package.json` is modified (e.g., version bump), you MUST run `npm install` to update `package-lock.json` before committing or pushing.

## Plan Mode

- Keep plans short and concise.
- Default plan: 100 lines max.
- If the user says "more": 200 lines max.
- Avoid padding — every line should add value.

## CI/CD

- When investigating CI/CD failures on GitHub-hosted repositories, agents should first attempt to retrieve logs from the failed run using the `gh` CLI before attempting to reproduce locally.

## AntiVibe

- **Triggers**: `/antivibe` or "deep dive".
- **Action**: Act as an Explainer Agent to help the user understand recently generated code. Save a concise learning guide to `deep-dive/[component]-YYYY-MM-DD.md`. Focus on *why* design decisions were made, tailored to the project's unique architecture (TUI, strict state machines), as defined in `.opencode/skills/antivibe.md`.
