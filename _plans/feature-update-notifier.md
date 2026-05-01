# Plan: Update Notifier

- **Feature**: App update notification system with responsive UI and clipboard integration
- **Branch**: `feature/update-notifier`
- **Status**: `In Progress`
- **Depends On**: None
- **Summary**: Implement periodic update checking, responsive update prompts (including micro screens), clipboard integration for update commands, manual update trigger via Shift+U, and retry-on-failure behavior. Extends config schema for update policy persistence and adds npm registry version checking. Adds comprehensive VRT coverage for update prompt UI states.

---

### Implementation Decisions

- **Network Failure Policy**: Retry on next launch (do not update `lastCheckedAt` on failure)
- **Manual Trigger**: `Shift+U` shortcut to manually trigger update check flow
- **VRT Coverage**: 32 additional snapshots (4 update states × 2 themes × 4 screen sizes)

---

### Checklist

- [x] **(Mandatory)** Extend settings schema in `src/config.ts` with update fields: `lastCheckedAt`, `checkIntervalHours` (default 24), `skippedVersion`
- [x] **(Mandatory)** Create `src/update.ts` for version checking: fetch latest npm version, compare with current version, handle network failures gracefully
- [x] **(Mandatory)** Implement periodic check policy: only check when interval is due, persist `lastCheckedAt`, skip if `skippedVersion` matches latest
- [x] **(Mandatory)** Add update prompt state to `src/input.ts` with `y/n` handling that takes priority over normal shortcuts
- [x] **(Mandatory)** Add manual update trigger with `Shift+U` shortcut
- [x] **(Mandatory)** Integrate update check into app startup flow without blocking timer responsiveness
- [x] **(Mandatory)** Implement responsive update UI in `src/ui.ts` for wide, narrow, and micro screens with fallback to minimal one-line prompt
- [x] **(Mandatory)** Add clipboard integration for update command copy on "yes" selection with platform-aware fallback
- [x] **(Mandatory)** Implement "no" action: persist `skippedVersion` and continue app normally
- [x] **(Mandatory)** Implement "yes" action: copy update command to clipboard, show confirmation/fallback message, exit cleanly
- [x] **(Mandatory)** Add unit tests for config schema migration, update check logic, periodic gating, and UI responsiveness
- [x] **(Mandatory)** Extend VRT with update prompt scenarios: manual trigger, accept+copy-success, accept+copy-fallback, decline states (32 snapshots total)
- [x] **(Mandatory)** Verify changes by running the type checker and unit tests
- [x] **(Optional)** Add post-MVP auto-update mode with opt-in setting for automatic update execution
