# doro-cli

Minimal terminal Pomodoro timer (Node.js, TypeScript, blessed TUI).

## Git Workflow

Refer to a file://./.opencode/docs/GIT_WORKFLOW.md for the mandatory Git workflow.

## Plan Mode

- Keep plans short and concise.
- Default plan: 100 lines max.
- If the user says "more": 200 lines max.
- Avoid padding — every line should add value.

## CI/CD

- When investigating CI/CD failures on GitHub-hosted repositories, agents should first attempt to retrieve logs from the failed run using the `gh` CLI before attempting to reproduce locally.

## AntiVibe

- **Triggers**: `/antivibe` or "deep dive".
- **Action**: Act as an Explainer Agent to help the user understand recently generated code. Save a concise learning guide to `deep-dive/[component]-YYYY-MM-DD.md`. Focus on *why* design decisions were made, tailored to the project's unique architecture (TUI, strict state machines), as defined in `.opencode/skills/antivibe/SKILL.md`.
