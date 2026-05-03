---
id: DORO-004
title: doro-cli on Mobile
status: To Do
assignee: []
created_date: '2026-05-03 10:14'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
This plan explores viable paths to bring doro-cli to mobile. It evaluates zero-code workarounds (SSH, Termux) through to medium-effort in-repo additions (web terminal server) and a longer-term PWA approach.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Add 'Mobile / Remote Access' section to README.md documenting SSH and Termux paths.
- [ ] #2 Create 'src/serve.ts' — HTTP + WebSocket + node-pty bridge for '--serve' mode.
- [ ] #3 Update 'src/cli.ts' to parse '--serve [port]' and invoke 'serve.ts'.
- [ ] #4 Promote 'node-pty' from 'devDependencies' to 'dependencies' in 'package.json'.
- [ ] #5 Add graceful audio-fallback / '--no-audio' flag to support Termux where audio APIs are unavailable.
- [ ] #6 Open a tracking issue for the PWA companion app (Option D) as future work.
- [ ] #7 Verify changes by running the type checker and unit tests.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 code coverage is passing
- [ ] #2 VRTs added for ui changes
- [ ] #3 tests/linting/typecheck is green.
<!-- DOD:END -->
