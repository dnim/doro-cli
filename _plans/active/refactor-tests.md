# Test Refactoring Strategy & Implementation Guide

## Objective
Refactor the test suite in `src/__tests__/` to align with AI-first and DAMP (Descriptive and Meaningful Phrases) principles. The goal is to reduce file size, abstract repetitive setup/mocking logic, and preserve the readability of the "Act" and "Assert" phases.

## Phase 1: Establish the Testing Utility Layer
Instead of repeating `jest.mock()` or setting up default state objects in every file, we will create a centralized utility layer.

### 1. Create `src/__tests__/utils/factories.ts`
**Goal:** Abstract the creation of standard data objects.
**Implementation Steps:**
*   Create a `createMockState(overrides?: Partial<State>)` function to generate default state machine objects used by `stateMachine.test.ts` and `app.test.ts`[cite: 3].
*   Create a `createMockConfig(overrides?: Partial<Config>)` function to generate configurations used by `config.test.ts`[cite: 3].

### 2. Create `src/__tests__/utils/mocks.ts`
**Goal:** Abstract repetitive side-effect mocks (audio, console, timers).
**Implementation Steps:**
*   Move `jest.mock()` calls for external dependencies (e.g., terminal UI renderers, file system access) here.
*   Create helper functions like `setupAudioMocks()` to wrap the setup of dummy audio players used in `audio.test.ts` and `player.test.ts`[cite: 3].
*   Create `setupInputMocks()` to simulate stdin/mouse events for `input.test.ts` and `mouse.test.ts`[cite: 3].

## Phase 2: Refactor Core Test Suites

### 1. Refactor Logic & State (`stateMachine.test.ts`, `app.test.ts`)
*   **Action:** Replace manual state initialization in `beforeEach` or inside test blocks with the `createMockState()` factory.
*   **Validation:** Ensure each test block clearly shows the *Arrange* (using the factory), *Act* (triggering a transition), and *Assert* (checking the new state).

### 2. Refactor Side Effects (`audio.test.ts`, `player.test.ts`, `update.test.ts`)
*   **Action:** Import and invoke `setupAudioMocks()` or `setupNetworkMocks()` at the top of the file.
*   **Validation:** Remove all inline `jest.spyOn()` and `jest.mock()` boilerplate from these files[cite: 3] unless a test requires a highly specific, one-off override.

### 3. Refactor UI & Input (`ui.test.ts`, `input.test.ts`, `mouse.test.ts`)
*   **Action:** Utilize the new input mocks to simulate keystrokes or clicks.
*   **Validation:** These files[cite: 3] should read like user stories (e.g., "When user presses space, timer pauses"), hiding the messy stream manipulation behind the utility layer.

## Phase 3: Update AI Context Guidelines
To ensure AI tools (like GitHub Copilot or Gemini) maintain this new standard, update the `.opencode/docs/DEVELOPMENT_GUIDELINES.md`[cite: 3] file.

**Add the following section to `DEVELOPMENT_GUIDELINES.md`:**
```markdown
### Writing Tests (AI-First DAMP Principles)
*   **Do not duplicate setup logic:** Always use the factories and mocks located in `src/__tests__/utils/`.
*   **Keep tests DAMP:** The logic inside `it()` or `test()` blocks must clearly show the Arrange, Act, and Assert steps. 
*   **Abstract Mocks, not Assertions:** Hide `jest.mock()` and boilerplate configuration in the utils folder, but keep assertions explicitly visible in the test file.
