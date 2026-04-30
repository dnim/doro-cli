# Plan: UI Themes

- **Feature**: Premium UI theme system with multiple palettes and user selection.
- **Branch**: `feature/ui-themes`
- **Status**: `Pending`
- **Depends On**: N/A (config system already implemented)
- **Summary**: Introduce a theme manager, add two extra default themes, and persist the selection via config. Extends existing color scheme system from 2 to 4 themes.

---

### Checklist

- [ ] **(Mandatory)** Create `src/theme.ts` with registry for `modern`, `calm`, `vivid`, `monochrome` palettes.
- [ ] **(Mandatory)** Refactor UI components to use theme tokens from theme manager.
- [ ] **(Mandatory)** Add `--theme` CLI flag for setting theme at startup.
- [ ] **(Mandatory)** Update config handling to persist selected theme (extends existing colorScheme field).
- [ ] **(Mandatory)** Write unit tests for theme manager.
- [ ] **(Optional)** Document usage and customization.
- [ ] **(Mandatory)** Verify changes by running the type checker and unit tests.
