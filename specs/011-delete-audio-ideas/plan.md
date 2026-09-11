# Implementation Plan: Delete Selected Audio Ideas

**Branch**: `011-delete-audio-ideas` | **Date**: 2026-09-11 | **Spec**: [specs/011-delete-audio-ideas/spec.md](specs/011-delete-audio-ideas/spec.md)

**Input**: Feature specification from `specs/011-delete-audio-ideas/spec.md`

## Summary

Implement a delete workflow for selected audio ideas consisting of:
1. A `<DeleteButton />` component positioned immediately to the right of `<TabBar />` with a trash icon and dynamic selected count badge.
2. A `<DeleteConfirmationModal />` dialog displaying an explicit warning ("Once deleted, the audio cannot be recovered") with "Accept" and "Cancel" actions.
3. Batch deletion orchestration in `<AppLayout />` that pauses active playback if a playing note is deleted, deletes all selected items via `window.vaultAPI.notes.delete`, clears the selection set, and refreshes the table.

## Technical Context

**Language/Version**: TypeScript 5.7+ / React 19 / Node.js 20+ / Electron 35  
**Primary Dependencies**: None new (React, Tailwind CSS v3, Vitest, Testing Library)  
**Storage**: SQLite row deletion & physical disk unlinking via existing `vaultAPI.notes.delete` IPC channel  
**Testing**: Vitest (`npm test`) with jsdom  
**Target Platform**: Desktop (macOS, Windows, Linux) via Electron  
**Project Type**: Desktop application (Electron Renderer)  
**Performance Goals**: Batch deletion of 1-10 notes and table refresh completed in < 1 second  
**Constraints**: Zero new external packages; strict process separation (IPC deletion); zero data destruction without explicit modal confirmation  
**Scale/Scope**: Frontend UI components and AppLayout integration  

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Stack Simplicity**: Zero new npm dependencies. Purely React, SVG icons, and Tailwind CSS.
- [x] **Process Separation**: Deletion commands sent via existing `window.vaultAPI.notes.delete` IPC bridge.
- [x] **Data Integrity**: Deletion is permanent upon confirmation; unlinking handled safely in Main process.
- [x] **Verifiable Tests**: Unit tests for `DeleteButton`, `DeleteConfirmationModal`, and `AppLayout` deletion orchestration.
- [x] **Unified Language**: 100% English code, comments, specs, and commit conventions.

## Project Structure

### Documentation (this feature)

```text
specs/011-delete-audio-ideas/
├── spec.md              # Feature specification
├── plan.md              # Implementation plan
├── research.md          # Technical decisions & research
├── data-model.md        # State definitions & transitions
├── quickstart.md        # Test & manual validation guide
├── contracts/
│   └── ui-contracts.md  # Component prop specifications
└── checklists/
    └── requirements.md  # Requirements quality checklist
```

### Source Code (repository root)

```text
src/
└── renderer/
    ├── components/
    │   ├── DeleteButton.tsx                 # [NEW] Trash icon button next to TabBar
    │   ├── DeleteConfirmationModal.tsx      # [NEW] Irreversible confirmation dialog modal
    │   ├── AppLayout.tsx                    # [MODIFY] Position DeleteButton next to TabBar, wire deletion
    │   └── __tests__/
    │       ├── DeleteButton.test.tsx        # [NEW] Unit tests for disabled/active states
    │       ├── DeleteConfirmationModal.test.tsx # [NEW] Unit tests for confirm/cancel
    │       └── AppLayout.test.tsx           # [MODIFY] Integration test for batch delete
```

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| None | N/A | Fully compliant with constitution |
