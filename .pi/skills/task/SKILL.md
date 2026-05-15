---
name: task
description: Implement a new feature or task. Enforces the AIDLC workflow (AI Development Life Cycle). Starts by searching Backlog.md, discussing requirements, and then creating a task before implementation.
---

# Task Implementation (AIDLC & Backlog.md Workflow)

## Flow Overview

This skill enforces the **AIDLC** (AI Development Life Cycle) via the **Backlog.md** tool. 
When invoked (e.g., `/task implement something`), follow these steps exactly:

### 1. Search First
Check if the task already exists in the backlog. Use `npx backlog search` to search globally, or list tasks:
```bash
npx backlog search "<keywords>"
# or
npx backlog task list
```

### 2. If Task Exists
- Surface the existing task using `npx backlog task view <taskId>`.
- Stop and ask the user how they want to proceed (e.g., "Do you want to start working on this now?").

### 3. If Task DOES NOT Exist (AIDLC Phase)
- Treat the user's input as an **initial placeholder** or idea.
- **Do not create the task immediately.**
- Enter a discussion phase with the user to elaborate on the requirement:
  - Ask clarifying questions about the feature.
  - Define clear Acceptance Criteria (ACs).
  - Research existing code if needed.
- Wait for the user to confirm the requirements.

### 4. Create Task
Once requirements and ACs are agreed upon, create the task. Pass ACs correctly using multiple `--ac` flags so they are structured natively:
```bash
npx backlog task create -t "<Agreed Title>" --description "<Agreed Description>" --ac "<First AC>" --ac "<Second AC>"
```
*Note: Do not create the task until the discussion is complete. Ensure you include the related branch in the task description or comments if one is used.*

### 5. Start Work
If the user wants to start work immediately:
1. Update the status using `npx backlog task edit <taskId> --status "In Progress" --assignee "@me"`
2. Create the branch using branch naming conventions (`tasks/<taskId>-<slug>`).
3. Follow `AGENTS.md` conventions to implement the task.
