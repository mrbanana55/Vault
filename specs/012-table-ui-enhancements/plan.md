# Implementation Plan: Ideas Table UI Enhancements

**Branch**: `012-table-ui-enhancements` | **Date**: 2026-09-12 | **Spec**: [`specs/012-table-ui-enhancements/spec.md`](spec.md)

**Input**: Feature specification from `specs/012-table-ui-enhancements/spec.md`

## Summary

This feature resolves ergonomic and visual issues in the Ideas Table catalog:
1. **Locked Column Widths**: Eliminates layout jumping during inline editing by migrating the table to `table-fixed` with fixed proportional widths across all 12 columns and setting `min-w-[1100px]`.
2. **Text Alignment**: Centers all column header titles; centers row cell data for all columns except Title and Notes (which remain left-aligned for reading flow).
3. **Cursor Semantics**: Displays `cursor-pointer` when hovering over editable cells in Edit mode; displays `cursor-default select-none` on column headers; and in View mode displays `cursor-default` across the table except for interactive controls (Checkbox, Play/Pause, Action button, and non-empty Notes cells, which show `cursor-pointer`).
4. **Column Header Tooltips**: Provides helpful hover tooltips on each column header explaining field purposes and input conventions (e.g. comma-separated instruments and authors).
5. **View Mode Note Reader Modal**: Allows users in View mode to click any non-empty Notes cell to view the full, untruncated note text in an Apple HIG-styled modal dialog dismissible via Close button, backdrop click, or Escape key.

---

## Technical Context

**Language/Version**: TypeScript 5.7+ (Node.js 20+, Electron 35)  
**Primary Dependencies**: React 19, Tailwind CSS v3, Vitest 3, Testing Library  
**Storage**: N/A (UI-only enhancements, consuming existing database schema and IPC contracts)  
**Testing**: Vitest (`npm test`) using jsdom  
**Target Platform**: Desktop application (Electron / macOS, Windows, Linux)  
**Project Type**: Desktop application (Renderer UI components)  
**Performance Goals**: Instant modal opening (<50ms), 0px layout shift during cell editing  
**Constraints**: Zero new third-party dependencies; strict process separation (purely in `src/renderer/`); 100% English code, comments, and specs  
**Scale/Scope**: 4 modified UI files (`IdeasTable.tsx`, `TableRow.tsx`, `EditableCell.tsx`, `AppLayout.tsx`), 1 new modal component (`NoteReaderModal.tsx`), and corresponding unit tests.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Requirement | Compliance Status | Rationale |
|---|---|---|---|
| **STACK SIMPLICITY** | No third-party dependencies added | ✅ PASS | Implemented purely with React 19, Tailwind CSS v3, and native HTML attributes. |
| **PROCESS SEPARATION** | UI logic isolated in Renderer | ✅ PASS | All changes are strictly inside `src/renderer/`. Zero IPC, SQLite, or Main process modifications. |
| **VERIFIABLE TESTS** | Automated tests for all components | ✅ PASS | Comprehensive unit and interaction tests planned for `NoteReaderModal`, `EditableCell`, `TableRow`, and `IdeasTable`. |
| **DATA INTEGRITY** | Read-only presentation of notes | ✅ PASS | Note Reader modal is strictly read-only in View mode. Database rows and audio files remain immutable. |
| **UNIFIED LANGUAGE** | All code, docs, and commits in English | ✅ PASS | 100% English compliance across all artifacts. |

---

## Project Structure

### Documentation (this feature)

```text
specs/012-table-ui-enhancements/
├── spec.md              # Feature specification
├── plan.md              # This technical implementation plan
├── research.md          # Architectural research and layout decisions
├── data-model.md        # UI state models and cursor decision matrices
├── contracts/           # UI component interface contracts
│   └── ui-contracts.md
├── checklists/          # Specification validation checklist
│   └── requirements.md
├── quickstart.md        # Runnable validation scenarios
└── tasks.md             # Implementation tasks (generated via /speckit-tasks)
```

### Source Code Impact

```text
src/
└── renderer/
    ├── components/
    │   ├── __tests__/
    │   │   ├── NoteReaderModal.test.tsx  # [NEW] Modal reader unit tests
    │   │   ├── EditableCell.test.tsx     # [UPDATE] Test pointer cursor in edit mode
    │   │   ├── TableRow.test.tsx         # [UPDATE] Test alignment, cursors, note click
    │   │   ├── IdeasTable.test.tsx       # [UPDATE] Test fixed layout, tooltips, centering
    │   │   └── AppLayout.test.tsx        # [UPDATE] Test note modal orchestration
    │   ├── NoteReaderModal.tsx           # [NEW] View mode note modal dialog
    │   ├── EditableCell.tsx              # [UPDATE] Support pointer cursor & alignment
    │   ├── TableRow.tsx                  # [UPDATE] Alignments, cursor states, note click
    │   ├── IdeasTable.tsx                # [UPDATE] table-fixed, column tooltips, header centering
    │   └── AppLayout.tsx                 # [UPDATE] Mount NoteReaderModal & manage state
    └── types/
        └── inline-edit.ts                # (Existing types unchanged or extended if needed)
```

**Structure Decision**: Standard Vault Renderer component architecture, cleanly isolating the new `NoteReaderModal` and augmenting existing table components without altering IPC or Main layers.

---

## Complexity Tracking

*No violations. All principles pass unconditionally.*
