---
description: Implement a feature or task using the AIDLC workflow
argument-hint: "<task-id or description>"
---
Task request: $@

Please apply the `task` skill (`.pi/skills/task/SKILL.md`) to handle this request.
Use the provided request text to search the backlog. 
- If a task doesn't exist, enter the AIDLC discussion phase to define requirements before creating it.
- If it does exist (or once created), set it In Progress, create a feature branch (`tasks/<id>-<slug>`), and implement it following AGENTS.md conventions.

Before requesting commit approval: run typecheck, lint, and unit tests. Fix any failures. Then present the proposed commit message and wait for explicit approval.

During development, prefer `lint:changed` and `test:unit:changed` for faster feedback. Switch to full `lint` + `test:unit` for the final pre-commit gate.