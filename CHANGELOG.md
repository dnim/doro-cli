# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.1] - 2026-04-30

### Changed

- Improved release workflow to include cleanup and build steps automatically.

## [1.2.0] - 2026-04-30

> **Note**: This version was released with incomplete changes due to release process issues. The features listed below are included in version 1.2.1 instead.

### Added

- Comprehensive visual regression tests with color mapping using Playwright.
- Persistent configuration system for storing user settings.
- `laconic-conversation` AI skill for concise communication.
- Integrated `antivibe` AI code learning skill to help explain AI-generated code.
- Planning workflow with structured feature plans and templates.
- Space bar as an additional pause shortcut alongside 'p'.

### Fixed

- Improved pause behavior to properly interrupt audio and handle state transitions.

### Changed

- Reorganized agent instruction files with token efficiency rules.
- Configured model-specific settings per agent type.
- Enhanced test coverage with comprehensive unit tests for configuration and app behavior.

## [1.1.0] - 2026-04-25

### Added

- Replaced synthetic 8-bit audio cues with curated classical Austrian composer snippets.

### Changed

- Transitioned to `release-it` for a standardized and automated package publishing workflow.

## [1.0.0] - 2026-04-24

### Added

- Automated NPM publishing pipeline via GitHub Actions using Trusted Publishing (OIDC).
- Added robust local release scripts with pre-release safety checks.
- Included package metadata and graphical assets for the NPM registry.

### Changed

- Excluded test files and unnecessary artifacts from the published NPM package.
- Consolidated development dependencies via Dependabot.
- Fixed multiple CI workflow issues related to Node versions and build steps.

## [0.1.0] - 2026-04-24

### Added

- Initial release of `doro-cli`.
- Full-screen terminal UI using `neo-blessed`.
- Synthetic 8-bit audio cues.
- Support for Work, Short Rest, and Long Rest modes.
- Keyboard-first controls and mouse support in prompts.
- Color schemes: `modern` and `calm`.
- Standalone binaries for macOS, Linux, and Windows.
- CI/CD pipeline via GitHub Actions.
