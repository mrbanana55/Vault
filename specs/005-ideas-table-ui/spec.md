# Feature Specification: Ideas Table UI

**Feature Branch**: `005-ideas-table-ui`

**Created**: 2026-09-04

**Status**: Draft

**Input**: User description: "Basic app interface with a table showing music ideas. Two tabs: Active (unused) and Archive (used). All stored labels visible per idea. Light/dark mode toggle. Simple Apple-like design. Reserved bottom area for future recording panel."

## Clarifications

### Session 2026-09-04

- Q: Can the user mark an idea as "used" or "unused" directly from the table, or is the table strictly read-only? → A: Include a simple used/unused toggle per row that moves the idea between tabs. Future specs will add additional row-level actions (inline name editing, edit/view mode toggle).
- Q: Should the `notes` field be displayed as a table column or excluded from the table? → A: Show `notes` as the last table column, truncated with ellipsis if too long. A future spec will allow clicking the notes cell to open the full text in a modal dialog.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Browse Active Ideas (Priority: P1)

A musician opens Vault and immediately sees their active (unused) music ideas displayed in a table. Each row shows the idea's title and all associated metadata labels — duration, BPM, musical key, authors, song section, instruments, and user notes — so the musician can quickly scan, locate, and assess their ideas at a glance.

**Why this priority**: This is the core value proposition of the application. Without the ability to browse and see ideas, no other feature is meaningful. It is the first screen the user encounters and the primary interaction surface.

**Independent Test**: Can be fully tested by loading the application with pre-existing ideas in the database and verifying that all ideas with `is_used = 0` appear in the table with all metadata columns populated correctly. Delivers immediate value as a browsable catalog.

**Acceptance Scenarios**:

1. **Given** the database contains 5 audio notes with `is_used = 0`, **When** the user opens the application, **Then** the "Ideas" tab is active by default and all 5 ideas are displayed in the table.
2. **Given** the database contains audio notes with varying metadata (some with BPM, some without), **When** the table renders, **Then** each row shows all metadata fields with empty cells for null values (no "null" or "undefined" text).
3. **Given** a note has 3 associated instruments, **When** that row is displayed, **Then** all 3 instruments are shown within that row's instruments cell.
4. **Given** the database contains no audio notes with `is_used = 0`, **When** the user views the Ideas tab, **Then** the table displays an empty state message indicating no active ideas exist.
5. **Given** the database contains ideas, **When** the table loads, **Then** ideas are sorted by creation date in descending order (newest first).
6. **Given** an idea is displayed in the Ideas tab, **When** the user toggles its status to "used", **Then** the idea is moved to the Archive tab and removed from the current view.

---

### User Story 2 - Browse Archived Ideas (Priority: P2)

A musician switches to the "Archive" tab to browse ideas that have already been used in a project or composition. The archive displays the same table structure and metadata columns as the active ideas tab, filtered to ideas marked as used.

**Why this priority**: Archiving is the natural complement to active browsing. Musicians need to see what they've already used to avoid duplicating ideas or to revisit previously used material. It completes the lifecycle view of ideas.

**Independent Test**: Can be fully tested by populating the database with ideas where `is_used = 1`, switching to the Archive tab, and verifying only used ideas appear with the correct metadata.

**Acceptance Scenarios**:

1. **Given** the database contains 3 notes with `is_used = 1` and 5 notes with `is_used = 0`, **When** the user clicks the "Archive" tab, **Then** only the 3 archived ideas are displayed.
2. **Given** the user is on the Archive tab, **When** they click the "Ideas" tab, **Then** the view switches back to showing only active (unused) ideas.
3. **Given** no ideas have `is_used = 1`, **When** the user views the Archive tab, **Then** the table displays an empty state message indicating no archived ideas exist.
4. **Given** the user is on the Archive tab, **When** new ideas are present in the database, **Then** the Archive tab continues to show only ideas with `is_used = 1`.
5. **Given** an idea is displayed in the Archive tab, **When** the user toggles its status to "unused", **Then** the idea is moved back to the Ideas tab and removed from the Archive view.

---

### User Story 3 - Toggle Light and Dark Theme (Priority: P3)

A musician toggles between a light and dark visual theme using a button or icon in the top-right corner of the application window. The chosen theme persists across application sessions so the user does not need to re-select it each time they open Vault.

**Why this priority**: Theme toggling is a quality-of-life feature. While not essential for core functionality, it significantly impacts comfort during extended use — especially for musicians working in dimly lit studios at night. It also aligns with the Apple design system expectation of supporting both appearances.

**Independent Test**: Can be fully tested by clicking the theme toggle, verifying all UI elements switch appearance, closing and reopening the application, and verifying the previously chosen theme is restored.

**Acceptance Scenarios**:

1. **Given** the application is in light mode, **When** the user clicks the theme toggle, **Then** all UI elements transition to dark mode styling.
2. **Given** the application is in dark mode, **When** the user clicks the theme toggle, **Then** all UI elements transition to light mode styling.
3. **Given** the user selected dark mode, **When** the user closes and reopens the application, **Then** the application starts in dark mode.
4. **Given** it is the user's first time opening the application (no stored preference), **Then** the application defaults to light mode.

---

### Edge Cases

- What happens when a metadata field (BPM, key, authors, song section, notes) is null? The cell should render as visually empty — no placeholder text like "N/A" or "null".
- What happens when the instruments list for a note is very long (e.g., 10+ instruments)? The cell should truncate gracefully or wrap without breaking the table layout.
- What happens when the title or notes text is very long? Text should be truncated with an ellipsis to maintain consistent row height.
- How does the table behave with hundreds of ideas? The table should remain scrollable and performant without visible lag.
- What happens when the user has no ideas at all (fresh install)? Both tabs should display a friendly empty state.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The application MUST display a tabbed interface with two tabs: "Ideas" (active, unused ideas) and "Archive" (used ideas).
- **FR-002**: The "Ideas" tab MUST be selected by default when the application opens.
- **FR-003**: The "Ideas" tab MUST fetch and display all audio notes where `is_used = 0` using the existing `window.vaultAPI.notes.getAll` interface with the appropriate filter.
- **FR-004**: The "Archive" tab MUST fetch and display all audio notes where `is_used = 1` using the same interface with the appropriate filter.
- **FR-005**: The table MUST display the following columns for each idea, in order: Title, Duration, BPM, Key, Authors, Section, Instruments, Date Created, and Notes (last column).
- **FR-006**: Duration MUST be displayed in a human-readable format (e.g., `1:23` for 83 seconds, `0:05` for 5 seconds).
- **FR-007**: Date Created MUST be displayed in a localized, human-readable format (e.g., `Sep 3, 2026`).
- **FR-008**: Null or missing metadata values MUST render as visually empty cells — no literal "null", "undefined", "N/A", or placeholder text.
- **FR-009**: Instruments associated with a note MUST be fetched and displayed within the idea's row (via `window.vaultAPI.notes.getById` or batch resolution).
- **FR-010**: Table rows MUST be sorted by creation date in descending order (newest first), matching the database default `ORDER BY created_at DESC`.
- **FR-011**: The application MUST provide a theme toggle control in the top-right corner of the window.
- **FR-012**: The theme toggle MUST switch the entire application UI between light and dark visual themes.
- **FR-013**: The selected theme MUST persist across application sessions using local storage.
- **FR-014**: On first launch (no stored preference), the application MUST default to light mode.
- **FR-015**: The application layout MUST reserve a fixed-height area at the bottom of the window for a future recording panel. This area should be visually present as an empty container but should not contain interactive controls.
- **FR-016**: Both tabs MUST display a friendly empty state message when no ideas match the active filter.
- **FR-017**: The visual design MUST follow a clean, minimal aesthetic inspired by Apple's design system — using generous whitespace, subtle borders, rounded corners, and a restrained color palette.
- **FR-018**: Each table row MUST include a toggle control that allows the user to change an idea's used/unused status. Toggling MUST update the database via the existing update interface and immediately remove the row from the current tab view.

### Key Entities

- **AudioNote**: A single music idea with metadata (title, duration, BPM, key, authors, section, notes, used status, timestamps). The primary entity displayed in table rows.
- **Instrument**: A named musical instrument associated with one or more audio notes via a many-to-many relationship. Displayed as a list within each idea's table row.
- **Theme Preference**: A user-level setting (light or dark) stored locally and restored on application launch.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can see all their active ideas immediately upon opening the application, with no additional navigation required.
- **SC-002**: Users can switch between active and archived ideas in a single click, with the table updating within 1 second.
- **SC-003**: All metadata labels stored with each idea (title, duration, BPM, key, authors, section, instruments, date) are visible without requiring additional clicks or expanding rows.
- **SC-004**: Users can switch between light and dark themes with a single click, and the chosen theme is preserved across sessions.
- **SC-005**: The application presents a clean, minimal interface that feels consistent with modern desktop design conventions (Apple-like aesthetics).
- **SC-006**: The table handles 100+ ideas without visible lag during rendering or scrolling.

## Assumptions

- The existing `window.vaultAPI` bridge and IPC handlers for notes and instruments are fully functional and return correct data (established in Specs 001–004).
- No search, filtering, or sorting controls are required in this spec — only the tab-based partition by `is_used` status. Future specs may add these capabilities.
- No inline editing, row selection, or context menus are needed for this spec. The only row-level action is the used/unused toggle. Future specs will add additional row actions such as inline name editing and an edit/view mode toggle.
- The bottom recording panel area is a visual placeholder only. No recording functionality, buttons, or interactive elements are included in this spec.
- The build tooling (bundler, React, Tailwind CSS) required to render the UI will be set up as part of this spec's implementation since no renderer infrastructure currently exists. This is an implementation concern, not a feature requirement, and is not specified here.
- The table does not need pagination or virtualized scrolling for this version. Standard DOM scrolling is acceptable.
- Instrument data for each note may require individual `getById` calls or a batch resolution strategy. The specific data fetching approach is an implementation detail.
