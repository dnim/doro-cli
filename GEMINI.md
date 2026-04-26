# doro-cli: Gemini Context

## Project Overview

`doro-cli` is a keyboard-first, full-screen terminal Pomodoro timer written in TypeScript for Node.js. It features soft pastel themes and synthetic 8-bit audio cues.

## Core Tech Stack

- **Runtime**: Node.js (>=22)
- **Language**: TypeScript
- **UI Framework**: `neo-blessed` (terminal TUI)
- **Testing**: Jest
- **Linting**: ESLint + TypeScript ESLint

## Source of Truth & Rule Interconnection

To avoid repetition and ensure consistency, this project follows a hierarchical rule structure:

1.  **Tool Permissions (`opencode.json`)**: This is the absolute source of truth for tool executions (e.g., `bash` permissions). Never attempt to bypass these restrictions.
2.  **AI Workflow (`AGENTS.md`)**: Defines the mandatory Git workflow (feature branches, no direct main commits) and Plan Mode constraints (100-200 lines max). These instructions apply to all AI assistants (Gemini, Copilot, etc.).
3.  **Project Context (`GEMINI.md`)**: This file, focusing on technical architecture and development commands.

## Key Development Commands

Refer to a file://./.opencode/docs/DEV_COMMANDS.md for a list of key development commands.

## Architecture Highlights

Refer to a file://./.opencode/docs/ARCHITECTURE.md for an overview of the project architecture.

## Development Conventions

- **Keyboard-First**: Maintain single-key shortcuts for core timer operations.
- **Responsiveness**: UI must remain readable down to very small terminal widths.
- **Pure Logic**: Keep timer logic in `TimerStateMachine` and verify with unit tests in `src/__tests__/`.
- **Debugging**: Use `Shift+D` for fast-forwarding timers for quick testing of transitions.

## Debugging Workflow

- When investigating CI/CD failures, always start by checking the output of the latest GitHub Actions run using the `gh` CLI tool before attempting to reproduce the issue locally. For example: `gh run view --log`.
