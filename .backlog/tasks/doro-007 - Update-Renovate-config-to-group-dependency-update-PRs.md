---
id: DORO-007
title: Update Renovate config to group dependency update PRs
status: In Progress
assignee:
  - '@myself'
created_date: '2026-05-10 14:15'
updated_date: '2026-05-10 14:15'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Summary

Renovate is currently creating too many dependency update PRs, often one per dependency. This creates PR noise and makes dependency updates painful to manage because multiple open dependency PRs frequently conflict with each other.

Update the Renovate configuration so dependency updates are grouped into fewer PRs instead of one PR per dependency.

## Goal

Reduce dependency PR noise and avoid dependency conflict hell by grouping Renovate updates into logical batches.

## Proposed grouping

Use two dependency groups:

1. Runtime / production dependencies
2. Development / tooling dependencies

If Renovate package rules make a different but still simple two-group setup easier to maintain, that is acceptable as long as the result is clearly grouped and avoids one-PR-per-dependency behavior.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 code coverage is passing
- [ ] #2 VRTs added for ui changes
- [ ] #3 tests/linting/typecheck is green.
<!-- DOD:END -->



## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Renovate no longer opens one PR per dependency by default
- [ ] #2 Dependency updates are grouped into at most two logical PR groups
- [ ] #3 Runtime / production dependencies are grouped together
- [ ] #4 Development / tooling dependencies are grouped together
- [ ] #5 The resulting Renovate config is simple and maintainable
- [ ] #6 Future dependency update PR volume is significantly reduced
<!-- AC:END -->
