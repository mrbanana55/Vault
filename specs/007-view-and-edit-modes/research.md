# Research: View and Edit Modes

**Feature**: 007-view-and-edit-modes | **Date**: 2026-09-08

## R1: Table Mode State Management Pattern

**Decision**: Local state in `AppLayout` with prop drilling to `IdeasTable` → `TableRow`

**Rationale**: The mode toggle is a simple binary state (`'view' | 'edit'`) with no cross-component communication needs beyond the table hierarchy. Creating a React Context for a single boolean that only flows down one component tree (AppLayout → IdeasTable → TableRow) would be over-engineering. The `ThemeContext` pattern in the codebase is justified because theme affects the entire app; mode only affects the table.

**Alternatives considered**:
- **New `TableModeContext`**: Rejected — only the table tree needs mode state; context adds unnecessary provider wrapping and indirection for no benefit.
- **URL/route-based state**: Rejected — this is a transient UI state that should not persist or be shareable. The app doesn't use routing.

---

## R2: Inline Cell Editing UX Pattern

**Decision**: Controlled `<input>` element that replaces the cell content when active, with blur and Escape key both triggering commit.

**Rationale**: The user explicitly requested click-to-edit with Escape-to-save and click-away-to-save. This is a straightforward controlled input pattern:
1. Click on editable cell → render `<input>` pre-populated with current value
2. `onBlur` → commit the value
3. `onKeyDown` for Escape → commit the value (blur the input, which triggers commit)

The key insight is that pressing Escape should call `inputRef.current.blur()`, which triggers the `onBlur` handler that does the actual commit. This avoids duplicate save logic.

**Alternatives considered**:
- **ContentEditable divs**: Rejected — harder to control, inconsistent cross-browser behavior, difficult to sanitize input.
- **Double-click to edit**: Rejected — user explicitly requested single click activation.
- **Modal/drawer editing**: Rejected — user explicitly requested inline cell editing.

---

## R3: Active Cell State Management

**Decision**: Custom `useInlineEdit` hook managing `activeCellId: { noteId: number; field: string } | null`

**Rationale**: Only one cell can be edited at a time (FR-010). A single state variable tracking the currently active cell (by note ID + field name) is sufficient. When a new cell is clicked:
1. If another cell is active, commit its value (via blur)
2. Set the new cell as active

The hook encapsulates:
- `activeCellId` state
- `startEdit(noteId, field)` — sets active cell
- `commitEdit(noteId, field, value)` — calls `window.vaultAPI.notes.update()`, handles errors
- `cancelEdit()` — clears active cell without saving (not used per user's Escape=save requirement, but useful for error recovery)

**Alternatives considered**:
- **State per TableRow**: Rejected — cannot enforce single-cell-active constraint across rows.
- **State in each EditableCell**: Rejected — same problem; cells can't coordinate.

---

## R4: Instruments Column Editing Strategy

**Decision**: Text input with comma-separated instrument names, converted to `string[]` on commit.

**Rationale**: The existing `UpdateAudioNoteInput.instrument_names` field accepts `string[]`. Currently, instruments are displayed as badge pills in the table. For inline editing, the simplest approach is:
1. When editing starts: join current instruments into a comma-separated string (e.g., `"Guitar, Piano, Drums"`)
2. User edits the comma-separated text
3. On commit: split by comma, trim whitespace, filter empty strings → pass as `instrument_names[]` to update

This matches the inline text input pattern for all other fields without requiring a special tag-input widget. The `getOrCreateInstrument` function in the backend already handles creating new instruments that don't exist.

**Alternatives considered**:
- **Tag input widget with autocomplete**: Rejected for v1 — adds UI complexity beyond scope. The backend `instruments:get-all` IPC channel exists for future autocomplete support.
- **Multi-select dropdown**: Rejected — inline editing should be fast and text-based per user's description.

---

## R5: BPM Field Validation

**Decision**: Accept text input, parse to number on commit, revert on invalid input.

**Rationale**: The database has a `CHECK (bpm IS NULL OR bpm > 0)` constraint. The field type is `number | null`. On commit:
1. If input is empty → set `bpm: null`
2. If input is a valid positive number → set `bpm: parsedNumber`
3. If input is invalid (NaN, negative, zero) → revert to previous value and optionally show a brief error

This is simpler than adding input type restrictions (which would require different `<input type>` per column) and matches the universal text input pattern.

---

## R6: Error Handling and Notification

**Decision**: Inline revert with console warning. No toast system for v1.

**Rationale**: The app currently has no toast/notification system. Building one is out of scope for this feature. If a save fails:
1. Revert the cell to its previous value
2. Log the error to console for debugging
3. The cell visually "snaps back" to the old value, providing implicit feedback that the save failed

The existing `IPCResult<T>` contract already provides structured error messages in `{ success: false, error: string }`.

**Alternatives considered**:
- **Toast notification system**: Rejected — new dependency or significant UI work out of scope. Can be added in a future feature.
- **Red border flash on cell**: A possible lightweight visual cue that could be added during implementation if time allows, but not required.

---

## R7: Mode Toggle UI Placement and Design

**Decision**: Toggle button in the `Header` component, next to the existing import button.

**Rationale**: The `Header` component already contains tab navigation and the import action button. Adding a mode toggle here keeps all table controls in one location. The toggle should:
1. Use the existing Tailwind theme tokens (`accent`, `surface-secondary`, `border`)
2. Show clear text labels: "View" / "Edit" or an icon toggle (pencil icon)
3. Indicate the active mode visually (e.g., accent color for active mode)

The `Header` component receives an `onTabChange` callback and `activeTab` state from `AppLayout`. Adding `tableMode` and `onModeChange` follows the same prop pattern.

---

## R8: Testing Strategy for Renderer Components

**Decision**: Use @testing-library/react + Vitest with jsdom for EditableCell and useInlineEdit unit tests.

**Rationale**: The project has `@testing-library/react` and `jsdom` installed but no component tests yet. This feature introduces the first component tests. Focus on:
1. `EditableCell` — renders input on click, commits on blur, commits on Escape
2. `useInlineEdit` — state transitions, single-active-cell enforcement
3. Mock `window.vaultAPI.notes.update` for commit tests

The existing main-process test pattern (Vitest `describe/it/expect`) will be followed for consistency.
