# doro-cli: Gemini Context

`doro-cli` is a keyboard-first, full-screen terminal Pomodoro timer written in TypeScript for Node.js. Soft pastel themes, synthetic 8-bit audio cues. Stack: Node.js >=22, TypeScript, `neo-blessed` TUI.

## Token Efficiency

- No preamble ("I'll now...", "Sure!", "Let me...")
- No narrating tool calls — execute, don't describe
- No repeating context already in the conversation
- Never create files unless required; prefer editing existing ones
- **Plan mode**: structured numbered plan only — no code, no prose
- **Build mode**: follow the plan, execute directly; ask only when blocked

## Instructions & Source of Truth

All agent instructions live in `.opencode/docs/`:

- **Workflow** (Git, planning, committing): `.opencode/docs/AGENT_WORKFLOW.md`
- **Dev commands**: `.opencode/docs/DEV_COMMANDS.md`
- **Architecture**: `.opencode/docs/ARCHITECTURE.md`
- **Conventions & debugging**: `.opencode/docs/DEVELOPMENT_GUIDELINES.md`
