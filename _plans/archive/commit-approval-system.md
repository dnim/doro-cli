# Plan: Commit Approval System for AI Agents

- **Feature**: Implement a system to prevent AI agents from committing code without explicit user approval
- **Branch**: `feature/commit-approval-system`
- **Status**: `In Progress`
- **Depends On**: None
- **Summary**: Research and implement safeguards to ensure AI agents always ask for user permission before making git commits, addressing the issue of unauthorized commits despite instructions.

---

### Acceptance Criteria

- Documentation clearly explains existing OpenCode commit protections
- Workflow instructions are explicit about pre-commit approval requirements
- Agents understand how to properly request commit approval
- Manual human commits work without friction
- Clear guidance on troubleshooting commit permission issues

### Research Findings

**OpenCode already prevents unauthorized commits via:**

1. `opencode.json` permission system: `"git commit *": "deny"` for plan/general agents
2. Environment variables: `OPENCODE=1`, `OPENCODE_RUN_ID`, `OPENCODE_PROCESS_ROLE=worker`
3. Workflow requirement: `.opencode/docs/AGENT_WORKFLOW.md:34` mandates pre-commit approval

**Root issue:** Agent compliance with existing instructions, not missing safeguards.

### Checklist

- [x] **(Mandatory)** Research OpenCode-specific integration points and commit mechanisms
- [x] **(Decision)** Evaluate strategy: OpenCode's existing permission system is sufficient
- [ ] **(Mandatory)** Update workflow documentation to clarify existing protections
- [ ] **(Mandatory)** Add explicit guidance for agents on commit approval workflow
- [ ] **(Mandatory)** Document troubleshooting steps for commit permission issues
- [ ] **(Optional)** Add examples of proper commit request patterns
- [ ] **(Mandatory)** Test documentation with current OpenCode setup
- [ ] **(Mandatory)** Verify changes by running the type checker and unit tests
