---
id: DORO-005
title: UI Themes
status: To Do
assignee: []
created_date: '2026-05-03 10:14'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Introduce a theme manager, add two extra default themes, and persist the selection via config. Extends existing color scheme system from 2 to 4 themes.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Create 'src/theme.ts' with registry for 'modern', 'calm', 'vivid', 'monochrome' palettes.
- [ ] #2 Refactor UI components to use theme tokens from theme manager.
- [ ] #3 Add '--theme' CLI flag for setting theme at startup.
- [ ] #4 Update config handling to persist selected theme (extends existing colorScheme field).
- [ ] #5 Write unit tests for theme manager.
- [ ] #6 Document usage and customization.
- [ ] #7 Verify changes by running the type checker and unit tests.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 code coverage is passing
- [ ] #2 VRTs added for ui changes
- [ ] #3 tests/linting/typecheck is green.
<!-- DOD:END -->
