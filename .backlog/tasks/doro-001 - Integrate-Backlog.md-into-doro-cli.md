---
id: DORO-001
title: Integrate Backlog.md into doro-cli
status: In Progress
assignee:
  - '@opencode'
created_date: '2026-05-03 10:10'
updated_date: '2026-05-03 10:16'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
This task is to fully integrate the Backlog.md task management system into the doro-cli project. This includes migrating existing project plans, setting up the backlog configuration, and creating comprehensive instructions for AI agents.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 backlog init is run successfully within the doro-cli project,Existing 'plans' from doro-cli are identified and migrated into backlog tasks,A unified AGENTS.md file is created in doro-cli with instructions for using backlog,The doro-cli project is fully set up to use backlog for task management
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. **Analyze 'doro-cli' Project Structure:** I'll start by examining the 'doro-cli' project to understand its structure, find the 'existent plans' that need migration, and identify its main functionalities. I'll look for a README.md, package manager files (like package.json), and any existing task or project management files.
2. **Integrate 'Backlog.md':** I will initialize 'Backlog.md' within the 'doro-cli' project directory. This will create the 'backlog/' directory and configuration files. I will then integrate the 'backlog' CLI tool into the 'doro-cli' project's workflow. This might involve adding scripts to package.json or similar configuration files to make 'backlog' commands easily accessible to developers (and agents).
3. **Migrate 'Existent Plans':** Once I've located the existing plans/tasks within 'doro-cli', I'll map their structure to the 'Backlog.md' task format (title, description, acceptance criteria, etc.). I will create a series of commands to read the old tasks and create new tasks in 'Backlog.md' using the 'backlog task create' command for each.
4. **Generate Agent Instructions:** I will consolidate the agent instructions from 'Backlog.md/AGENTS.md' and the existing 'doro-cli/AGENTS.md'. I will create a new 'AGENTS.md' file in the 'doro-cli' project that provides clear instructions for using 'backlog.md' within the 'doro-cli' context. This will include workflow instructions, command examples, and best practices.
5. **Final 'doro-cli' verification** I will verify that doro-cli tasks can be managed and executed by agents without any issues.
<!-- SECTION:PLAN:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 code coverage is passing
- [ ] #2 VRTs added for ui changes
- [ ] #3 tests/linting/typecheck is green.
<!-- DOD:END -->
