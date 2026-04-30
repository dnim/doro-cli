# Plan: Commit Approval System for AI Agents

- **Feature**: Implement a system to prevent AI agents from committing code without explicit user approval
- **Branch**: `feature/commit-approval-system`
- **Status**: `In Progress`
- **Depends On**: None
- **Summary**: Research and implement safeguards to ensure AI agents always ask for user permission before making git commits, addressing the issue of unauthorized commits despite instructions.

---

### Problem Statement

AI agents consistently commit code without explicit user approval despite clear instructions not to do so. This violates workflow requirements and can lead to unwanted commits in the repository.

### Proposed Solutions (Research Findings)

1. **Git Hooks Approach**:
   - Create a `pre-commit` hook that prompts for approval
   - Hook checks if commit is being made by an AI agent (via commit message patterns or environment variables)
   - Requires user confirmation via interactive prompt before allowing commit

2. **Wrapper Script Approach**:
   - Replace git command with a wrapper script that intercepts commits
   - Script prompts for approval before executing actual git commit
   - Can be configured per-repository or globally

3. **Interactive Commit Tool**:
   - Create a specialized commit tool that always requires approval
   - Tool displays proposed commit message and asks for confirmation
   - Integrates with existing workflow via git aliases

4. **Environment-Based Protection**:
   - Use environment variables to detect automated vs manual commits
   - Implement approval gates when automated context is detected

### Implementation Plan

#### Phase 1: Git Hook Solution

- [ ] Create `pre-commit` hook that detects AI agent commits
- [ ] Implement interactive approval prompt
- [ ] Add hook installation script to project

#### Phase 2: Integration with OpenCode

- [ ] Research OpenCode-specific integration points
- [ ] Implement approval mechanism within OpenCode workflow
- [ ] Test with current doro-cli project

#### Phase 3: Documentation and Best Practices

- [ ] Document the approval system setup
- [ ] Create guidelines for AI agent commit workflows
- [ ] Provide template hooks for other projects

### Current Issue: Sound Indicator Missing

Additionally, the sound indicator is not displaying on medium-sized screens as shown in the provided image. This needs to be addressed in the existing UI fix plan.

### Research Sources

- Git hooks documentation: https://git-scm.com/docs/githooks
- Stack Overflow discussion on hooks in repositories
- GitHub CODEOWNERS and approval mechanisms
- Various npm/composer hook management tools

### Next Steps

1. Implement and test pre-commit hook solution
2. Research OpenCode's internal commit mechanisms
3. Create user-friendly approval interface
4. Test with current workflow and iterate based on findings
