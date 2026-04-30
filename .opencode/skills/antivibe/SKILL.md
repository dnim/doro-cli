---
name: antivibe
description: Doro-cli tailored Anti-vibecoding skill. Generates focused, educational explanations of AI-written code without bloated documentation.
triggers:
  - phrase: '/antivibe'
  - phrase: 'deep dive'
---

# AntiVibe (doro-cli edition)

When triggered, generate a concise learning guide for recently modified or AI-generated code. Save to `deep-dive/[component]-YYYY-MM-DD.md`. No filler, no padding.

## Guidelines

1. **Why, not What**: Design logic and architecture decisions — not a code recitation.
2. **Contextualize**: Tie explanations to doro-cli's `neo-blessed` TUI and state machine constraints.
3. **Be Direct**: Name the CS concept, TypeScript feature, or TUI pattern. Cut generic prose.
4. **Resources**: At most 2 highly specific links — no generic tutorials.
