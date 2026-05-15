---
description: Review staged git changes before committing
---
Review the staged changes (`git diff --cached`). Check for:
- TypeScript type errors or missing types
- Logic bugs and edge cases
- Consistency with doro-cli patterns (TUI state machine, neo-blessed constraints)
- Missing or broken unit/visual tests
- AGENTS.md conventions (branch naming, commit format, simplicity-first rules)

Summarise findings as: ✅ ready / ⚠️ needs fix, with a short list of issues.
