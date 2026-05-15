---
name: backlog-workflow
description: Backlog.md task lifecycle for doro-cli. Use when creating, updating, or finalising tasks so the correct CLI commands, statuses, and branch conventions are followed.
---

# Backlog Workflow (doro-cli)

## Task lifecycle

```
To Do → In Progress → Done
```

## Commands

```bash
npx backlog task list                      # list all tasks
npx backlog task view <id>                 # read task detail
npx backlog task create -t "<title>" \
  --description "<desc>"                   # create a new task
npx backlog task edit <id> \
  --status "In Progress" -a @agent         # claim & start
npx backlog task edit <id> \
  --status "Done"                          # finalise
```

## Rules

1. **Search first** — run `npx backlog task list` and grep for keywords before creating a task.
2. **One task per feature** — never bundle unrelated work.
3. **Branch naming** — `tasks/<task-id>-<short-slug>` (e.g. `tasks/DORO-42-dark-mode`).
4. **Link branch** — Always add the related branch name to the task description or comments when creating/updating the task.
5. **Commit format** — `DORO-<id>: Title of the task`.
6. **Never commit to `main`** — create the branch before any code changes.
7. **Backlog auto-commit is disabled** — stage and commit `.backlog/` changes yourself.
8. **Assign yourself** — always pass `-a @agent` when setting In Progress.
