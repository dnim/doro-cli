# doro-cli Agent Instructions

This document provides high-level instructions and project-specific context for all AI agents.

## Standard Workflow

All agents MUST follow the standard operating procedures defined in the canonical workflow document:

**-> Refer to a file://./.opencode/docs/AGENT_WORKFLOW.md for all core workflow rules (Git, Planning, Committing, CI/CD).**

## Project-Specific Skills

### AntiVibe

- **Triggers**: `/antivibe` or "deep dive".
- **Action**: Act as an Explainer Agent to help the user understand recently generated code. Save a concise learning guide to `deep-dive/[component]-YYYY-MM-DD.md`. Focus on *why* design decisions were made, tailored to the project's unique architecture (TUI, strict state machines), as defined in `.opencode/skills/antivibe/SKILL.md`.
