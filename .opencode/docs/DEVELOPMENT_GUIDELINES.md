# Development Guidelines

## Development Conventions

- **Keyboard-First**: Maintain single-key shortcuts for core timer operations.
- **Responsiveness**: UI must remain readable down to very small terminal widths.
- **Pure Logic**: Keep timer logic in `TimerStateMachine` and verify with unit tests in `src/__tests__/`.
- **Debugging**: Use `Shift+D` for fast-forwarding timers for quick testing of transitions.

## Debugging Workflow

- When investigating CI/CD failures, always start by checking the output of the latest GitHub Actions run using the `gh` CLI tool before attempting to reproduce the issue locally. For example: `gh run view --log`.
