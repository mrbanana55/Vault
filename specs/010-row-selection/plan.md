# Implementation Plan: Row Selection via Checkboxes

**Branch**: `010-row-selection` | **Date**: 2026-09-11 | **Spec**: [specs/010-row-selection/spec.md](specs/010-row-selection/spec.md)

**Input**: Feature specification from `specs/010-row-selection/spec.md`

## Summary

Implement row selection via checkboxes in the Vault ideas table, supporting individual toggling and Gmail-style `Shift + Click` contiguous range selection. The selection mechanism will be managed in a clean, reusable React hook (`useRowSelection`), integrated into `AppLayout`, `IdeasTable`, and `TableRow`, with zero third-party dependencies, accessible markup, and theme-coordinated styling.

## Technical Context

**Language/Version**: TypeScript 5.7+ / React 19 / Node.js 20+ / Electron 35  
**Primary Dependencies**: None new (React, Tailwind CSS v3, Vitest, Testing Library)  
**Storage**: Transient client state (`Set<number>` in React state); zero DB changes  
**Testing**: Vitest (`npm test`) with jsdom  
**Target Platform**: Desktop (macOS, Windows, Linux) via Electron  
**Project Type**: Desktop application (Electron Renderer)  
**Performance Goals**: < 16ms render response on row toggle / shift-select; zero lag on tables with 100+ ideas  
**Constraints**: Zero new external packages; strict process separation (purely Renderer); zero interference with playback, inline editing, or archiving  
**Scale/Scope**: Frontend UI hook and table components  

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Stack Simplicity**: Zero new npm dependencies. Built with standard React hooks, HTML checkbox input, and Tailwind CSS.
- [x] **Process Separation**: Purely Renderer-side logic. No IPC or SQLite modifications required.
- [x] **Data Integrity**: Underlying audio notes and database rows remain unaffected.
- [x] **Verifiable Tests**: Unit tests for `useRowSelection` hook, `TableRow`, `IdeasTable`, and `AppLayout`.
- [x] **Unified Language**: All interfaces, variable names, test descriptions, and comments are in English.

## Project Structure

### Documentation (this feature)

```text
specs/010-row-selection/
├── spec.md              # Feature specification
├── plan.md              # Implementation plan
├── research.md          # Technical decisions & research
├── data-model.md        # State definitions & transitions
├── quickstart.md        # Test & manual validation guide
├── contracts/
│   └── ui-contracts.md  # Hook & component prop specifications
└── checklists/
    └── requirements.md  # Requirements quality checklist
```

### Source Code (repository root)

```text
src/
└── renderer/
    ├── hooks/
    │   ├── useRowSelection.ts               # [NEW] Hook for selection state, anchor, & shift-click
    │   └── __tests__/
    │       └── useRowSelection.test.ts      # [NEW] Comprehensive unit tests for hook
    ├── components/
    │   ├── TableRow.tsx                     # [MODIFY] Add checkbox column, index prop, isSelected highlight
    │   ├── IdeasTable.tsx                   # [MODIFY] Add checkbox column header, pass selection props
    │   ├── AppLayout.tsx                    # [MODIFY] Instantiate useRowSelection, pass to IdeasTable
    │   └── __tests__/
    │       ├── TableRow.test.tsx            # [MODIFY] Add tests for checkbox & selection styling
    │       └── IdeasTable.test.tsx          # [MODIFY] Add tests for selection column rendering
```

**Structure Decision**: Place the state management in `src/renderer/hooks/useRowSelection.ts` to keep `AppLayout` and `IdeasTable` lean and testable. Pass selection state and handlers cleanly down through component props.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| None | N/A | Fully compliant with constitution |
