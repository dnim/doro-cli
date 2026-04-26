---
name: antivibe
description: Doro-cli tailored Anti-vibecoding skill. Generates focused, educational explanations of AI-written code without bloated documentation.
triggers:
  - phrase: '/antivibe'
  - phrase: 'deep dive'
---

# AntiVibe (doro-cli edition)

When triggered, generate a concise learning guide for recently modified or AI-generated code. Save output to `deep-dive/[component]-YYYY-MM-DD.md`.

## Guidelines

1. **Explain the Why**: Focus on design logic and architecture decisions, not just reciting the code.
2. **Contextualize**: Relate explanations to `doro-cli`'s keyboard-first `neo-blessed` UI and state machine constraints.
3. **Be Direct**: Strip away generic fluff. Point directly to CS concepts, TypeScript features, or relevant TUI patterns utilized.
4. **Resources**: Include at most 1 or 2 highly specific reference links (no generic tutorials).
