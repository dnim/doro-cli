# doro-cli — Pi Agent Instructions

## Task & Feature Tracking

Always use Backlog.md to track work:

- Search for an existing task before creating one: `npx backlog task list`
- Create a task if none exists: `npx backlog task create`
- Update the task description/ACs to match the final agreed design before coding
- Keep status current: To Do → In Progress → Done
- Never start implementing without a Backlog task

## Design & Creative Tasks

**Before writing any code for UI, visual, or design work:**

1. Ask the user clarifying questions (placement, style, size, personality, constraints).
2. Present 2–3 concrete variants with clear trade-offs.
3. Wait for explicit approval before implementing.

This applies to: mascots, icons, color changes, layout changes, ASCII art, animations, copy/labels.

## Checks — Partial vs Full

Prefer the **changed-files** variants during development for faster feedback. Always run the **full** suite before requesting commit approval.

| Scope                         | Lint                   | Unit tests                  |
| ----------------------------- | ---------------------- | --------------------------- |
| **Changed files** (fast)      | `npm run lint:changed` | `npm run test:unit:changed` |
| **Full project** (pre-commit) | `npm run lint`         | `npm run test:unit`         |

These are also available as pi tools: `lint_changed`, `unit_tests_changed`, `lint`, `unit_tests`.
