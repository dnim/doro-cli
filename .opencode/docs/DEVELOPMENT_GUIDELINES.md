# Development Guidelines

## Development Conventions

- **Keyboard-First**: Maintain single-key shortcuts for core timer operations.
- **Responsiveness**: UI must remain readable down to very small terminal widths.
- **Pure Logic**: Keep timer logic in `TimerStateMachine` and verify with unit tests in `src/__tests__/`.
- **Debugging**: Use `Shift+D` for fast-forwarding timers for quick testing of transitions.

## Testing Guidelines - AI-First DAMP Principles

### Test Structure
- **DAMP over DRY**: Tests should be Descriptive And Meaningful, not overly DRY. Favor readability over code reuse.
- **AAA Pattern**: Structure tests with clear Arrange/Act/Assert phases using comments when helpful.
- **Factory Functions**: Use centralized factories from `src/__tests__/utils/factories.ts` for creating test data:
  - `createMockState()` - For TimerState objects
  - `createMockConfig()` - For TimerConfig objects  
  - `createMockSettings()` - For Settings objects
  - `createQuickTestConfig()` - For unit tests with short durations

### Mock Management
- **Centralized Setup**: Use utilities from `src/__tests__/utils/mocks.ts` for common mocking patterns.
- **Event Helpers**: Use `createKeyEvent()`, `createMouseEvent()`, and `createResizeEvent()` for input testing.
- **Audio Mocks**: Use `createMockChildProcess()` for audio player tests.
- **Top-Level Mocks**: Keep `jest.mock()` calls at the top level of test files for proper hoisting.

### AI-First Considerations
- **Consistent Patterns**: Follow established patterns so AI tools can easily extend tests.
- **Clear Intent**: Make test purpose obvious through naming and structure.
- **Minimal Boilerplate**: Use utilities to reduce repetitive setup code.
- **Type Safety**: Ensure all test helpers are properly typed.

## Debugging Workflow

- When investigating CI/CD failures, always start by checking the output of the latest GitHub Actions run using the `gh` CLI tool before attempting to reproduce the issue locally. For example: `gh run view --log`.
