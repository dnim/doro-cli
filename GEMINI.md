# papadoro: Gemini Context

## Project Overview
`papadoro` is a keyboard-first, full-screen terminal Pomodoro timer written in TypeScript for Node.js. It features soft pastel themes and synthetic 8-bit audio cues.

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
- **Install**: `npm install`
- **Build**: `npm run build`
- **Run (Dev)**: `npm run dev`
- **Run (Prod)**: `node dist/cli.js`
- **Test**: `npm run test:unit`
- **Lint**: `npm run lint:local`
- **Typecheck**: `npm run typecheck`

## Architecture Highlights
- `src/cli.ts`: Application entry point.
- `src/app.ts`: Main controller; manages the lifecycle and event loop.
- `src/stateMachine.ts`: Pure logic for timer states and transitions.
- `src/ui.ts`: Handles rendering logic and responsiveness for different terminal sizes.
- `src/audio/`: Logic for programmatic audio generation and playback fallback.

## Development Conventions
- **Keyboard-First**: Maintain single-key shortcuts for core timer operations.
- **Responsiveness**: UI must remain readable down to very small terminal widths.
- **Pure Logic**: Keep timer logic in `TimerStateMachine` and verify with unit tests in `src/__tests__/`.
- **Debugging**: Use `Shift+D` for fast-forwarding timers for quick testing of transitions.
