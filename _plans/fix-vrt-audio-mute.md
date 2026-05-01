# Plan: Fix VRT Audio Mute

- **Feature**: Silence audio during visual regression tests to prevent hearing music during CI/local VRT runs
- **Branch**: `feature/update-notifier`
- **Status**: `Pending`
- **Depends On**: None
- **Summary**: Implement comprehensive audio muting at multiple levels (Playwright browser, app config isolation, process environment) to ensure VRT runs are completely silent. Address platform-specific config path differences and prevent host user settings from leaking into test processes.

---

### Implementation Decisions

- **Multi-Level Muting**: Browser-level + app-level + process isolation for complete silence
- **Platform Safety**: Handle macOS/Linux config path differences in test isolation
- **Fail-Fast Guards**: Verify muted state before snapshots to catch audio regressions

---

### Checklist

- [ ] **(Mandatory)** Add browser-level audio muting in `playwright.config.ts` via launch args (`--mute-audio`, `--no-sandbox`)
- [ ] **(Mandatory)** Fix platform-specific config isolation in `tests/visual.spec.mts` to handle macOS `~/Library/Preferences` vs Linux `XDG_CONFIG_HOME`
- [ ] **(Mandatory)** Enhance process environment isolation in `pty.spawn` to prevent host user config leakage
- [ ] **(Mandatory)** Add fail-fast guard in visual setup to verify muted state is active before snapshot flows
- [ ] **(Mandatory)** Test with targeted visual subset to validate audio silence
- [ ] **(Mandatory)** Run full VRT suite to ensure no audio plays during complete test run
- [ ] **(Optional)** Add explicit audio muting documentation for contributors running VRT locally

---

### Root Cause Analysis

The issue occurs because:

1. VRT spawns real CLI processes via `node-pty` that inherit host environment
2. macOS uses `~/Library/Preferences/doro-cli-nodejs/` for config (not `XDG_CONFIG_HOME`)
3. Test config writes to `XDG_CONFIG_HOME` but app may read from platform default location
4. Host user's non-muted settings can leak through, causing audio playback during tests
5. Browser-level audio is not explicitly muted in Playwright configuration
