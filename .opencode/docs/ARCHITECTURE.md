# Architecture Highlights

- `src/cli.ts`: Application entry point.
- `src/app.ts`: Main controller; manages the lifecycle and event loop.
- `src/stateMachine.ts`: Pure logic for timer states and transitions.
- `src/ui.ts`: Handles rendering logic and responsiveness for different terminal sizes.
- `src/audio/`: Logic for programmatic audio generation and playback fallback.
