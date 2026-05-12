---
id: DORO-009
title: Add gold tomato mascot splash screen
status: To Do
assignee:
  - '@pi'
created_date: '2026-05-12 15:16'
updated_date: '2026-05-12 16:08'
labels: []
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add a gold tomato mascot splash screen shown for 1.5s on app startup.

Design decisions (confirmed):
- Character: gold/amber tomato (nods to "pomodoro" etymology)
- Art style: braille pixel art (Unicode U+2800–U+28FF, 2×4 dots per terminal char)
- Animation: horizontal color wave (shimmer sweeping left→right, no bounce)
- Exit: instant cut to timer after 1.5s
- No app name/version displayed alongside mascot

Responsive sizes (terminal cols×rows → mascot cols×rows):
- large  ≥80×24  →  20×12 chars
- small  ≥44×8   →   7×4  chars
- ultra  ≥24×5   →   5×3  chars
- tiny   ≥16×3   →   3×2  chars (simplified shading)
- below tiny     →  no splash shown

Architecture:
- src/mascot.ts  — generateTomato(), toBrailleLines(), getMascotArt()
- src/ui.ts      — renderSplash(waveOffset) method, full-screen no bars
- src/app.ts     — 80ms animation loop for 1500ms before first tick
- Background: active theme base color
- Wave: brightness envelope sweeping across mascot columns

Preview scripts: scripts/preview-mascot.mjs, scripts/preview-animated.mjs
Branch: tasks/doro-009-app-mascot
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Splash renders gold tomato in braille pixel art, centered, on startup
- [ ] #2 Animation runs for exactly 1.5s then cuts to timer with no flicker
- [ ] #3 Color wave sweeps left-to-right across the mascot during splash
- [ ] #4 Mascot is visually round at all 4 sizes: large / small / ultra / tiny
- [ ] #5 Mascot hidden gracefully when terminal is smaller than 16×3
- [ ] #6 Splash background uses the active theme base color
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 code coverage is passing
- [ ] #2 VRTs added for ui changes
- [ ] #3 tests/linting/typecheck is green.
<!-- DOD:END -->
