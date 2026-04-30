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
