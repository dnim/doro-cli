# Task: Migrate to Backlog.md Architecture

## Context
Currently, the `doro-cli` project uses a hybrid folder structure (`_plans/active/`, `_plans/archive/`) with descriptive filenames like `feat-stats.md` and `fix-tiny-volume-indicator.md`[cite: 3]. To adopt the strict, AI-optimized `Backlog.md` approach, we need to enforce a sequential ID naming convention, introduce distinct lifecycle folders, and migrate our AI agent guidelines[cite: 3, 4].

## Acceptance Criteria (Migration Steps)

### 1. Rebuild the Directory Structure
Create the standardized `backlog/` folder hierarchy at the project root to replace `_plans/`[cite: 3, 4]:
- [ ] Create `backlog/drafts/` for unrefined ideas.
- [ ] Create `backlog/tasks/` for the active queue[cite: 4].
- [ ] Create `backlog/completed/` for recently finished work[cite: 4].
- [ ] Create `backlog/archive/` (with internal `drafts`, `tasks`, and `milestones` subfolders) for deep storage[cite: 4].
- [ ] Create `backlog/milestones/` for high-level goal tracking[cite: 4].

### 2. Standardize Task Naming (The ID System)
The `Backlog.md` system relies heavily on parsing IDs for web UI and CLI Kanban views (e.g., `back-100 - Add-embedded-web-server-to-Backlog-CLI.md`)[cite: 4]. 
- [ ] Define the project prefix (e.g., `doro-`).
- [ ] Rename all files in `_plans/active/`[cite: 3] to `backlog/tasks/doro-[ID] - [Kebab-Case-Title].md`.
    * *Example:* `feat-stats.md` becomes `doro-101 - implement-statistics-dashboard.md`[cite: 3, 4].
    * *Example:* `fix-tiny-volume-indicator.md` becomes `doro-102 - fix-tiny-volume-indicator.md`[cite: 3, 4].
- [ ] Convert any subtasks to use decimal notation (e.g., `doro-101.1`)[cite: 4].

### 3. Migrate AI Agent Instructions
`Backlog.md` treats AI agents as technical project managers with specific skills[cite: 4]. 
- [ ] Review the existing `.opencode/docs/AGENT_WORKFLOW.md`[cite: 3].
- [ ] Adapt it to the `Backlog.md` standard by creating a `.claude/agents/project-manager-backlog.md` file[cite: 4].
- [ ] Migrate your current `.gemini/skills/`[cite: 3] to match the pattern seen in `.codex/skills/backlog-technical-project-manager/SKILL.md`[cite: 4], ensuring the AI knows how to move files from `tasks/` to `completed/` upon finishing a PR[cite: 4].

### 4. Deprecation & Cleanup
- [ ] Move any remaining files from `_plans/archive/`[cite: 3] to `backlog/archive/tasks/`[cite: 4], giving them sequential legacy IDs.
- [ ] Delete the old `_plans/` and `.opencode/plans/` directories[cite: 3] to prevent AI context confusion.
