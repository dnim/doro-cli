# AI Agent Workflow

This document outlines the standard operating procedures for all AI agents working on this project.

## 0. Token Efficiency

- No preamble: never start responses with "I'll now...", "Sure!", "Let me...", "Great!"
- No narrating tool calls — execute, don't describe
- No repeating context already established in the conversation
- Never create files unless explicitly required; prefer editing existing ones
- **Plan mode**: output a structured numbered plan only — no code, no prose
- **Build mode**: follow the plan, execute directly; ask only when genuinely blocked

## 1. Git Workflow

- **Never commit or make changes directly on `main`.**
- **Always create a feature branch first.** Branch names should follow this convention:
  - `feature/<name>` for new features
  - `fix/<name>` for bug fixes
  - `chore/<name>` for tooling, config, or maintenance work
- Only merge to `main` via a pull request reviewed by the user.
- **Never push to remote without explicit user approval.**
- **Automatic Lockfile Sync**: If `package.json` is modified, you MUST run `npm install` to update `package-lock.json` before committing.

## 2. Planning

- **One Plan, One Feature**: Before implementation, the agent MUST create a plan file for a **single feature** inside the `_plans/` directory, following the structure in `file://_plans/TEMPLATE.md`.
- **Branch Creation in Plans**: When in plan mode (especially on main branch), the plan output MUST include branch creation as the first step at the top, clearly specifying the exact branch name to be created (e.g., "Create feature branch `feature/update-notifier`").
- **Plan as a Living Document**: The plan is a living document that must be updated after each commit. It must follow the metadata-first format defined in the template.
- **User Approval**: The agent must wait for explicit user approval of the plan (e.g., the user saying "nice" or "proceed") before beginning implementation.

## 3. Implementation & Committing

- **Small, Atomic Commits**: Changes should be broken down into small, logical commits.

### Commit Protection System

**OpenCode automatically prevents unauthorized commits** via the permission system defined in `opencode.json`:

- `"git commit *": "deny"` blocks all direct commit attempts by agents
- Environment variables (`OPENCODE=1`, `OPENCODE_PROCESS_ROLE=worker`) identify agent context
- This protection is automatic and cannot be bypassed by agents

### Proper Commit Workflow for Agents

1. **Request Approval**: Before committing, the agent MUST ask the user explicitly:
   - Present the proposed commit message
   - Show what changes will be included (`git status`, `git diff`)
   - Wait for explicit user confirmation (e.g., "yes", "proceed", "commit")

2. **User Executes Commit**: After approval, the **user** runs the commit command:
   - User types: `git commit -m "the agreed message"`
   - OR user can modify the message and commit manually

3. **Agent Never Commits Directly**: Agents must never attempt `git commit` commands
   - Such attempts will be blocked by OpenCode's permission system
   - Instead, agents should guide users through the commit process

### Troubleshooting Commit Issues

- **"Permission denied" errors**: Normal behavior - agents cannot commit directly
- **Agent claims to commit**: Bug in agent logic - agent should request approval instead
- **Manual commits failing**: Check if you're in an agent session vs manual terminal

### Example Proper Commit Request

```
I've completed the feature implementation. Here are the changes ready to commit:

**Proposed commit message**: "Add dark mode toggle to settings page"

**Files changed** (git status):
- src/components/Settings.tsx (modified)
- src/styles/themes.css (new file)

**Summary of changes** (git diff --stat):
- Added toggle component with state management
- Implemented CSS variables for theme switching

Please review and run: `git commit -m "Add dark mode toggle to settings page"`
```

## 4. CI/CD

- When investigating CI/CD failures on GitHub-hosted repositories, agents MUST use the `gh` CLI tool (e.g., `gh run view`, `gh pr checks`, `gh run list`) to inspect commits and workflow runs before attempting to reproduce issues locally. This ensures agents have the most accurate and up-to-date information regarding build failures.
