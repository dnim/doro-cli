---
name: task
description: Implement a new feature or task. Enforces the AIDLC workflow (AI Development Life Cycle). Starts by searching Backlog.md, discussing requirements, and then creating a task before implementation.
---

# Task Implementation (AIDLC & Backlog.md Workflow)

## Flow Overview

This skill enforces the **AIDLC** (AI Development Life Cycle) via the **Backlog.md** tool. 
When invoked (e.g., `/task implement something`), follow these steps exactly:

### 1. Search First
Check if the task already exists in the backlog.
```bash
npx backlog task list
# Or grep for keywords
```

### 2. If Task Exists
- Surface the existing task to the user.
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
Once requirements and ACs are agreed upon, create the task:
```bash
npx backlog task create -t "<Agreed Title>" --description "<Agreed Description and ACs>"
```
*Note: Do not create the task until the discussion is complete.*

### 5. Final Steps
After the task is created, ask the user if they want to move it to `In Progress` and start implementation immediately (using branch naming conventions as specified in the `backlog-workflow` skill).
