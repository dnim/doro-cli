---
id: DORO-003
title: Fix Tiny UI Volume Indicator
status: To Do
assignee: []
created_date: '2026-05-03 10:14'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Currently responsive UI hides volume indicators when doro is tiny (16x3). Add compact volume icons and prioritize volume visibility over lock state for ultra-small terminals. Also fix missing sound indicator on medium screens.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Analyze current getRunningStatusText fallback logic in src/ui.ts
- [ ] #2 Add compact volume icons (✕♪♫ for volume, ⊘○ for lock) to status candidates
- [ ] #3 Reorder status fallback to prioritize volume indicators in tiny widths
- [ ] #4 Add unit tests for volume indicator visibility at constrained widths
- [ ] #5 Extend VRT tests to capture volume mode states at tiny/ultra-small sizes
- [ ] #6 Verify changes by running the type checker and unit tests
- [ ] #7 Fix missing sound indicator on medium screen sizes
- [ ] #8 Test across all screen sizes (large, medium, small, ultra-small, tiny)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 code coverage is passing
- [ ] #2 VRTs added for ui changes
- [ ] #3 tests/linting/typecheck is green.
<!-- DOD:END -->
