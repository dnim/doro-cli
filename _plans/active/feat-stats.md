# Plan: Usage Statistics

- **Feature**: Usage statistics collection and display.
- **Branch**: `feature/usage-stats`
- **Status**: `Pending`
- **Depends On**: N/A
- **Summary**: This plan covers recording session statistics to a local file with protection against race conditions from concurrent instances. It adds a new `--stats` command to display the data. It introduces one new dependency.

---

### Checklist

- [ ] **(Mandatory)** Install `proper-lockfile` dependency to manage concurrent file access.
- [ ] **(Mandatory)** Create `src/stats.ts` module with file-locking logic for reading and writing `stats.json`.
- [ ] **(Mandatory)** Integrate session recording into `DoroApp`, calling the stats module upon session completion.
- [ ] **(Mandatory)** Add `--stats` flag handling to `src/cli.ts` to trigger the stats view.
- [ ] **(Mandatory)** Create `src/stats-ui.ts` to render the statistics in a clean, responsive, full-screen view.
- [ ] **(Mandatory)** Verify changes by running the type checker and adding new unit tests for the stats logic.
