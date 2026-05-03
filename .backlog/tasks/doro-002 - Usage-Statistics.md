---
id: DORO-002
title: Usage Statistics
status: To Do
assignee: []
created_date: '2026-05-03 10:14'
updated_date: '2026-05-03 10:17'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
This plan covers recording session statistics to a local file with protection against race conditions from concurrent instances. It adds a new --stats command to display the data.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Install 'proper-lockfile' dependency to manage concurrent file access.
- [ ] #2 Create 'src/stats.ts' module with file-locking logic for reading and writing 'stats.json'.
- [ ] #3 Integrate session recording into 'DoroApp', calling the stats module upon session completion.
- [ ] #4 Add '--stats' flag handling to 'src/cli.ts' to trigger the stats view.
- [ ] #5 Create 'src/stats-ui.ts' to render the statistics in a clean, responsive, full-screen view.
- [ ] #6 Verify changes by running the type checker and adding new unit tests for the stats logic.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 code coverage is passing
- [ ] #2 VRTs added for ui changes
- [ ] #3 tests/linting/typecheck is green.
<!-- DOD:END -->
