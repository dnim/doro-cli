---
id: DORO-010
title: Add possibility to adjust long/short/work time on UI
status: In Progress
assignee:
  - '@antigravity'
created_date: '2026-05-15 10:29'
updated_date: '2026-05-25 19:12'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->

Allow users to adjust the duration (in minutes) for short breaks, long breaks, and work sessions directly from the UI (including tiny mode).

- Short break: 3-7 mins
- Long break: 10-18 mins
- Work: 20-30 mins
- Save these settings into the existing config.
<!-- SECTION:DESCRIPTION:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->

1. Extract MODE_DURATION_BOUNDS and EDIT_SAVE_TIMEOUT_MS constants to config.ts
2. Update handleDurationEdit in app.ts to clamp the initial value and use the new constants
3. Correct // no latestVersion comment placement in ui.test.ts
4. Run lint, typecheck, and unit tests
5. Update visual regression test snapshots to ensure all tests pass
<!-- SECTION:PLAN:END -->

## Definition of Done

<!-- DOD:BEGIN -->

- [ ] #1 code coverage is passing
- [ ] #2 VRTs added for ui changes
- [ ] #3 tests/linting/typecheck is green.
<!-- DOD:END -->
