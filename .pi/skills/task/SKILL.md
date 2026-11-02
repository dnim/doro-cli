---
name: task
description: Create, update, or implement project tasks using the Backlog.md workflow. Use for task planning, acceptance criteria, or task lifecycle changes.
---

# Backlog task workflow

1. Search for relevant work with `backlog task list --plain` or `backlog search "<terms>" --plain`. If the CLI is unavailable, say so; do not edit task files directly.
2. Reuse an existing task when appropriate. For new work, clarify scope and acceptance criteria before creating a task unless the user has already specified them.
3. Use `backlog task create` and `backlog task edit` for all changes. Check the CLI help when syntax is uncertain.
4. Before implementing a tracked task, set it In Progress and assign yourself. Keep acceptance criteria current; mark Done only after the criteria and definition of done are satisfied.
5. Add a concise final summary through the CLI when the task is complete.
