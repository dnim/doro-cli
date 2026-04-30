# Plan: Visual Regression Tests

- **Feature**: Add pixel-perfect visual regression testing for the terminal UI using Playwright, node-pty, and xterm.js, integrated into GitHub Actions.
- **Branch**: `feature/visual-regression-tests`
- **Status**: `Pending`
- **Depends On**: None
- **Summary**: This plan covers installing necessary dependencies, creating an HTML harness for xterm.js, writing the Playwright test script to capture initial and post-interaction states, and setting up the CI workflow.

### Dependencies & Roles

| Dependency | Role | Documentation |
| :--- | :--- | :--- |
| [`@playwright/test`](https://playwright.dev/) | Test runner and browser automation framework. | [Docs](https://playwright.dev/docs/intro) |
| [`node-pty`](https://github.com/microsoft/node-pty) | Spawns pseudoterminals to run the CLI in a realistic environment. | [GitHub](https://github.com/microsoft/node-pty) |
| [`xterm`](https://xtermjs.org/) | Terminal emulator used to render PTY output in the browser harness. | [Docs](https://xtermjs.org/docs/) |


---

### Checklist

- [ ] **(Mandatory)** Install `@playwright/test`, `node-pty`, and `xterm` as dev dependencies, and install Playwright browsers.
- [ ] **(Mandatory)** Create `tests/terminal.html` to host the xterm.js terminal instance.
- [ ] **(Mandatory)** Create `tests/visual.spec.ts` to spawn the CLI via node-pty, pipe output to the browser, interact with it, and take screenshots.
- [ ] **(Mandatory)** Add GitHub Actions workflow `.github/workflows/visual-tests.yml` to run Playwright tests on push and pull requests.
- [ ] **(Optional)** Add npm scripts for running visual tests locally (e.g., `test:visual`).
- [ ] **(Mandatory)** Verify changes by running the type checker and unit tests.
