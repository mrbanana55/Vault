# Tasks: Ideas Table UI Enhancements

**Branch**: `012-table-ui-enhancements`  
**Feature**: `012-table-ui-enhancements`  
**Spec**: [`specs/012-table-ui-enhancements/spec.md`](spec.md)  
**Plan**: [`specs/012-table-ui-enhancements/plan.md`](plan.md)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish column metadata definitions and shared UI types

- [X] T001 Define table column metadata types and interface contracts in `src/renderer/lib/table-columns.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core constants and test scaffolds required across user stories

**⚠️ CRITICAL**: Must complete before user story implementation begins

- [X] T002 [P] Implement column definitions dictionary with widths, alignments, and tooltip copy in `src/renderer/lib/table-columns.ts`
- [X] T003 [P] Create initial unit test scaffold for NoteReaderModal in `src/renderer/components/__tests__/NoteReaderModal.test.tsx`

**Checkpoint**: Column definitions and test scaffolding ready — User story implementation can now proceed

---

## Phase 3: User Story 1 - Stable Column Layout & Content Alignment (Priority: P1) 🎯 MVP

**Goal**: Lock column widths with `table-fixed`, center all column headers, and center row cells (except Title and Notes) so columns never shift during inline editing.

**Independent Test**:
1. Open table in Edit mode and click any editable cell (Title, BPM, Key, Authors, Section, Instruments, Notes).
2. Verify column widths and neighbor cells do not resize, jump, or shift.
3. Verify all column headers are centered.
4. Verify Duration, BPM, Key, Authors, Section, Instruments, Created, and Action cells are centered, while Title and Notes remain left-aligned.

### Tests for User Story 1

- [X] T004 [P] [US1] Add layout and alignment unit tests in `src/renderer/components/__tests__/IdeasTable.test.tsx`
- [X] T005 [P] [US1] Add cell alignment unit tests in `src/renderer/components/__tests__/TableRow.test.tsx`

### Implementation for User Story 1

- [X] T006 [US1] Refactor table container and header row to apply `table-fixed`, `min-w-[1100px]`, explicit width classes, and centered header text in `src/renderer/components/IdeasTable.tsx`
- [X] T007 [US1] Update cell alignment classes in `src/renderer/components/TableRow.tsx` (centering Duration, BPM, Key, Authors, Section, Instruments with centered pills, Created, and Action)
- [X] T008 [US1] Update `src/renderer/components/EditableCell.tsx` to support cell alignment (`align?: 'left' | 'center'`) and prevent input overflow with `w-full min-w-0 box-border`

**Checkpoint**: User Story 1 complete — Column widths are locked and text alignment is consistent across display and edit modes.

---

## Phase 4: User Story 2 - Clear Hover Affordance & Context-Sensitive Cursors (Priority: P1)

**Goal**: Display pointer cursor on editable cells in Edit mode, default cursor on headers, and in View mode restrict pointer cursor strictly to interactive elements (checkbox, play, action, non-empty notes).

**Independent Test**:
1. In Edit mode, hover over editable cells and verify `cursor-pointer` is displayed.
2. Hover over column headers and verify `cursor-default` is displayed and text selection is prevented.
3. In View mode, hover over static cells (Duration, Created, empty Notes) and verify `cursor-default` is displayed.
4. In View mode, hover over checkbox, play button, action button, and non-empty notes and verify `cursor-pointer` is displayed.

### Tests for User Story 2

- [X] T009 [P] [US2] Update unit tests in `src/renderer/components/__tests__/EditableCell.test.tsx` to assert `cursor-pointer` in Edit mode
- [X] T010 [P] [US2] Update unit tests in `src/renderer/components/__tests__/TableRow.test.tsx` to assert cursor states in View mode and Edit mode

### Implementation for User Story 2

- [X] T011 [US2] Update cell hover styling in `src/renderer/components/EditableCell.tsx` to use `cursor-pointer` instead of `cursor-text` when editable in Edit mode
- [X] T012 [US2] Apply `cursor-default select-none` to all `<th>` column headers in `src/renderer/components/IdeasTable.tsx`
- [X] T013 [US2] Update `src/renderer/components/TableRow.tsx` to apply `cursor-default` to static cells and conditionally apply `cursor-pointer` to Notes only when note text is present

**Checkpoint**: User Story 2 complete — All cursors provide accurate visual affordance matching interactivity rules.

---

## Phase 5: User Story 3 - Column Header Information Tooltips (Priority: P2)

**Goal**: Display informative hover tooltips for every column header explaining definitions and input format rules.

**Independent Test**:
1. Hover over the Instruments header; verify tooltip explains comma separation in edit mode.
2. Hover over the Authors header; verify tooltip explains comma separation for multiple collaborators.
3. Hover over Title, Duration, BPM, Key, Section, Created, and Notes headers; verify contextual descriptions appear.

### Tests for User Story 3

- [X] T014 [P] [US3] Add unit tests in `src/renderer/components/__tests__/IdeasTable.test.tsx` verifying each column header renders with its descriptive `title` attribute

### Implementation for User Story 3

- [X] T015 [US3] Bind descriptive tooltips from `src/renderer/lib/table-columns.ts` to `title` attributes on each `<th>` element in `src/renderer/components/IdeasTable.tsx`

**Checkpoint**: User Story 3 complete — All column headers display helpful onboarding tooltips on hover.

---

## Phase 6: User Story 4 - View Mode Full Notes Modal Reader (Priority: P2)

**Goal**: In View mode, clicking a Notes cell with text opens an Apple HIG-styled modal displaying the idea title and untruncated note body, dismissible via Close, Escape, or backdrop click.

**Independent Test**:
1. In View mode, click a Notes cell with text; verify NoteReaderModal opens displaying the title and full note text.
2. Press Escape key; verify modal closes.
3. Reopen and click outside modal backdrop; verify modal closes.
4. Click an empty Notes cell; verify cursor is default and no modal opens.
5. In Edit mode, click a Notes cell; verify inline editing opens instead of the modal.

### Tests for User Story 4

- [X] T016 [P] [US4] Write unit tests in `src/renderer/components/__tests__/NoteReaderModal.test.tsx` for dialog mounting, Escape dismissal, backdrop dismissal, and content display
- [X] T017 [P] [US4] Add integration tests in `src/renderer/components/__tests__/AppLayout.test.tsx` verifying note click opens modal in View mode and does not open in Edit mode

### Implementation for User Story 4

- [X] T018 [P] [US4] Implement `<NoteReaderModal />` in `src/renderer/components/NoteReaderModal.tsx`
- [X] T019 [US4] Wire `onNoteClick` handler to Notes cell in `src/renderer/components/TableRow.tsx` when `tableMode === 'view'` and note has content
- [X] T020 [US4] Thread `onNoteClick` through `src/renderer/components/IdeasTable.tsx` props
- [X] T021 [US4] Add `noteReaderModal` state, pass `onNoteClick` to `IdeasTable`, and render `<NoteReaderModal />` in `src/renderer/components/AppLayout.tsx`

**Checkpoint**: User Story 4 complete — Full notes can be viewed in View mode via the dedicated modal reader.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: End-to-end quality validation, type checks, and regression tests

- [X] T022 [P] Verify strict TypeScript type checks across all configs (`tsc --noEmit`, `tsc -p tsconfig.main.json --noEmit`, `tsc -p tsconfig.renderer.json --noEmit`)
- [X] T023 Run full automated test suite (`npm test`) and verify 100% pass rate across all suites with zero regressions
- [X] T024 Verify clean production build output with `npm run build`
- [X] T025 Validate all 6 scenarios defined in `specs/012-table-ui-enhancements/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1: Setup (T001)
       │
       ▼
Phase 2: Foundational (T002, T003)
       │
       ├─────────────────────────────────────────┐
       ▼                                         ▼
Phase 3: User Story 1 (P1 - Layout/Align)   Phase 4: User Story 2 (P1 - Cursors)
(T004 - T008)                               (T009 - T013)
       │                                         │
       ├─────────────────────────────────────────┘
       ▼
Phase 5: User Story 3 (P2 - Tooltips) (T014, T015)
       │
       ▼
Phase 6: User Story 4 (P2 - Note Reader Modal) (T016 - T021)
       │
       ▼
Phase 7: Polish & Cross-Cutting (T022 - T025)
```

### Parallel Opportunities

- **Phase 2**: `T002` (column definitions) and `T003` (test scaffold) can execute in parallel.
- **Phase 3 (US1)**: `T004` (IdeasTable tests) and `T005` (TableRow tests) can execute in parallel.
- **Phase 4 (US2)**: `T009` (EditableCell tests) and `T010` (TableRow cursor tests) can execute in parallel.
- **Phase 5 (US3)**: `T014` (tooltip tests) can execute in parallel with other test writing.
- **Phase 6 (US4)**: `T016` (NoteReaderModal tests) and `T018` (NoteReaderModal component) can execute in parallel.
- **Phase 7 (Polish)**: `T022` (TypeScript checks) can run in parallel with documentation/verification reviews.

---

## Implementation Strategy

### MVP Scope (User Story 1 Only)
1. Complete Phase 1 (Setup) and Phase 2 (Foundational).
2. Complete Phase 3 (User Story 1: Stable Column Layout & Content Alignment).
3. Validate: Confirm columns do not jump when clicked in Edit mode, and text is aligned properly.

### Incremental Delivery
1. **Increment 1 (MVP)**: Deliver fixed column sizing (`table-fixed`) and centered alignment.
2. **Increment 2**: Deliver polished hover affordances and context-sensitive cursors (User Story 2).
3. **Increment 3**: Deliver column header tooltips (User Story 3).
4. **Increment 4**: Deliver View Mode Note Reader modal dialog (User Story 4).
5. **Increment 5**: Full regression test suite, type check, and build verification (Polish).
