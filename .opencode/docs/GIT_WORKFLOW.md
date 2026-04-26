# Git Workflow

- **Never commit or make changes directly on `main`.**
- Always create a branch first:
  - `feature/<name>` for new features
  - `fix/<name>` for bug fixes
  - `chore/<name>` for tooling, config, or maintenance work
  - `release/v<version>` for release preparation
- Only merge to `main` via a pull request.
- **Never push to remote without explicit user approval.**
- **Automatic Lockfile Sync**: If `package.json` is modified (e.g., version bump), you MUST run `npm install` to update `package-lock.json` before committing or pushing.
