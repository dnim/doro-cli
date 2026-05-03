# doro-cli Agent Instructions

## Token Efficiency (All Agents)

- No preamble: never start responses with "I'll now...", "Sure!", "Let me...", "Great!"
- No narrating tool calls — execute, don't describe what you're about to do
- No repeating context already in the conversation
- Never create files unless explicitly required; always prefer editing existing ones
- Never create docs/README files unless asked
- **Plan mode**: output a structured numbered plan only — no code, no implementation prose
- **Build mode**: follow the plan, execute directly; ask only when genuinely blocked

## Standard Workflow

Core workflow rules (Git, Planning, Committing, CI/CD) are injected automatically via `opencode.json` instructions.

Agents not using OpenCode: refer to `.opencode/docs/AGENT_WORKFLOW.md`.

## Project-Specific Skills

### AntiVibe

- **Triggers**: `/antivibe` or "deep dive"
- **Action**: Generate a concise learning guide for recently modified/AI-generated code. Save to `deep-dive/[component]-YYYY-MM-DD.md`. Focus on _why_ decisions were made, tied to doro-cli's TUI/state-machine architecture. See `.opencode/skills/antivibe/SKILL.md`.

<!-- BACKLOG.MD MCP GUIDELINES START -->

<CRITICAL_INSTRUCTION>

## BACKLOG WORKFLOW INSTRUCTIONS

This project uses Backlog.md MCP for all task and project management activities.

**CRITICAL GUIDANCE**

- If your client supports MCP resources, read `backlog://workflow/overview` to understand when and how to use Backlog for this project.
- If your client only supports tools or the above request fails, call `backlog.get_backlog_instructions()` to load the tool-oriented overview. Use the `instruction` selector when you need `task-creation`, `task-execution`, or `task-finalization`.

- **First time working here?** Read the overview resource IMMEDIATELY to learn the workflow
- **Already familiar?** You should have the overview cached ("## Backlog.md Overview (MCP)")
- **When to read it**: BEFORE creating tasks, or when you're unsure whether to track work

These guides cover:
- Decision framework for when to create tasks
- Search-first workflow to avoid duplicates
- Links to detailed guides for task creation, execution, and finalization
- MCP tools reference

You MUST read the overview resource to understand the complete workflow. The information is NOT summarized here.

</CRITICAL_INSTRUCTION>

<!-- BACKLOG.MD MCP GUIDELINES END -->

When you're working on a task, you should assign it yourself: -a @{your-name}

In addition to the rules above, please consider the following:
At the end of every task implementation, try to take a moment to see if you can simplify it. 
When you are done implementing, you know much more about a task than when you started.
At this point you can better judge retrospectively what can be the simplest architecture to solve the problem.
If you can simplify the code, do it.

## Simplicity-first implementation rules

- Prefer a single implementation for similar concerns. Reuse or refactor to a shared helper instead of duplicating.
- Keep APIs minimal. Favor load + upsert over load/save/update, and do not add unused methods.
- Avoid extra layers (services, normalizers, versioning) unless there is an immediate, proven need.
- Keep behavior consistent across similar stores (defaults, parse errors, locking). Divergence requires a clear reason.
- Don't add new exported helpers just to compute a path; derive from existing paths or add one shared helper only when reused.


## Commands

### Development

- `npm install` - Install dependencies
- `npm run dev` - Run the CLI tool in development mode
- `npm run build` - Build the CLI tool
- `npm run typecheck` - Type-check code
- `npm run lint` - Run all ESLint checks
- `npm run format` - Format code with Prettier

### Testing

- `npm run test:unit` - Run all unit tests
- `npm run test:visual` - Run all visual regression tests
- `npm run test:visual:update` - Update visual regression test snapshots

### Configuration Management

- `bun run cli config list` - View all configuration values
- `bun run cli config get <key>` - Get a specific config value (e.g. defaultEditor)
- `bun run cli config set <key> <value>` - Set a config value with validation

## Core Structure

- **CLI Tool**: Built with TypeScript and intended to be used with `npx doro-cli` or as a global npm package (`npm i -g doro-cli`)
- **Source Code**: Located in `/src` directory with modular TypeScript structure
- **Task Management**: Uses markdown files in `.backlog/` directory structure
- **Workflow**: Git-integrated with task IDs referenced in commits and PRs

## Agent POV

- Treat Backlog.md as a shipped CLI/MCP binary that may be used from other repositories where agents cannot inspect this source tree.
- Backlog.md is not a supported JavaScript or TypeScript library API for external consumers. Do not treat exported source symbols, classes, or methods in `/src` as stable public interfaces unless they are explicitly documented in shipped CLI/MCP/instruction surfaces.
- When you decide what another agent can rely on, use only the public surface: MCP workflow resources, MCP tool descriptions/schemas, CLI help, and instruction files shipped with the project.
- Do not assume external agents know internal implementation details, constants, or source-only conventions.
- When reviewing changes, do not ask for compatibility shims just because a source-level method exists or was removed. Only preserve compatibility for behavior that is part of the documented CLI, MCP, config, or instruction contract.
- If a convention matters for agent behavior, document it in the public MCP/instruction surface rather than relying on source-code discovery.

## Code Standards

- **Runtime**: Node.js >=22 with TypeScript
- **Formatting**: Prettier
- **Linting**: ESLint
- **Testing**: Jest for unit tests, Playwright for visual regression tests
- **Pre-commit**: Husky runs linting and testing before commits

The pre-commit hook automatically runs linting and tests on staged files to ensure code quality. If any errors are found, the commit will be blocked until fixed.

## Git Workflow

- **Branching**: Use feature branches when working on tasks (e.g. `tasks/doro-123-feature-name`)
- **Committing**: Use the following format: `DORO-123: Title of the task`
- **PR titles**: Use `{taskId}: {taskTitle}` (e.g. `DORO-123: Title of the task`)
- **Github CLI**: Use `gh` whenever possible for PRs and issues
