# Plan: Fix Pause Audio Interruption and Transition Behavior

- **Feature**: Improve pause behavior to interrupt audio and handle transition period correctly
- **Branch**: `fix/pause-audio-transition`
- **Status**: `Completed`
- **Depends On**: N/A
- **Summary**: Fix two pause-related issues: (1) pause should stop currently playing audio, and (2) pause during transition should confirm next mode but leave timer paused instead of running. No new dependencies required.

---

### Checklist

- [x] **(Mandatory)** Update `pauseResume` handler in `src/app.ts` to call `stopPlayback()` when transitioning from running to paused
- [x] **(Mandatory)** Add special handling for `pauseResume` during `switchPrompt` state to confirm transition and immediately pause
- [x] **(Mandatory)** Suppress start sound when pause is used during transition (option 2 from user choice)
- [x] **(Mandatory)** Add test for audio interruption on pause
- [x] **(Mandatory)** Add test for pause during transition behavior
- [x] **(Mandatory)** Verify changes by running the type checker and unit tests
