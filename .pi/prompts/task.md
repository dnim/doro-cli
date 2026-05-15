---
description: Start working on a Backlog task end-to-end
argument-hint: "<task-id>"
---
Look up task $1 with `npx backlog task get $1`. Set it In Progress, create a feature branch named `tasks/$1-<short-slug>`, then implement it following AGENTS.md conventions.

Before requesting commit approval: run typecheck, lint, and unit tests. Fix any failures. Then present the proposed commit message and wait for explicit approval.

During development, prefer `lint:changed` and `test:unit:changed` for faster feedback. Switch to full `lint` + `test:unit` for the final pre-commit gate.
