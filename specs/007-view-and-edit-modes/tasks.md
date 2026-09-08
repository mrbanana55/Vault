# Tasks: View and Edit Modes

**Branch**: `007-view-and-edit-modes` | **Date**: 2026-09-08 | **Plan**: [plan.md](specs/007-view-and-edit-modes/plan.md)

**Feature**: Add a view/edit mode toggle to the Ideas Table enabling inline cell editing with Escape/blur commit behavior. Renderer-only changes — the backend update pipeline is already complete.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Define shared types and utility functions needed by all user stories

- [x] T001 Define `EditableField` type union and `ActiveCellId` interface in src/renderer/types/inline-edit.ts. The `EditableField` type must be `'title' | 'bpm' | 'musical_key' | 'authors' | 'song_section' | 'notes' | 'instruments'`. The `ActiveCellId` type must be `{ noteId: number; field: EditableField } | null`. Also export a `TableMode` type alias: `'view' | 'edit'`. Also export a constant `EDITABLE_FIELDS: ReadonlyArray<EditableField>` listing all editable field keys, and a helper function `isEditableField(field: string): field is EditableField` that type-narrows a string.

- [x] T002 Create value transformation utility in src/renderer/lib/field-transforms.ts. Implement a `transformFieldValue(field: EditableField, rawValue: string): { valid: boolean; value: UpdateAudioNoteInput | null }` function that applies the per-field validation and transformation rules from the data model (see contracts/ui-contracts.md C5 Value Transformation Rules). For `title`: trim, reject if empty. For `bpm`: parse to positive number, empty → null, invalid → reject. For `musical_key`, `authors`, `song_section`, `notes`: trim, empty → null. For `instruments`: split by comma, trim each, filter empty → `instrument_names: string[]`. The function must return `{ valid: true, value: partialUpdateInput }` on success or `{ valid: false, value: null }` on rejection. Import `UpdateAudioNoteInput` from `@shared/types`.

- [x] T003 Create a helper function `getNoteFieldDisplayValue(note: NoteWithInstruments, field: EditableField): string` in src/renderer/lib/field-transforms.ts that extracts the current display string for a given field from an `AudioNote & { instruments: Instrument[] }` object. For most fields, return `String(note[field] ?? '')`. For `instruments`, return `note.instruments.map(i => i.name).join(', ')`. For `bpm`, return `note.bpm !== null ? String(note.bpm) : ''`. This is used to pre-populate the inline edit input.

**Checkpoint**: Shared types and utilities ready — all stories can now use them.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create the core reusable components and hooks that all user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Create the `useInlineEdit` custom hook in src/renderer/hooks/useInlineEdit.ts. The hook accepts an `onSave: (noteId: number, field: EditableField, value: string) => Promise<boolean>` callback parameter. It manages internal state: `activeCellId: ActiveCellId` (default `null`). It returns `{ activeCellId, startEdit, commitEdit, clearEdit }` per the C4 contract in contracts/ui-contracts.md. `startEdit(noteId, field)` sets `activeCellId`. `commitEdit(noteId, field, value)` calls `onSave`, then sets `activeCellId` to `null` regardless of result (the caller handles revert on failure). `clearEdit()` sets `activeCellId` to `null`. Use `useCallback` for all returned functions.

- [x] T005 Create the `EditableCell` component in src/renderer/components/EditableCell.tsx. Props: `{ value: string; isEditing: boolean; isEditable: boolean; tableMode: TableMode; onClick: () => void; onCommit: (newValue: string) => void; className?: string; children: React.ReactNode }`. When `isEditing === true`: render a controlled `<input>` inside a `<td>`. The input must auto-focus on mount (use `useRef` + `useEffect`), select all text on focus (`inputRef.current.select()`), call `onCommit(inputValue)` on `onBlur`, and call `inputRef.current.blur()` on `Escape` keydown (which triggers the blur handler to commit — no duplicate save logic). The input styling must match the cell text size and use `bg-transparent border border-accent rounded px-1 outline-none w-full text-content-primary` classes. When `isEditing === false` and `isEditable === true` and `tableMode === 'edit'`: render `{children}` inside a `<td>` with an `onClick` handler, `cursor-pointer` class, and a hover affordance class `hover:bg-surface-hover/50 hover:ring-1 hover:ring-border rounded transition-colors`. When `isEditable === false` or `tableMode === 'view'`: render `{children}` inside a plain `<td>` with no click handler or hover affordance, passing through `className`.

**Checkpoint**: Foundation ready — `useInlineEdit` hook and `EditableCell` component available for all user stories.

---

## Phase 3: User Story 1 — Toggle Between View and Edit Modes (Priority: P1) 🎯 MVP

**Goal**: Add a mode toggle control above the Ideas Table that switches between view mode (default) and edit mode. The table visually reflects the current mode.

**Independent Test**: Toggle the mode switch and verify the table's visual state changes. In view mode, cells show no editing affordances. In edit mode, editable cells show hover cues.

### Implementation for User Story 1

- [x] T006 [US1] Add `tableMode` state to src/renderer/components/AppLayout.tsx. Add `const [tableMode, setTableMode] = useState<TableMode>('view');` to the `AppLayout` component. Import `TableMode` from `../types/inline-edit`. Pass `tableMode` and `setTableMode` to the toolbar area where `TabBar` is rendered. Also pass `tableMode` to `<IdeasTable>` as a new prop.

- [x] T007 [US1] Create the `ModeToggle` component in src/renderer/components/ModeToggle.tsx. Props: `{ tableMode: TableMode; onModeChange: (mode: TableMode) => void }`. Render a segmented control with two buttons: "View" and "Edit". The active button should use `bg-surface-primary text-content-primary shadow-sm` classes and the inactive button should use `text-content-secondary hover:text-content-primary` classes. Wrap both buttons in a container with `inline-flex rounded-lg bg-surface-secondary border border-border p-0.5 gap-0.5` classes. Each button should have `px-3 py-1 text-xs font-medium rounded-md transition-colors` base classes. When "Edit" is clicked, call `onModeChange('edit')`. When "View" is clicked, call `onModeChange('view')`. Add appropriate `aria-pressed` attributes for accessibility.

- [x] T008 [US1] Integrate `ModeToggle` into the toolbar area in src/renderer/components/AppLayout.tsx. Place `<ModeToggle tableMode={tableMode} onModeChange={setTableMode} />` inside the existing `<div className="flex items-center justify-between mb-3 shrink-0">` container, to the right of `<TabBar>`. This uses the existing `justify-between` layout to position the toggle on the right side of the toolbar.

- [x] T009 [US1] Update `IdeasTable` in src/renderer/components/IdeasTable.tsx to accept and forward the `tableMode` prop. Add `tableMode: TableMode` to the `IdeasTableProps` interface (alongside existing `isUsed: 0 | 1`). Import `TableMode` from `../types/inline-edit`. Pass `tableMode` through to each `<TableRow>` as a new prop.

- [x] T010 [US1] Update `TableRow` in src/renderer/components/TableRow.tsx to accept the `tableMode` prop. Add `tableMode: TableMode` to the `TableRowProps` interface. For now, simply accept the prop — the actual per-cell rendering changes will come in User Story 2. Import `TableMode` from `../types/inline-edit`.

**Checkpoint**: At this point, the mode toggle is visible and functional. Clicking "View" / "Edit" updates the state. The table receives the mode prop. No editing behavior yet, but the mode control works end-to-end.

---

## Phase 4: User Story 2 — Inline Cell Editing (Priority: P1) 🎯 MVP

**Goal**: In edit mode, clicking an editable cell opens an inline text input. Changes are committed on Escape key or blur. Duration, Created, and Actions columns remain non-editable. Changes persist via the existing IPC update pipeline.

**Independent Test**: Enter edit mode, click a Title cell, type a new name, press Escape → verify the new name shows and persists after app restart. Repeat with BPM, Instruments, etc.

### Implementation for User Story 2

- [x] T011 [US2] Wire up `useInlineEdit` in src/renderer/components/AppLayout.tsx. Import `useInlineEdit` from `../hooks/useInlineEdit`. Implement the `onSave` callback that: (a) calls `transformFieldValue(field, value)` from `../lib/field-transforms`, (b) if invalid, return `false`, (c) if valid, calls `window.vaultAPI.notes.update({ id: noteId, ...transformedValue })`, (d) if `result.success`, calls the `refetch` function (obtained from `useNotes` — note: `refetch` is currently inside `IdeasTable`; this task requires lifting `useNotes` out of `IdeasTable` into `AppLayout` so the `onSave` callback can trigger a refetch after successful update), (e) returns `result.success`. Pass `activeCellId`, `startEdit`, `commitEdit`, and `clearEdit` from the hook down to `<IdeasTable>` as props.

- [x] T012 [US2] Refactor `IdeasTable` in src/renderer/components/IdeasTable.tsx to receive notes data and editing callbacks via props instead of calling `useNotes` internally. Update `IdeasTableProps` to: `{ notes: NoteWithInstruments[]; loading: boolean; error: string | null; onRefetch: () => void; tableMode: TableMode; activeCellId: ActiveCellId; onCellClick: (noteId: number, field: EditableField) => void; onCellCommit: (noteId: number, field: EditableField, value: string) => void }`. Remove the internal `useNotes` call. Move the `useNotes` call up to `AppLayout`. Pass `activeCellId`, `onCellClick` (mapped to `startEdit`), and `onCellCommit` (mapped to `commitEdit`) through to each `<TableRow>`.

- [x] T013 [US2] Update `AppLayout` in src/renderer/components/AppLayout.tsx to call `useNotes` directly (moved from IdeasTable). Call `const { notes, loading, error, refetch } = useNotes(activeTab);`. Pass `notes`, `loading`, `error`, and `refetch` (as `onRefetch`) to `<IdeasTable>`. Also pass the inline edit props from `useInlineEdit`: `activeCellId`, `onCellClick: startEdit`, `onCellCommit: commitEdit`. Update the mode toggle's `onModeChange` handler to: if switching from `edit` to `view` and there's an active cell, call `commitEdit` for the active cell before calling `setTableMode('view')` — or more precisely, call `clearEdit()` after any pending commit (the blur on the EditableCell will trigger the commit naturally when the mode switches and the input unmounts).

- [x] T014 [US2] Update `TableRow` in src/renderer/components/TableRow.tsx to accept and use editing props. Add to `TableRowProps`: `activeCellId: ActiveCellId`, `onCellClick: (noteId: number, field: EditableField) => void`, `onCellCommit: (noteId: number, field: EditableField, value: string) => void`. Replace each editable column's `<td>` with an `<EditableCell>` component. For each editable field (title, bpm, musical_key, authors, song_section, notes, instruments): compute `isEditing = activeCellId?.noteId === note.id && activeCellId?.field === fieldName`, pass `value={getNoteFieldDisplayValue(note, fieldName)}`, `isEditable={true}`, `tableMode={tableMode}`, `onClick={() => onCellClick(note.id, fieldName)}`, `onCommit={(val) => onCellCommit(note.id, fieldName, val)}`. For non-editable columns (duration_seconds, created_at, actions): render `<EditableCell isEditable={false} tableMode={tableMode} ...>` with no click handler, or keep existing `<td>` elements. Import `EditableCell` from `./EditableCell`, `getNoteFieldDisplayValue` from `../lib/field-transforms`, and `EditableField`, `ActiveCellId`, `TableMode` from `../types/inline-edit`.

- [x] T015 [US2] Handle mode transition edge case in src/renderer/components/AppLayout.tsx. When `setTableMode` is called to switch from `'edit'` to `'view'`, ensure any active editing cell is committed first. Implement this by wrapping the mode change: `const handleModeChange = useCallback((newMode: TableMode) => { if (newMode === 'view' && activeCellId) { clearEdit(); } setTableMode(newMode); }, [activeCellId, clearEdit]);`. The `EditableCell` component's input will naturally fire its `onBlur` handler when it unmounts (due to the mode change), which will call `onCommit`. Pass `handleModeChange` (not raw `setTableMode`) to `<ModeToggle>`.

- [x] T016 [US2] Verify the full edit-commit-persist cycle works end-to-end. This is a manual integration verification task. Launch the app (`npm run start`), import or have at least 2 ideas, toggle to Edit mode, click a Title cell, change the value, press Escape. Verify the new title displays. Restart the app and verify the title persisted. Repeat with: BPM (enter "140"), Key (enter "A minor"), Authors (enter "Jane Doe"), Instruments (enter "Guitar, Bass, Drums" — verify badge pills render), Notes (enter some text), Section (enter "Chorus"). Also verify: clicking Duration cell does nothing, clicking Created cell does nothing.

**Checkpoint**: Core editing is fully functional. Users can toggle to edit mode, click cells, modify values, and see changes persist. This is the MVP.

---

## Phase 5: User Story 3 — View Mode Interactions Preserved (Priority: P2)

**Goal**: Ensure that all existing view-mode interactions (playback, archive/restore, navigation) remain fully functional and are not broken by the new mode/editing code.

**Independent Test**: Stay in view mode and verify playback, archive/restore, and table rendering work identically to how they did before this feature.

### Implementation for User Story 3

- [x] T017 [US3] Verify view mode cell click isolation in src/renderer/components/EditableCell.tsx. Confirm that when `tableMode === 'view'` or `isEditable === false`, the `onClick` handler is not attached to the `<td>`. Review the EditableCell implementation from T005 and ensure: (1) no `onClick` is set on the `<td>` when `tableMode === 'view'`, (2) no cursor-pointer or hover affordance classes are applied in view mode. If the implementation already handles this correctly, mark this task as verified/complete.

- [x] T018 [US3] Verify archive/restore toggle still works in both modes in src/renderer/components/TableRow.tsx. The existing `handleToggle` function calls `window.vaultAPI.notes.update({ id, is_used })` and then `onToggle()` (which is now `onRefetch`). Confirm this still works after the refactoring in T012/T014: (1) the `onToggle` prop is still passed and correctly mapped to `refetch`, (2) the archive/restore button in the Actions column is NOT wrapped in an `EditableCell` (it remains a standalone `<td>` with the button), (3) clicking archive/restore in both view and edit modes triggers the toggle and refreshes the table.

- [x] T019 [US3] Run the existing test suite to confirm no regressions. Execute `npm test` and verify all existing tests pass. The refactoring in T012/T013 (moving `useNotes` from IdeasTable to AppLayout) may require updating existing component tests for `IdeasTable` if any exist. Check `src/renderer/components/__tests__/` for any IdeasTable or TableRow tests and update them to provide the new props.

**Checkpoint**: All existing view-mode functionality confirmed working. No regressions from the edit mode additions.

---

## Phase 6: User Story 4 — Edit Mode Visual Feedback (Priority: P2)

**Goal**: Provide clear visual cues in edit mode distinguishing editable from non-editable cells. Editable cells show hover affordances; non-editable cells do not.

**Independent Test**: Enter edit mode, hover over editable columns (Title, BPM, etc.) and verify subtle hover cues appear. Hover over Duration/Created/Actions and verify no cues. Switch to view mode and verify all hover cues are gone.

### Implementation for User Story 4

- [x] T020 [US4] Refine hover affordance styling for editable cells in src/renderer/components/EditableCell.tsx. Review and polish the hover styles set in T005. When `tableMode === 'edit'` and `isEditable === true` and `isEditing === false`: the `<td>` should have classes `cursor-text hover:bg-surface-hover/50 transition-colors` to provide a subtle background change on hover indicating the cell is clickable. Consider adding a very subtle dashed bottom border on hover: `hover:border-b hover:border-dashed hover:border-content-secondary/30`. When `tableMode === 'view'` or `isEditable === false`: ensure absolutely no hover affordance classes related to editing are present (the normal row-level `hover:bg-surface-hover` from the `<tr>` is fine and should not be interfered with).

- [x] T021 [US4] Add active editing cell visual indicator in src/renderer/components/EditableCell.tsx. When `isEditing === true`, the `<td>` should have a distinct visual state: `bg-surface-hover/30 ring-1 ring-accent/50 rounded` to show which cell is currently being edited. The `<input>` inside should have `text-content-primary bg-transparent border-0 outline-none ring-0 w-full py-0` to seamlessly blend with the cell while the ring on the `<td>` provides the visual boundary.

- [x] T022 [US4] Verify non-editable columns show no edit affordances. Manually verify (or review code) that the Duration, Created, and Actions columns in `TableRow` pass `isEditable={false}` to `EditableCell` (or are rendered as plain `<td>` elements). In edit mode, hover over these columns and confirm: no cursor change, no background highlight beyond the normal row hover, no clickable behavior.

**Checkpoint**: Visual feedback is polished. Users can clearly see which cells are editable in edit mode. Non-editable cells have no misleading affordances.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Edge case handling, error resilience, and final validation

- [x] T023 Handle the edge case where clicking a different cell while one is active in src/renderer/components/EditableCell.tsx. When `isEditing === true` and the user clicks a different `EditableCell`, the current cell's `<input>` loses focus (blur), which fires `onCommit`. Verify this already works due to the browser's natural blur-before-focus behavior. If it doesn't (e.g., React batches state updates causing the new cell to not activate), add explicit sequencing: in `startEdit` of `useInlineEdit` (src/renderer/hooks/useInlineEdit.ts), if `activeCellId` is non-null and different from the new cell, call `commitEdit` for the old cell first, then set the new `activeCellId`.

- [x] T024 [P] Add error handling for failed saves in src/renderer/hooks/useInlineEdit.ts. In the `commitEdit` function, if `onSave` returns `false` or throws, log the error to `console.error` with a descriptive message like `Failed to save field "${field}" for note ${noteId}`. The cell will revert visually because `EditableCell` only updates its display on re-render with new `value` prop (which won't change if save failed). Confirm this revert behavior works by: (1) temporarily making `onSave` return `false`, (2) verifying the cell snaps back to the old value.

- [x] T025 [P] Add `data-testid` attributes for future testing in src/renderer/components/EditableCell.tsx and src/renderer/components/ModeToggle.tsx. In `EditableCell`: add `data-testid={isEditing ? 'editable-cell-input' : 'editable-cell'}` to the `<td>` and `data-testid="cell-input"` to the `<input>`. In `ModeToggle`: add `data-testid="mode-toggle"` to the container, `data-testid="mode-view"` to the View button, and `data-testid="mode-edit"` to the Edit button.

- [x] T026 Run quickstart.md validation scenarios V1 through V13. Go through each validation scenario in specs/007-view-and-edit-modes/quickstart.md and verify it passes. Document any failures and fix them. Key scenarios: V1 (mode defaults to View), V3 (click to activate), V4 (Escape commits), V5 (blur commits), V6 (Duration non-editable), V7 (single cell active), V8 (Instruments comma-separated), V9 (empty title rejected), V10 (invalid BPM rejected), V11 (mode switch commits), V13 (playback independent).

- [x] T027 Run full test suite and verify zero regressions. Execute `npm test` and ensure all existing tests plus any new tests pass cleanly. Fix any failures introduced by the refactoring (especially the `useNotes` lift from IdeasTable to AppLayout in T012/T013).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 — mode toggle and prop plumbing
- **US2 (Phase 4)**: Depends on Phase 2 + Phase 3 — needs mode toggle working to enable editing
- **US3 (Phase 5)**: Depends on Phase 4 — verifies refactored code doesn't regress
- **US4 (Phase 6)**: Depends on Phase 4 — polishes visual feedback on top of working editing
- **Polish (Phase 7)**: Depends on Phases 3–6

### User Story Dependencies

- **US1 (P1)** → **US2 (P1)**: US2 depends on US1 (needs mode toggle to gate editing)
- **US3 (P2)**: Depends on US2 (verifies refactoring didn't break things)
- **US4 (P2)**: Depends on US2 (polishes visuals on existing editing)
- US3 and US4 can run **in parallel** after US2 completes

### Within Each User Story

- Types/utilities → hooks → components → integration → verification
- Each story's checkpoint should be validated before moving on

### Parallel Opportunities

- **Phase 1**: T001, T002, T003 can run in parallel (different files)
- **Phase 2**: T004 and T005 can run in parallel (different files)
- **Phase 3**: T007 is independent of T006 (different files), then T008–T010 are sequential
- **Phase 5 + Phase 6**: US3 and US4 can execute in parallel after US2
- **Phase 7**: T024 and T025 can run in parallel (different files)

---

## Parallel Example: Phase 1 (Setup)

```text
# All three tasks touch different files and can run simultaneously:
Task T001: "Define EditableField/ActiveCellId types in src/renderer/types/inline-edit.ts"
Task T002: "Create field transforms in src/renderer/lib/field-transforms.ts"
Task T003: "Create display value helper in src/renderer/lib/field-transforms.ts"
# Note: T002 and T003 are in the same file — run T002 first, then T003
```

## Parallel Example: Phase 2 (Foundational)

```text
# Both tasks touch different files:
Task T004: "Create useInlineEdit hook in src/renderer/hooks/useInlineEdit.ts"
Task T005: "Create EditableCell component in src/renderer/components/EditableCell.tsx"
```

## Parallel Example: After US2 Completes

```text
# US3 and US4 can run in parallel since they touch different concerns:
Phase 5 (US3): Verification tasks — no code changes, just confirming behavior
Phase 6 (US4): Visual polish — tweaking CSS classes in EditableCell.tsx
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup (types + transforms)
2. Complete Phase 2: Foundational (hook + EditableCell component)
3. Complete Phase 3: US1 — Mode toggle visible and functional
4. Complete Phase 4: US2 — Inline editing works end-to-end
5. **STOP and VALIDATE**: Toggle to edit mode, edit cells, press Escape, verify persistence
6. This is the **shippable MVP** — mode toggle + working inline editing

### Incremental Delivery

1. Setup + Foundational → Types, hook, and component ready
2. Add US1 → Mode toggle works → Checkpoint
3. Add US2 → Full editing works → **MVP!** Deploy/demo
4. Add US3 → Regression verified → Confidence
5. Add US4 → Visual polish → Production quality
6. Polish → Edge cases, error handling, test IDs → Release ready

---

## Notes

- **[P] tasks** = different files, no dependencies — can run in parallel
- **[US*] labels** map tasks to their user story for traceability
- **No backend changes** — all tasks are in `src/renderer/`
- **No new dependencies** — uses existing React, Tailwind, Vitest
- **Key refactoring**: T012/T013 lifts `useNotes` from `IdeasTable` to `AppLayout` — this is the largest structural change
- **Escape key commits** (does NOT cancel) — this is intentional per user's explicit request
- Commit after each task or logical group
- Stop at any checkpoint to validate independently
