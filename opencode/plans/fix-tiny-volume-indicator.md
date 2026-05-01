# Plan: Fix Tiny UI Volume Indicator

- **Feature**: Show volume state (normal/quiet/muted) in responsive UI even at extremely small terminal sizes
- **Branch**: `fix/tiny-ui-volume-indicator`
- **Status**: `In Progress`
- **Depends On**: None
- **Summary**: Currently responsive UI hides volume indicators when doro is tiny (16x3). Add compact volume icons and prioritize volume visibility over lock state for ultra-small terminals. Also fix missing sound indicator on medium screens.

---

### Issues Found

1. **Tiny Terminal (16x3)**: Volume indicators completely missing ✅ FIXED
2. **Medium Terminal**: Sound indicator not displaying in status line (see image: shows "RUNNING | OPEN" but no volume indicator)

### Checklist

- [x] **(Mandatory)** Analyze current getRunningStatusText fallback logic in src/ui.ts
- [x] **(Mandatory)** Add compact volume icons (✕♪♫ for volume, ⊘○ for lock) to status candidates
- [x] **(Mandatory)** Reorder status fallback to prioritize volume indicators in tiny widths
- [x] **(Mandatory)** Add unit tests for volume indicator visibility at constrained widths
- [x] **(Mandatory)** Extend VRT tests to capture volume mode states at tiny/ultra-small sizes
- [x] **(Mandatory)** Verify changes by running the type checker and unit tests
- [ ] **(Critical)** Fix missing sound indicator on medium screen sizes
- [ ] **(Mandatory)** Test across all screen sizes (large, medium, small, ultra-small, tiny)

### Implementation Notes

- Used classic Unicode characters for broad compatibility: ⊘ (locked), ○ (unlocked), ✕ (muted), ♪ (quiet), ♫ (normal)
- Status line fallback now prioritizes volume over lock state at ultra-tiny widths
- Added new status candidates: `${status} ${volumeIcon}` and `${lockIcon} ${volumeIcon}`
- Volume indicator appears even at 1-character width
- **NEW**: Need to investigate why medium screens don't show volume indicator despite having space
