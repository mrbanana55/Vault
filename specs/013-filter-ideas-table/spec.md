# Feature Specification: Filter Ideas Table

**Feature Branch**: `013-filter-ideas-table`

**Created**: 2026-09-15

**Status**: Draft

**Input**: User description: "Let’s add some filters for the ideas table. I would like to see a filter button next to the trash button and when i click that button i’d like to see a modal open (like the one we made for audio notes). Inside this modal i want to see a form where i can specify the values i’m looking for. There should be one row for the following parameters: BPM (range), Key, Authors, Section, Instruments. After filling the form, I should see the ideas that match these filters and to remove the filters I should see an X to remove all filters. There should not be a confirmation button to delete filters. There should be a tooltip for the new buttons. If there is an empty row filter then the row filter should not be considered for filtering. Text filters should be case insensitive. Modify the spec: I wanna have a confirm button to apply the filters. I don't want to submit the form with the enter key, I explicitly want the user to click the apply button to avoid accidental submits while filling the form. Support comma-separated values for multiple authors and instruments using AND logic. Also add a tooltip to show the user how to insert the filter values."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Filter Ideas Modal and Click-Only Apply Confirmation (Priority: P1 - MVP)

Musicians and producers maintaining a growing collection of audio ideas need a quick, focused way to narrow down the table to find ideas matching specific musical criteria (tempo range, musical key, collaborators, song section, or instruments). 

In this story, a filter button is positioned in the toolbar directly next to the trash button. Clicking this button opens a modal dialog styled consistently with other application dialogs. Inside the modal, a structured form presents five dedicated parameter rows:
1. **BPM (range)**: Allows specifying a minimum tempo, a maximum tempo, or both.
2. **Key**: Allows specifying a musical key signature.
3. **Authors**: Allows specifying one or more composers/performers. When multiple authors are entered separated by commas (e.g. `John, Paul`), the system requires **all** specified authors to be present on the idea (AND logic), order-independently.
4. **Section**: Allows specifying a song section (e.g., Chorus, Verse, Bridge, Intro).
5. **Instruments**: Allows specifying musical instruments. When multiple instruments are entered separated by commas (e.g. `Guitar, Piano`), the system requires **all** specified instruments to be tagged on the idea (AND logic), order-independently.

Each parameter row in the modal provides a descriptive hover tooltip informing the user how to format their search inputs (such as using commas to search for multiple authors or instruments).

The modal footer provides an explicit **"Apply"** confirmation button. The ideas table is not filtered on every keystroke. To prevent accidental submits while filling out multiple fields in the form, pressing the `Enter` key inside any input field is explicitly suppressed and does not submit the form. The user must intentionally click the "Apply" button to commit their criteria, which updates the ideas table and closes the modal. Empty parameter fields are ignored. All text filtering is case-insensitive and matches partial text.

**Why this priority**: Core value proposition of the feature. Enabling musicians to filter their library by musical metadata with deliberate confirmation ensures accurate searches without premature or accidental table re-renders.

**Independent Test**:
1. Populate the library with several ideas possessing distinct BPM, key signatures, multiple authors, sections, and multiple instruments.
2. Click the filter button next to the trash button; verify the filter modal opens with the 5 parameter rows and an "Apply" button in the footer.
3. Hover over the Authors and Instruments row labels/inputs; verify informative tooltips explain that multiple items can be separated by commas.
4. Enter a multi-author query (e.g., `Paul, John`); verify that pressing `Enter` does not submit the form. Click "Apply" and observe that ideas containing both John and Paul (regardless of sequence or middle names) are displayed, while ideas containing only John are excluded.
5. Enter a multi-instrument query (e.g., `Guitar, Piano`); click "Apply" and observe that ideas tagged with both a guitar and a piano are displayed.
6. Clear an input field and click "Apply"; verify that parameter is omitted from filtering and the table updates accordingly.

**Acceptance Scenarios**:

1. **Given** the user is viewing the ideas table, **When** the user clicks the filter button next to the trash button, **Then** a modal dialog opens displaying a form with rows for BPM (range), Key, Authors, Section, Instruments, and an "Apply" button in the footer.
2. **Given** the user hovers over any parameter row in the filter modal, **Then** an accessible tooltip appears explaining the expected input format and conventions (e.g., comma separation for multiple authors and instruments).
3. **Given** the filter modal is open with criteria entered, **When** the user explicitly clicks the "Apply" button, **Then** the modal closes and the underlying ideas table updates to show only the audio ideas that satisfy all active filter criteria.
4. **Given** the user is typing into any filter input field, **When** the user presses the `Enter` key, **Then** the form is NOT submitted, the modal remains open, and the table filter is not updated.
5. **Given** the user enters multiple authors separated by commas (e.g. `John, Paul`), **When** filtering occurs, **Then** only ideas that contain all specified authors (case-insensitive AND logic, order-independent) are displayed.
6. **Given** the user enters multiple instruments separated by commas (e.g. `Guitar, Piano`), **When** filtering occurs, **Then** only ideas tagged with all specified instruments (case-insensitive AND logic, order-independent) are displayed.
7. **Given** any filter parameter row is left empty or cleared, **When** the user clicks "Apply", **Then** that parameter is ignored and does not restrict matching ideas.
8. **Given** a text filter (Key, Authors, Section, Instruments) is specified, **When** comparing against idea metadata, **Then** matching is case-insensitive and matches partial strings (e.g., "chorus" matches "Chorus", "d min" matches "D minor", "guitar" matches "Acoustic Guitar").
9. **Given** the user specifies a BPM minimum and maximum and clicks "Apply", **When** filtering occurs, **Then** only ideas with a BPM greater than or equal to the minimum and less than or equal to the maximum are shown.
10. **Given** the user specifies only a BPM minimum and clicks "Apply", **When** filtering occurs, **Then** ideas with a BPM greater than or equal to the minimum are shown.
11. **Given** the user specifies only a BPM maximum and clicks "Apply", **When** filtering occurs, **Then** ideas with a BPM less than or equal to the maximum are shown.
12. **Given** the user enters criteria that match no audio ideas and clicks "Apply", **Then** the table displays an empty state indicating that no ideas match the current filters.

---

### User Story 2 - Instant Filter Clearing via 'X' Button (Priority: P1 - MVP)

Users who have applied filters need an effortless, frictionless way to clear all filters and view their entire catalog again without having to open the modal and manually erase each field.

In this story, whenever at least one filter criterion is active, a dedicated 'X' (Clear Filters) button appears in the toolbar adjacent to the filter button. Clicking this button immediately resets all filter parameters, closes the modal if it was open, and restores the full catalog of ideas without asking for confirmation. When no filters are active, the 'X' button is automatically hidden.

**Why this priority**: Fast reset capability is critical for a smooth browsing workflow; requiring users to manually clear individual fields would be frustrating and slow down creative work.

**Independent Test**:
1. Apply one or more filters; verify that the 'X' button appears next to the filter button in the toolbar.
2. Click the 'X' button; verify that all filter fields are immediately wiped, all ideas are displayed in the table, and no confirmation prompt is displayed.
3. Verify that the 'X' button disappears once filters are cleared.

**Acceptance Scenarios**:

1. **Given** one or more filter fields contain active values, **When** the toolbar is viewed, **Then** an 'X' button is visible next to the filter button.
2. **Given** the 'X' button is visible, **When** the user clicks the 'X' button, **Then** all active filter criteria are immediately reset to empty, the ideas table immediately displays all ideas, and no confirmation dialog is presented.
3. **Given** all filter criteria are empty, **When** the toolbar is viewed, **Then** the 'X' button is not visible.

---

### User Story 3 - Contextual Tooltips and Filter Active Indicators (Priority: P2)

To maintain clarity and accessibility, users need informative tooltips explaining the function of toolbar buttons, as well as visual cues indicating when the table is currently filtered.

In this story, hovering over the filter button displays a tooltip (e.g., "Filter ideas"). Hovering over the 'X' button displays a tooltip (e.g., "Clear all filters"). Additionally, when one or more filters are active, the filter button displays a distinct active indicator (such as an accent highlight or badge) so the user is continuously aware that the displayed list is filtered, even after closing the modal.

**Why this priority**: Enhances discoverability and visual ergonomics, preventing user confusion when browsing what might appear to be a depleted catalog.

**Independent Test**:
1. Hover over the filter button; verify a tooltip appears with the text "Filter ideas".
2. Apply a filter so the 'X' button appears; hover over the 'X' button and verify a tooltip appears with the text "Clear all filters".
3. Close the modal while filters are active; verify that the filter button displays an active visual indicator.
4. Clear filters; verify that the filter button returns to its default inactive appearance.

**Acceptance Scenarios**:

1. **Given** the user hovers over the filter button, **When** the pointer rests on the button, **Then** an accessible tooltip displays "Filter ideas".
2. **Given** active filters exist and the user hovers over the 'X' button, **When** the pointer rests on the button, **Then** an accessible tooltip displays "Clear all filters".
3. **Given** one or more filters are active, **When** the filter modal is closed, **Then** the filter button maintains an active visual style highlighting that a filter is currently applied.
4. **Given** all filters are cleared, **When** the filter button is rendered, **Then** it displays in its default neutral styling.

---

### User Story 4 - Seamless Modal Interaction & Dismissal Cancellation (Priority: P2)

Users need the filter modal to be unobtrusive, responsive, and safe from unintended modifications. If a user opens the modal, edits fields, but decides not to proceed, dismissing the modal must cancel unapplied draft edits.

In this story, the filter modal can be dismissed by clicking its Close icon button, clicking outside the modal dialog onto the backdrop, or pressing the `Escape` key. Dismissing the modal without clicking "Apply" discards any unapplied changes made in the inputs, leaving the table's existing filter state untouched. If active filters were already applied prior to opening the modal, those active filters remain in effect.

**Why this priority**: Adheres to standard desktop modal conventions where unconfirmed draft inputs are canceled unless explicitly confirmed via the primary action button.

**Independent Test**:
1. Apply an initial filter (e.g., Key: "Am").
2. Re-open the modal, change Key to "C", and press the `Escape` key (or click the backdrop) without clicking "Apply".
3. Verify the modal closes and the table remains filtered by "Am" (the unapplied edit "C" was canceled).
4. Re-open the modal; verify the form displays "Am".

**Acceptance Scenarios**:

1. **Given** the filter modal is open, **When** the user presses the `Escape` key, clicks the modal close button, or clicks the backdrop, **Then** the modal closes.
2. **Given** unapplied modifications were made in the modal, **When** the user dismisses the modal without clicking "Apply", **Then** the unapplied modifications are discarded and the table's active filter state remains unchanged.
3. **Given** active filter criteria were previously applied, **When** the user re-opens the filter modal, **Then** all currently applied filter values are restored in the form inputs.

---

### Edge Cases

- **All Filter Fields Empty on Apply**: If all fields are blank or contain only whitespace and the user clicks "Apply", any previously active filters are cleared, all ideas are shown, and the 'X' clear button is hidden.
- **Enter Key Pressed in Inputs**: Pressing `Enter` in any filter input field does nothing (form submission is suppressed) to prevent accidental submits while filling out multiple fields.
- **Trailing or Duplicate Commas**: Entering queries such as `John, , Paul,` correctly discards empty tokens and evaluates to `["john", "paul"]`.
- **Inverted BPM Range**: If the user inputs a minimum BPM that is greater than the maximum BPM (e.g., Min 140, Max 100) and clicks "Apply", the system evaluates the range strictly (requiring `bpm >= 140 AND bpm <= 100`), resulting in 0 matching ideas and showing the filter empty state rather than crashing.
- **Negative or Non-Numeric BPM Inputs**: BPM inputs only accept positive numeric values. Non-numeric or negative entries are prevented or ignored.
- **Special Characters and Punctuation**: Text filters containing punctuation or musical symbols (e.g., `#`, `b`, `/`, `-`) match literally and case-insensitively without triggering syntax errors.
- **Tab Switching While Filtered**: If the user switches between the "Available" and "Archived" tabs while filters are active, the applied filter criteria persist and filter the newly selected tab's ideas.
- **Row Modifications While Filtered**: If an idea is edited, archived, or deleted while filters are applied, the table updates and continues to show only items matching the active filter criteria.
- **Zero Matching Ideas**: When applied filters yield zero results, the table displays an empty state clearly communicating that no ideas match the active filter criteria, with a prompt or affordance to clear or adjust filters.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST render a dedicated filter button in the toolbar positioned adjacent to the trash (delete) button.
- **FR-002**: Clicking the filter button MUST open a modal dialog containing a filter form.
- **FR-003**: The filter modal form MUST contain exactly one row for each of the following five parameters:
  1. BPM (range with minimum and maximum inputs)
  2. Musical Key
  3. Authors
  4. Song Section
  5. Instruments
- **FR-004**: The system MUST provide a primary "Apply" button in the filter modal footer.
- **FR-005**: The system MUST commit configured filter criteria, apply them to the ideas table, and close the modal exclusively upon a user click on the "Apply" button.
- **FR-006**: The system MUST NOT submit the filter form or apply filters when the `Enter` key is pressed within any filter input field.
- **FR-007**: If a parameter row has no value (empty or whitespace-only) when "Apply" is clicked, that parameter MUST NOT be considered for filtering.
- **FR-008**: All text-based filtering (Key, Authors, Section, Instruments) MUST be case-insensitive.
- **FR-009**: All text-based filtering MUST perform substring/inclusion matching against the idea's corresponding field (e.g., matching any part of an author's name or any tagged instrument).
- **FR-010**: For the BPM parameter, the system MUST filter ideas whose BPM falls between the specified minimum and maximum inclusive, or satisfy the single bound if only one is specified.
- **FR-011**: The system MUST render an 'X' (Clear Filters) button in the toolbar adjacent to the filter button whenever at least one filter criterion is active.
- **FR-012**: Clicking the 'X' button MUST instantly clear all filter criteria, reset all form inputs, and restore the full list of ideas without displaying a confirmation prompt.
- **FR-013**: When no filter criteria are active, the 'X' button MUST NOT be visible.
- **FR-014**: The system MUST provide an accessible hover tooltip for the filter button displaying "Filter ideas".
- **FR-015**: The system MUST provide an accessible hover tooltip for the 'X' button displaying "Clear all filters".
- **FR-016**: The filter button MUST display an active visual indicator whenever one or more filter criteria are active.
- **FR-017**: The filter modal MUST close when the user presses the `Escape` key, clicks the modal's Close button, or clicks outside the modal dialog onto the backdrop.
- **FR-018**: Dismissing the filter modal without clicking the "Apply" button MUST discard unapplied draft changes and preserve the existing table filter state.
- **FR-019**: The system MUST parse comma-separated values in the Authors filter field and require all specified authors to be present on the idea (case-insensitive AND logic, order-independent).
- **FR-020**: The system MUST parse comma-separated values in the Instruments filter field and require all specified instruments to be present on the idea (case-insensitive AND logic, order-independent).
- **FR-021**: The system MUST provide descriptive hover tooltips for all parameter rows in the filter modal explaining how to enter and format search values (including comma separation for multiple authors and instruments).

### Key Entities

- **Filter Criteria**: Represents the active filter constraints configured by the user:
  - `bpmMin`: Optional numeric lower tempo bound.
  - `bpmMax`: Optional numeric upper tempo bound.
  - `key`: Optional text pattern for musical key.
  - `authors`: Optional text pattern for authors/collaborators (supports comma-separated multi-token AND matching).
  - `section`: Optional text pattern for song section.
  - `instruments`: Optional text pattern for tagged instruments (supports comma-separated multi-token AND matching).
- **Filter Modal State**: Manages dialog visibility (`isOpen`), draft form field values, active applied filter criteria, and submission status.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can open the filter modal, configure criteria, and apply a filter in under 5 seconds.
- **SC-002**: Ideas table updates within 200ms after the user explicitly clicks the "Apply" button.
- **SC-003**: 100% of `Enter` key presses within filter form inputs are prevented from submitting the form or applying filters prematurely.
- **SC-004**: Users can clear all active filters with a single click on the 'X' button, restoring the catalog with 0 confirmation dialogs.
- **SC-005**: 100% of text filters match correctly regardless of case variation between user input and stored metadata (e.g., "verse" matches "Verse", "acoustic" matches "Acoustic").
- **SC-006**: 100% of empty or whitespace-only parameter rows are ignored during filter evaluation.
- **SC-007**: 100% of multi-token comma-separated author and instrument queries correctly enforce order-independent AND matching.

## Assumptions

- **Click-Only Apply Button**: Filters are committed and the table updates exclusively upon an explicit click of the "Apply" button. `Enter` key submission is suppressed across all input fields to prevent accidental submits while filling in multi-row criteria.
- **Multi-Token Delimiter**: Commas are used to separate multiple authors or instruments, matching Vault's existing metadata conventions.
- **Draft Cancellation on Dismissal**: Dismissing the modal without clicking "Apply" (Escape, Close icon, backdrop click) discards any unconfirmed draft changes.
- **Toolbar Placement**: The filter button and the conditional 'X' clear button are placed directly next to the trash button in the top toolbar to form a cohesive management group with the tab bar and delete button.
- **BPM Range Inputs**: The BPM row contains two side-by-side inputs ("Min" and "Max") to represent a range intuitively.
- **Filter Persistence Across Tabs**: Applied filter criteria persist when switching between Available and Archived tabs, filtering the current tab's ideas until explicitly cleared by the user.
- **No Confirmation on Clear**: The 'X' button clears all active filters immediately without an alert or confirmation dialog.
