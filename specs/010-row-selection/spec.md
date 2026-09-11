# Feature Specification: Row Selection via Checkboxes

**Feature Branch**: `010-row-selection`

**Created**: 2026-09-11

**Status**: Draft

**Input**: User description: "I want to be able to select one or more audio ideas with a checkbox like gmail does for selecting one or more mails. I’d like to be able to check one checkbox at a time but also I’d like to select only the first checkbox and the last one with shift + click to select all the rows in between. This checkbox should be at the left of each table row."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Single and Multi-Row Selection via Checkboxes (Priority: P1)

A musician viewing their table of audio ideas wants to select one or multiple individual ideas using a checkbox placed at the far-left of each row, identical to how emails are selected in webmail applications like Gmail. When a checkbox is clicked, the row toggles between selected and unselected states, providing distinct visual feedback across the row.

**Why this priority**: Individual row selection is the foundational user journey. Without being able to select items one at a time and see the selection state reflected, multi-item batch workflows or range selections cannot function.

**Independent Test**: Can be tested by rendering the ideas table, clicking the checkbox on any individual row, verifying that only that row reflects the selected state visually and in state, and clicking it again to verify that it unselects.

**Acceptance Scenarios**:

1. **Given** a table displaying audio ideas, **When** the table renders, **Then** each row displays an unselected checkbox in a dedicated column at the far left (preceding the play button and title).
2. **Given** an unselected row, **When** the user clicks its checkbox, **Then** the checkbox becomes checked and the row applies a highlighted selected appearance.
3. **Given** a selected row, **When** the user clicks its checkbox, **Then** the checkbox becomes unchecked and the row returns to its normal appearance.
4. **Given** multiple rows in the table, **When** the user clicks the checkboxes of row 1 and row 3 independently, **Then** both row 1 and row 3 are selected while row 2 remains unselected.

---

### User Story 2 - Range Selection via Shift + Click (Priority: P1)

A musician with many audio ideas wants to select a continuous range of ideas without having to click every single checkbox individually. The user clicks a first row's checkbox to establish an anchor, and then holds the Shift key while clicking another row's checkbox (either further down or up in the list). All rows between the anchor and the clicked row (inclusive) are immediately selected.

**Why this priority**: Efficiently managing collections of ideas requires fast bulk selection. Range selection via Shift + Click is the universal standard pattern (as in Gmail, Finder, File Explorer) for selecting contiguous sequences.

**Independent Test**: Can be tested by clicking the checkbox of row 2, then holding Shift and clicking the checkbox of row 6, verifying that rows 2, 3, 4, 5, and 6 are all selected in a single operation.

**Acceptance Scenarios**:

1. **Given** row 2 is clicked without Shift, **When** the user holds Shift and clicks the checkbox of row 5, **Then** rows 2, 3, 4, and 5 all become selected.
2. **Given** row 6 is clicked without Shift, **When** the user holds Shift and clicks the checkbox of row 2 (upwards range), **Then** rows 2, 3, 4, 5, and 6 all become selected.
3. **Given** some non-contiguous rows are already selected (e.g., row 1 and row 2), **When** the user holds Shift and clicks from row 4 to row 7, **Then** the selection expands to include the range from the last-clicked anchor (row 4) to row 7 while preserving or updating selection predictably.
4. **Given** a user holds Shift and clicks a checkbox when no previous row has been clicked as an anchor in the current session, **Then** that row is selected and acts as the initial anchor for subsequent Shift-clicks.

---

### User Story 3 - Selection Reset and Tab Isolation (Priority: P2)

A musician navigating between the "Ideas" (active) tab and the "Archive" tab, or performing actions that alter the table data (such as toggling an idea to archive or refetching), expects selection state to remain consistent and prevent phantom selections of hidden or non-existent items.

**Why this priority**: Preventing stale selection references across tab switches or data reloads ensures data integrity and avoids unexpected behavior when batch actions are subsequently introduced.

**Independent Test**: Can be tested by selecting several ideas in the "Ideas" tab, switching to the "Archive" tab, verifying that the archive tab starts with no selected rows, and switching back to verify predictable state handling.

**Acceptance Scenarios**:

1. **Given** active ideas are selected on the "Ideas" tab, **When** the user switches to the "Archive" tab, **Then** the active selection does not carry over to items in the Archive tab.
2. **Given** an idea is selected, **When** that idea is archived/restored or removed from the current view, **Then** that idea is removed from the active selection set.

---

### Edge Cases

- **Shift-clicking the same row twice**: If a user clicks a row's checkbox and then Shift-clicks the exact same row, only that single row is affected without errors.
- **Empty table**: If no ideas exist in the current tab, no checkboxes are displayed and selection state is empty.
- **Table sorting / dynamic list**: Range selection operates based on the current visual display order of the rows in the table, from the top index to the bottom index.
- **Interactions with existing controls**: Clicking the checkbox must not trigger audio playback (play button), cell inline editing (in Edit mode), or idea archiving (archive button). The checkbox click event must be isolated to row selection.
- **Text selection interference**: Holding Shift while clicking can sometimes cause browser text selection; the selection click handling must prevent unintended text selection highlights during range operations.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The table MUST display a dedicated checkbox column at the far left of each row (index 0, preceding the Play button column).
- **FR-002**: Each row's checkbox MUST visually reflect whether that particular row is currently selected or unselected.
- **FR-003**: Clicking an unselected row's checkbox without modifier keys MUST add that row's ID to the selection set and record that row as the selection anchor.
- **FR-004**: Clicking a selected row's checkbox without modifier keys MUST remove that row's ID from the selection set.
- **FR-005**: When the user holds the Shift key and clicks a row's checkbox:
  - If an anchor row exists, the system MUST select all rows between the anchor index and the clicked row index (inclusive), based on the current visual order in the table.
  - If no anchor row exists, the clicked row MUST become selected and set as the anchor.
- **FR-006**: Selected rows MUST display a distinct visual background highlight that coordinates with the application's light and dark theme palette (e.g. subtle accent/tint background) while remaining visually distinguishable from the currently playing audio row highlight.
- **FR-007**: Clicking the checkbox MUST NOT trigger row inline editing, audio playback, status toggling, or unintended document text selection.
- **FR-008**: When switching between the "Ideas" and "Archive" tabs, the selection set MUST be cleared or partitioned so that items from one tab are not treated as selected in another tab.
- **FR-009**: When an idea is deleted, archived, or removed from the visible list, its ID MUST be automatically pruned from the selection set.
- **FR-010**: Checkboxes MUST be accessible via keyboard focus and standard toggle interactions (`Space` or `Enter` when focused).

### Key Entities

- **SelectedNoteIdSet**: A set or collection of unique audio note identifiers representing the currently selected ideas in the active view.
- **SelectionAnchor**: The visual index or identifier of the most recently clicked idea row used as the reference point for Shift-click contiguous range selections.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can select or deselect any individual row with a single click in less than 100 milliseconds visual response time.
- **SC-002**: Users can select a range of any number of contiguous rows (e.g. 2 to 50+ rows) using Shift + Click in a single 2-click operation instead of clicking each row individually.
- **SC-003**: 100% of rows selected in a range match the contiguous visual sequence between the anchor and target rows.
- **SC-004**: Zero unintended side effects: clicking a checkbox never starts audio playback, opens an edit input, or alters the note's archived status.
- **SC-005**: Visual selection highlight is clearly noticeable in both Light and Dark mode while preserving legibility of all row metadata.

## Assumptions

- This specification covers the row selection mechanism (checkboxes, single-click toggle, Shift+click range selection, visual row styling, and state management). Bulk actions that operate on selected rows (e.g. bulk delete, bulk archive, bulk tagging) are decoupled and will be implemented in subsequent specifications or features that consume this selection state.
- Range selection follows standard list index ordering as currently rendered in the DOM / table data.
- The checkbox column is positioned at the leftmost edge of the table, preceding the Play/Pause column, following standard table and email client conventions.
