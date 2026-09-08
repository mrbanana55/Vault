# Implementation Plan: View and Edit Modes

**Branch**: `007-view-and-edit-modes` | **Date**: 2026-09-08 | **Spec**: [spec.md](file:///Users/andresdelgado/Documents/Coding/Vault/specs/007-view-and-edit-modes/spec.md)

**Input**: Feature specification from `specs/007-view-and-edit-modes/spec.md`

## Summary

Add a view/edit mode toggle to the Ideas Table that enables inline cell editing. In view mode (default), the table is read-only with existing playback and navigation. In edit mode, users click editable cells to type changes — committing on Escape key or blur. The backend update pipeline (`notes:update` IPC → SQLite → preload bridge) is already fully operational; this feature is entirely a Renderer-side UI addition.

## Technical Context

**Language/Version**: TypeScript 5.8 (strict mode, no `any`)

**Primary Dependencies**: React 19, Tailwind CSS 3.4, Electron 36 (Renderer process only for this feature)

**Storage**: SQLite via `better-sqlite3` — no schema changes required. Existing `updateNote` repository function handles partial updates.

**Testing**: Vitest 3.1 + @testing-library/react 16 (installed but no component tests yet)

**Target Platform**: Cross-platform desktop (macOS, Windows, Linux) via Electron

**Project Type**: Desktop application (Electron + React)

**Performance Goals**: Mode toggle and cell activation must feel instant (< 100ms perceived latency); edit commits should complete within 500ms.

**Constraints**: All UI logic must remain in the Renderer process. No new dependencies. No `any` types.

**Scale/Scope**: Single table component with ~10 columns, handling dozens to low hundreds of rows.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| **STACK SIMPLICITY** | ✅ PASS | No new dependencies. Uses React, TypeScript, Tailwind only. |
| **PROCESS SEPARATION** | ✅ PASS | All changes are Renderer-side. Updates flow through existing `window.vaultAPI.notes.update()` IPC bridge. No `fs` or DB access in Renderer. |
| **VERIFIABLE TESTS** | ✅ PASS | Plan includes component tests for inline editing using existing @testing-library/react + Vitest setup. |
| **DATA INTEGRITY** | ✅ PASS | No audio file changes. Updates go through existing parameterized SQLite queries via IPC. |
| **UNIFIED LANGUAGE** | ✅ PASS | All code, types, comments in English. |
| **Strict Typing** | ✅ PASS | No `any` usage. All new types defined in shared types or component-local interfaces. |
| **Functional Components** | ✅ PASS | All new/modified components are functional React components. |
| **IPCResult<T> Contract** | ✅ PASS | Uses existing `IPCResult<T>` return type from `window.vaultAPI.notes.update()`. |

All gates pass. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/007-view-and-edit-modes/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── ui-contracts.md  # UI interaction contracts
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```text
src/
├── renderer/
│   ├── components/
│   │   ├── IdeasTable.tsx        # MODIFY: Pass mode prop, render EditableCell
│   │   ├── TableRow.tsx          # MODIFY: Accept mode, render EditableCell per editable column
│   │   ├── EditableCell.tsx      # NEW: Inline editing cell component
│   │   ├── Header.tsx            # MODIFY: Add mode toggle button
│   │   └── AppLayout.tsx         # MODIFY: Add tableMode state, pass down
│   ├── hooks/
│   │   └── useInlineEdit.ts      # NEW: Hook managing active cell state, commit, revert
│   └── context/
│       └── (no new contexts needed — mode state lives in AppLayout)
├── shared/
│   └── types/
│       └── (no changes — UpdateAudioNoteInput already sufficient)
└── main/
    └── (no changes — backend pipeline already complete)
```

**Structure Decision**: This feature adds 2 new files (`EditableCell.tsx`, `useInlineEdit.ts`) and modifies 4 existing files (`AppLayout.tsx`, `Header.tsx`, `IdeasTable.tsx`, `TableRow.tsx`). All changes are in `src/renderer/`. No new contexts, no backend changes, no new dependencies.
