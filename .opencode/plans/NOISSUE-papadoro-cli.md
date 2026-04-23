## Context

- Build new CLI project `papadoro` from empty repository.
- Provide simple pleasant full-screen terminal UI.
- Support keyboard shortcuts and mouse confirmation behavior.
- Add lightweight 8-bit style audio cues.

## Goal

- Deliver runnable `papadoro` command implementing requested timer flows and controls.

## Non-goals

- No daemon/background service mode.
- No persistence/config file editing UI.
- No CI/CD or release automation setup.

## Phases

1. Scaffold Node + TypeScript CLI package and scripts.
2. Implement timer state machine and flow rules.
3. Implement blessed-based TUI and input handling.
4. Implement WAV synth + OS playback fallback.
5. Add focused unit tests.
6. Run quality gates.

## Progress Log

- [x] Created feature branch `feature/NOISSUE-papadoro-cli`.
- [x] Scaffold project files and dependencies.
- [x] Implement timer/state logic.
- [x] Implement TUI and controls.
- [x] Implement audio generation/playback.
- [x] Add tests.
- [x] Run quality gates.
- [x] Tune audio loudness down and soften wave.
- [x] Auto-start timer on launch.
- [x] Simplify UI details and add playful mode backgrounds.
- [x] Stabilize terminal rendering with compatibility-focused UI rewrite.
- [x] Refine UI to cleaner layout, softer colors, and title-only timer.
- [x] Fix low-contrast long break status stripe with explicit per-mode band colors.
- [x] Prevent overlapping audio by interrupting active clip on mode switches.
- [x] Play short reset beep instead of full mode melody on reset.
