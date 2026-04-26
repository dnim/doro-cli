# AI Agent Workflow

This document outlines the standard operating procedures for all AI agents working on this project.

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

- **One Plan, One Feature**: Before implementation, the agent MUST create a plan file for a **single feature** inside the `./opencode/plans/` directory, with a name reflecting the feature (e.g., `feat-name.md`).
- **Plan as a Living Document**: The plan is a living document that must be updated after each commit. It must contain:
  - **Feature Branch**: The name of the git branch for the feature.
  - **Status**: The current status of the plan (e.g., `Pending`, `In Progress`, `Completed`).
  - **Checklist**: A detailed checklist of tasks, clearly distinguishing between `(Mandatory)` and `(Optional)` items.
- **User Approval**: The agent must wait for explicit user approval of the plan (e.g., the user saying "nice" or "proceed") before beginning implementation.

## 3. Implementation & Committing

- **Small, Atomic Commits**: Changes should be broken down into small, logical commits.
- **Pre-Commit Approval**: The agent MUST ask for user approval before every `git commit` operation, presenting the proposed commit message.

## 4. CI/CD

- When investigating CI/CD failures on GitHub-hosted repositories, agents should first attempt to retrieve logs from the failed run using the `gh` CLI before attempting to reproduce locally.
