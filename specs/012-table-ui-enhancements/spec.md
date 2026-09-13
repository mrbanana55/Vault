# Feature Specification: Ideas Table UI Enhancements

**Feature Branch**: `012-table-ui-enhancements`

**Created**: 2026-09-12

**Status**: Draft

**Input**: User description: "Let’s make some improvementes in the UI. Right now there are some things that I don’t like about the UI:
* The columns size changes when I edit them, I want them to have the same size when I’m editing them and when I’m not.
* Right now the cursor is type text in the edit mode, i want to see a pointer cursor when i hover on the editable things.
* The table column titles have also a text cursor in both view and edit modes, i want them to be type cursor-default.
* When I’m in view mode i want to have a cursor default in the table for everything except the the play button, checkbox and notes (if they have content). These should be cursor type.
* I want to have the column names centered.
* I want the row info to be centered, except for the title and notes.
* Each column name should have a tooltip showing useful info like how to add multiple instruments or authors, or a description of the column content.
* Long notes should be clickable in view mode. When I click one note with content I should see a modal opening showing the full text. If there’s no conent in the note section then the mouse should be default and no modal should open."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Stable Column Layout & Content Alignment (Priority: P1)

Musicians and producers organizing their musical catalog need the ideas table to remain visually stable and well-aligned. Currently, table columns dynamically jump and shift widths when clicking into cells to edit them, creating a jarring experience. Additionally, column headings and data fields lack consistent visual alignment.

In this story, all table columns maintain fixed, predictable widths that never expand, shrink, or shift whether a cell is in static display mode or active inline editing mode. All column header titles are centered. All row data fields are centered, except for the Title and Notes columns, which remain left-aligned for natural text reading.

**Why this priority**: Layout stability is foundational to usability. Shifting column widths during editing is visually disruptive and causes missed clicks or disorientation.

**Independent Test**:
1. Open the ideas table and note column widths.
2. Toggle into Edit mode and click into any editable cell (Title, BPM, Key, Authors, Section, Instruments, Notes).
3. Verify that column widths and neighboring cells remain perfectly locked in place without jumping.
4. Verify that all column headers are centered.
5. Verify that Duration, BPM, Key, Authors, Section, Instruments, Created, and Action values are centered within their columns, while Title and Notes are left-aligned.

**Acceptance Scenarios**:

1. **Given** the ideas table is rendered with audio ideas, **When** the user inspects the header row, **Then** all column header labels are visually centered in their respective column headers.
2. **Given** any audio idea row in the table, **When** the user inspects the cell contents, **Then** the Title and Notes cells are left-aligned, and all other cells (Duration, BPM, Key, Authors, Section, Instruments, Created Date, Action) are centered.
3. **Given** the user is in Edit mode, **When** the user clicks any editable cell to begin editing, **Then** the column widths, table geometry, and neighboring cells do not change size or shift position.
4. **Given** an active inline edit input, **When** the user commits or dismisses the edit, **Then** the column widths remain identical to their editing size.

---

### User Story 2 - Clear Hover Affordance & Context-Sensitive Cursors (Priority: P1)

Users need intuitive cursor cues so they immediately recognize what is interactive and what is static in both View and Edit modes.

In Edit mode, hovering over any editable cell should display a pointer cursor (`cursor-pointer`) to invite clicking, rather than a text selection beam (`cursor-text`). In both View and Edit modes, hovering over column headers should show a default arrow cursor (`cursor-default`) to reflect that headers are static labels. In View mode, all table cells show a default cursor, except for directly actionable elements: the Selection Checkbox, the Play/Pause button, the Action toggle button, and any Notes cell containing content, all of which must display a pointer cursor (`cursor-pointer`). If a Notes cell has no content, it displays a default cursor (`cursor-default`).

**Why this priority**: Clear cursor semantics prevent user confusion between editing, selecting text, and triggering actions, ensuring an accessible and polished desktop application feel.

**Independent Test**:
1. Switch to Edit mode: hover over Title, BPM, Key, Authors, Section, Instruments, and Notes cells; verify pointer cursor appears on each.
2. Hover over any column header in both View and Edit modes; verify default cursor appears.
3. Switch to View mode: hover over non-interactive cells (e.g. Duration, Created Date, empty Notes); verify default cursor appears.
4. In View mode: hover over the row checkbox, play button, archive action, and non-empty notes cell; verify pointer cursor appears.

**Acceptance Scenarios**:

1. **Given** the user is in Edit mode, **When** hovering over any editable cell, **Then** the mouse cursor displays as a pointer (`cursor-pointer`).
2. **Given** the user is in either View or Edit mode, **When** hovering over any column title in the header, **Then** the mouse cursor displays as default (`cursor-default`) and text selection is prevented.
3. **Given** the user is in View mode, **When** hovering over static cells (Duration, Created Date, or an empty Notes cell), **Then** the mouse cursor displays as default (`cursor-default`).
4. **Given** the user is in View mode, **When** hovering over the row selection checkbox, the play/pause button, the archive/restore button, or a Notes cell containing text, **Then** the mouse cursor displays as a pointer (`cursor-pointer`).

---

### User Story 3 - Column Header Information Tooltips (Priority: P2)

When cataloging ideas, users benefit from immediate contextual guidance on what each column represents and how to format entries (such as separating multiple authors or instruments with commas, or understanding section abbreviations).

In this story, every table column header presents a helpful, non-intrusive tooltip on hover that explains the purpose of the column and provides guidance on expected formats and multi-item entry conventions.

**Why this priority**: Tooltips onboard users progressively without cluttering the compact table layout, reducing user errors when tagging or editing metadata.

**Independent Test**:
1. Hover over the "Instruments" header; verify tooltip displays explaining that multiple instruments can be added separated by commas.
2. Hover over the "Authors" header; verify tooltip displays explaining how to enter multiple collaborators separated by commas.
3. Hover over other column headers ("Title", "Duration", "BPM", "Key", "Section", "Created", "Notes"); verify contextual descriptions appear.

**Acceptance Scenarios**:

1. **Given** the user hovers over any column header, **When** the cursor rests over the header title, **Then** an informative tooltip appears describing the column's meaning or input conventions.
2. **Given** the user hovers over the "Instruments" column header, **Then** the tooltip instructs the user: "Musical instruments tagged on this idea. In edit mode, separate multiple instruments with commas."
3. **Given** the user hovers over the "Authors" column header, **Then** the tooltip instructs the user: "Songwriters and performers. In edit mode, separate multiple authors with commas."
4. **Given** the user hovers over the "BPM" column header, **Then** the tooltip displays: "Beats per minute tempo (positive numeric value)."
5. **Given** the user hovers over the "Key" column header, **Then** the tooltip displays: "Musical key signature (e.g., C maj, A min, F#)."
6. **Given** the user moves the mouse away from the header, **Then** the tooltip disappears cleanly.

---

### User Story 4 - View Mode Full Notes Modal Reader (Priority: P2)

Audio ideas frequently include longer lyrics, arrangement notes, chord progressions, or production reminders that are truncated in the compact table row. Users in View mode need a way to read the complete note text without accidentally triggering editing mode.

In this story, when the user is in View mode and clicks a Notes cell that contains text, a dedicated Note Reader modal dialog opens displaying the idea's Title and the complete, untruncated note content. If the Notes cell is empty (or whitespace-only), clicking it does nothing and the cursor remains default. In Edit mode, clicking the Notes cell continues to activate inline editing as expected.

**Why this priority**: Users need to review rich production notes and lyrics quickly during listening or arrangement sessions without switching modes or editing text.

**Independent Test**:
1. In View mode, find a row with note text and click the Notes cell; verify the Note Reader modal opens showing the note's title and full text.
2. Verify the modal can be dismissed using the Close button, clicking the backdrop, or pressing the Escape key.
3. In View mode, click a row with an empty Notes cell; verify no modal opens and no state changes.
4. Switch to Edit mode and click a Notes cell; verify inline editing opens instead of the modal.

**Acceptance Scenarios**:

1. **Given** the table is in View mode and a row has note content, **When** the user clicks on the Notes cell, **Then** a modal opens displaying the idea title, full note text, and a Close button.
2. **Given** the Note Reader modal is open, **When** the user clicks the Close button, clicks outside the modal dialog backdrop, or presses the Escape key, **Then** the modal closes and focus returns gracefully.
3. **Given** the table is in View mode and a row has empty (or null/whitespace) notes, **When** the user hovers or clicks on the Notes cell, **Then** the cursor remains default (`cursor-default`) and no modal opens.
4. **Given** the table is in Edit mode, **When** the user clicks any Notes cell, **Then** inline text editing activates and no modal opens.

---

### Edge Cases

- **Empty or Whitespace-Only Notes**: Cells where `notes` is `null`, `""`, or contains only whitespace must be treated as empty: cursor must be `cursor-default` in View mode, and clicking must not open the modal.
- **Very Long Unbroken Strings in Modal**: If notes contain very long URLs or unbroken strings without spaces, the modal reader must wrap text cleanly (`break-words` / `whitespace-pre-wrap`) with a scrollable container so content never overflows the viewport.
- **Rapid Mode Switching**: If the user has the Note Reader modal open and switches tabs or presses hotkeys, the modal should handle state cleanly without collision.
- **Narrow Viewports and Overflow**: With fixed column widths, horizontal scrolling on the table container must remain smooth, headers must remain sticky, and columns must not collapse below their defined minimum widths.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST enforce fixed, stable column sizing such that entering or exiting inline editing does not change the width or position of any column or neighboring cell.
- **FR-002**: The system MUST visually center all column header titles in the table header.
- **FR-003**: The system MUST visually center all cell data within their columns for Duration, BPM, Key, Authors, Section, Instruments, Created Date, and Action columns.
- **FR-004**: The system MUST keep cell data left-aligned for Title and Notes columns to preserve text readability.
- **FR-005**: In Edit mode, the system MUST display a pointer cursor (`cursor-pointer`) when hovering over any editable cell (Title, BPM, Key, Authors, Section, Instruments, Notes).
- **FR-006**: In both View and Edit modes, the system MUST display a default cursor (`cursor-default`) on all column header titles and suppress browser text selection.
- **FR-007**: In View mode, the system MUST display a default cursor (`cursor-default`) for all static table cells.
- **FR-008**: In View mode, the system MUST display a pointer cursor (`cursor-pointer`) exclusively for interactive elements: the row selection checkbox, the play/pause button, the archive/restore button, and any Notes cell containing text.
- **FR-009**: In View mode, when a Notes cell is empty or contains only whitespace, the system MUST display a default cursor (`cursor-default`) and ignore click events.
- **FR-010**: In View mode, when a user clicks a Notes cell containing text, the system MUST open a Note Reader modal dialog displaying the audio idea's title and the full note text.
- **FR-011**: The Note Reader modal MUST support dismissal via a Close button, clicking the backdrop, or pressing the Escape key.
- **FR-012**: In Edit mode, clicking any Notes cell MUST initiate inline text editing and MUST NOT open the Note Reader modal.
- **FR-013**: The system MUST display an informative tooltip on hover for each column header explaining its purpose and input format rules (including comma-separated lists for Authors and Instruments).
- **FR-014**: Tooltips MUST be accessible and dismiss cleanly when the user moves the pointer away from the header.

### Key Entities

- **Ideas Table Column Configuration**: Defines column identifiers, labels, fixed width proportions, text alignment (left vs. center), and descriptive tooltip text.
- **Note Reader Modal State**: Transient UI state managing visibility (`isOpen`), active note identifier (`noteId`), idea title, and full note content.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Column width variation between display mode and active inline edit mode is 0 pixels (zero layout shift when clicking to edit).
- **SC-002**: 100% of column header titles are centered, and 100% of row cells comply with their alignment rules (Title and Notes left-aligned, all others centered).
- **SC-003**: 100% of column headers provide informative tooltips on hover.
- **SC-004**: In View mode, clicking any non-empty Notes cell displays the full note in a modal dialog in under 100ms.
- **SC-005**: 100% of automated tests across the table, cell editing, cursor behavior, and modal reader pass with zero regressions.

## Assumptions

- Standard desktop cursor types (`cursor-pointer`, `cursor-default`, `cursor-text`) are supported natively by Electron and Chromium browsers.
- Column header tooltips can leverage native HTML tooltips or lightweight accessible CSS tooltips without introducing third-party tooltip libraries, adhering strictly to the Stack Simplicity principle.
- Full note content is already present in the client-side `AudioNote` entity fetched from the database, requiring no additional database queries or IPC roundtrips to populate the Note Reader modal.
- The Note Reader modal is read-only in View mode; editing continues to be handled via Edit mode.
