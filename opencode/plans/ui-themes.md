# Plan: UI Themes

- **Feature**: Premium UI theme system with multiple palettes and user selection.
- **Branch**: `feature/ui-themes`
- **Status**: `Pending`
- **Depends On**: `feat-config.md`
- **Summary**: Introduce a theme manager, add two extra default themes, and persist the selection via config.

---

### Checklist

- [ ] Install `chalk` v5.
- [ ] Create `src/theme.ts` with registry for `modern`, `calm`, `vivid`, `monochrome` palettes.
- [ ] Refactor UI components to use theme tokens.
- [ ] Add `--theme` CLI flag.
- [ ] Implement keyboard shortcut `c` to toggle themes.
- [ ] Update config handling to persist selected theme (depends on `feat-config` plan).
- [ ] Write unit tests for theme manager.
- [ ] Document usage and customization.
