# Plan: Fix Tiny UI Volume Indicator

- **Feature**: Show volume state (normal/quiet/muted) in responsive UI even at extremely small terminal sizes
- **Branch**: `fix/tiny-ui-volume-indicator`
- **Status**: `Completed`
- **Depends On**: None
- **Summary**: Currently responsive UI hides volume indicators when doro is tiny (16x3). Add compact volume icons and prioritize volume visibility over lock state for ultra-small terminals.

---

### Checklist

- [x] **(Mandatory)** Analyze current getRunningStatusText fallback logic in src/ui.ts
- [x] **(Mandatory)** Add compact volume icons (▪=muted, ▫=quiet, ▬=normal) to status candidates
- [x] **(Mandatory)** Reorder status fallback to prioritize volume indicators in tiny widths
- [x] **(Mandatory)** Add unit tests for volume indicator visibility at constrained widths
- [x] **(Mandatory)** Extend VRT tests to capture volume mode states at tiny/ultra-small sizes
- [x] **(Mandatory)** Verify changes by running the type checker and unit tests

### Implementation Notes

- Used custom block characters for clean display: ■ (locked), □ (unlocked), ▪ (muted), ▫ (quiet), ▬ (normal)
- Status line fallback now prioritizes volume over lock state at ultra-tiny widths
- Added new status candidates: `${status} ${volumeIcon}` and `${lockIcon} ${volumeIcon}`
- Volume indicator appears even at 1-character width
