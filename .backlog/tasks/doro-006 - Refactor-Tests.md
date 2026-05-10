---
id: DORO-006
title: Refactor Tests
status: To Do
assignee: []
created_date: '2026-05-10 06:52'
labels: []
dependencies: []
ordinal: 4000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Refactor the test suite in `src/__tests__/` to align with AI-first and DAMP (Descriptive and Meaningful Phrases) principles. The goal is to reduce file size, abstract repetitive setup/mocking logic, and preserve the readability of the Arrange, Act, Assert phases.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Create `src/__tests__/utils/factories.ts` with createMockState and createMockConfig factory functions
- [ ] #2 Create `src/__tests__/utils/mocks.ts` with setupAudioMocks and setupInputMocks helpers
- [ ] #3 Refactor stateMachine.test.ts and app.test.ts to use createMockState factory
- [ ] #4 Refactor audio.test.ts and player.test.ts to use setupAudioMocks helper
- [ ] #5 Refactor ui.test.ts, input.test.ts, mouse.test.ts to use input mocks
- [ ] #6 Update DEVELOPMENT_GUIDELINES.md with DAMP testing principles section
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 code coverage is passing, VRTs added for ui changes, tests/linting/typecheck is green.
<!-- DOD:END -->
