# Plan: Update Notifier

- **Feature**: App update notification system with responsive UI and clipboard integration
- **Branch**: `feature/update-notifier`
- **Status**: `Pending`
- **Depends On**: None
- **Summary**: Implement periodic update checking, responsive update prompts (including micro screens), and clipboard integration for update commands. Extends config schema for update policy persistence and adds npm registry version checking.

---

### Checklist

- [ ] **(Mandatory)** Extend settings schema in `src/config.ts` with update fields: `lastCheckedAt`, `checkIntervalHours` (default 24), `skippedVersion`
- [ ] **(Mandatory)** Create `src/update.ts` for version checking: fetch latest npm version, compare with current version, handle network failures gracefully
- [ ] **(Mandatory)** Implement periodic check policy: only check when interval is due, persist `lastCheckedAt`, skip if `skippedVersion` matches latest
- [ ] **(Mandatory)** Add update prompt state to `src/input.ts` with `y/n` handling that takes priority over normal shortcuts
- [ ] **(Mandatory)** Integrate update check into app startup flow without blocking timer responsiveness
- [ ] **(Mandatory)** Implement responsive update UI in `src/ui.ts` for wide, narrow, and micro screens with fallback to minimal one-line prompt
- [ ] **(Mandatory)** Add clipboard integration for update command copy on "yes" selection with platform-aware fallback
- [ ] **(Mandatory)** Implement "no" action: persist `skippedVersion` and continue app normally
- [ ] **(Mandatory)** Implement "yes" action: copy update command to clipboard, show confirmation/fallback message, exit cleanly
- [ ] **(Mandatory)** Add unit tests for config schema migration, update check logic, periodic gating, and UI responsiveness
- [ ] **(Mandatory)** Verify changes by running the type checker and unit tests
- [ ] **(Optional)** Add post-MVP auto-update mode with opt-in setting for automatic update execution