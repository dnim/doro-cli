# Plan: Persistent Configuration

- **Feature**: Persistent user settings (volume, color scheme).
- **Branch**: `feature/persistent-config`
- **Status**: `Completed`
- **Summary**: This plan covers loading user settings from a global configuration file on startup and saving them when they are changed. It introduces one new dependency.

---

### Checklist

-   `[ ]` **(Mandatory)** Install `env-paths` dependency to locate the config directory.
-   `[ ]` **(Mandatory)** Create `src/config.ts` module with functions for loading and saving `settings.json`.
-   `[ ]` **(Mandatory)** Refactor `DoroApp` and `cli.ts` to support asynchronous startup.
-   `[ ]` **(Mandatory)** Integrate config loading into `DoroApp` to initialize with saved settings.
-   `[ ]` **(Mandatory)** Refactor `DoroUi` to be stateless regarding its color scheme.
-   `[ ]` **(Mandatory)** Update `DoroApp` handlers to save settings when they are changed by the user.
-   `[ ]` **(Mandatory)** Add a "Reset Settings" command (`Shift+R`).
-   `[ ]` **(Mandatory)** Verify changes by running the type checker and unit tests.
