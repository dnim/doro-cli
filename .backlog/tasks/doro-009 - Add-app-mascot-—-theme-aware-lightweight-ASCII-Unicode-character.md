---
id: DORO-009
title: 'Add app mascot — theme-aware, lightweight ASCII/Unicode character'
status: To Do
assignee:
  - '@pi'
created_date: '2026-05-12 15:16'
labels: []
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add a mascot to doro-cli that feels native to a terminal TUI.

The mascot should:
- Be rendered in ASCII/Unicode art (lightweight, no external image assets)
- Adapt its appearance (colors/style) to the currently selected color scheme/theme
- Be small enough to fit naturally in the UI (e.g. splash screen, idle state, or welcome panel)
- Have personality that matches a focus/pomodoro-style productivity tool
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Mascot renders correctly in at least one UI location (e.g. splash or welcome screen)
- [ ] #2 Mascot colors are derived from the active color scheme — no hardcoded ANSI colors
- [ ] #3 Mascot does not break layout on standard 80-column terminals
- [ ] #4 Mascot is visually distinct and memorable (reviewed by the team)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 code coverage is passing
- [ ] #2 VRTs added for ui changes
- [ ] #3 tests/linting/typecheck is green.
<!-- DOD:END -->
