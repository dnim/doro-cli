# Releasing doro-cli

This document outlines the process for releasing a new version of `doro-cli`.

## Release Workflow

1.  **Prepare**: Ensure you are on the latest `main` branch.
    ```bash
    git checkout main
    git pull origin main
    ```

2.  **Create Release Branch**: Create a new branch for the release.
    ```bash
    git checkout -b release/v1.0.0 # Replace with your version
    ```

3.  **Bump Version**: Update the version in `package.json`.
    ```bash
    npm version 1.0.0 --no-git-tag-version
    ```

4.  **Commit and Tag**:
    ```bash
    git add package.json
    git commit -m "chore: release v1.0.0"
    git tag -a v1.0.0 -m "Release v1.0.0"
    ```

5.  **Push**: Push the branch and the tag to GitHub.
    ```bash
    git push origin release/v1.0.0 --follow-tags
    ```

6.  **Merge to Main**: Once the release CI passes, merge the release branch back into `main`.
    ```bash
    git checkout main
    git merge release/v1.0.0
    git push origin main
    ```

## Automation

The GitHub Actions workflow [release.yml](.github/workflows/release.yml) handles the rest once a tag starting with `v*` is pushed:
-   **Tests & Linting**: Runs the full verification suite.
-   **GitHub Release**: Creates a new release with **automatically generated release notes** based on merged PRs and commits.
-   **NPM Publish**: Automatically publishes the new version to the npm registry.

## Prereleases

For release candidates (e.g., `v1.0.0-rc.1`), the flow is identical. The workflow is configured to mark these as "Prerelease" in GitHub.
