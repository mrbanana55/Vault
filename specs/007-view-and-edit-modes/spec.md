# Feature Specification: View and Edit Modes

**Feature Branch**: `007-view-and-edit-modes`

**Created**: 2026-09-08

**Status**: Draft

**Input**: User description: "I want to have two modes: view mode and edit mode. In view mode I only want to see, listen and move my ideas. Edit mode lets me modify the idea's parameters like Instruments, Authors, etc. The only unmodifiable thing is the audio duration. To edit something I want to click on the row and column and write in there. Once I press Esc key or click somewhere else the changes should be updated."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Toggle Between View and Edit Modes (Priority: P1)

A user opens the Ideas Table and sees it in its default **view mode**, where they can browse, listen to, and reorder their ideas without risk of accidentally modifying any metadata. When they want to make changes, they toggle into **edit mode**. The table visually reflects that editing is now possible. They can toggle back to view mode at any time.

**Why this priority**: This is the foundational interaction that gates all editing functionality. Without a clear mode toggle, inline editing cannot exist.

**Independent Test**: Can be fully tested by toggling the mode switch and verifying the table's visual state and interaction affordances change accordingly.

**Acceptance Scenarios**:

1. **Given** the Ideas Table is displayed, **When** the user opens the table, **Then** the table is in view mode by default.
2. **Given** the table is in view mode, **When** the user activates the edit mode toggle, **Then** the table transitions to edit mode with a visible indicator of the current mode.
3. **Given** the table is in edit mode, **When** the user activates the view mode toggle, **Then** the table returns to view mode and all cells become non-editable.

---

### User Story 2 - Inline Cell Editing (Priority: P1)

While in edit mode, a user clicks directly on a cell in an editable column (e.g., Title, Instruments, Key, BPM, Tags, Authors) and the cell becomes an active text input pre-filled with the current value. The user types their changes. The changes are committed (saved) when the user either presses the **Escape key** or **clicks anywhere outside** the active cell.

**Why this priority**: This is the core editing interaction — the primary reason the feature exists.

**Independent Test**: Can be tested by entering edit mode, clicking on a cell, modifying the value, pressing Escape or clicking elsewhere, and verifying the updated value persists.

**Acceptance Scenarios**:

1. **Given** the table is in edit mode, **When** the user clicks on an editable cell, **Then** the cell transforms into an active text input populated with the current cell value.
2. **Given** a cell is being edited, **When** the user presses the Escape key, **Then** the new value is saved and the cell returns to its display state showing the updated value.
3. **Given** a cell is being edited, **When** the user clicks anywhere outside the active cell, **Then** the new value is saved and the cell returns to its display state showing the updated value.
4. **Given** the table is in edit mode, **When** the user clicks on the Duration column, **Then** the cell does not become editable (duration is read-only).
5. **Given** a cell is being edited, **When** the user modifies the value and it is committed, **Then** the change is persisted so it survives application restarts.

---

### User Story 3 - View Mode Interactions Preserved (Priority: P2)

While in view mode, all existing interactions remain fully functional: the user can play/stop audio, see waveforms, delete ideas, and navigate the table. No editing affordances are visible or active.

**Why this priority**: Ensuring existing view-mode functionality is not broken is essential for usability but relies on the existing implementation working correctly.

**Independent Test**: Can be tested by staying in view mode and verifying playback, deletion, and navigation work exactly as they do today.

**Acceptance Scenarios**:

1. **Given** the table is in view mode, **When** the user clicks on a cell, **Then** no text input appears and no editing occurs.
2. **Given** the table is in view mode, **When** the user clicks a play button, **Then** audio playback starts normally.
3. **Given** the table is in view mode, **When** the user clicks a delete button, **Then** the idea is deleted normally.

---

### User Story 4 - Edit Mode Visual Feedback (Priority: P2)

When the user toggles into edit mode, the table provides clear visual cues that editing is active. Editable cells show hover affordances (e.g., subtle highlight or border on hover) indicating they can be clicked to edit. Non-editable cells (Duration, row number, Actions) do not show these affordances.

**Why this priority**: Good visual feedback prevents user confusion and accidental edits, but the feature is usable without polished affordances.

**Independent Test**: Can be tested by entering edit mode, hovering over editable vs. non-editable columns, and verifying only editable cells show interaction cues.

**Acceptance Scenarios**:

1. **Given** the table is in edit mode, **When** the user hovers over an editable cell, **Then** a visual cue indicates the cell is clickable/editable.
2. **Given** the table is in edit mode, **When** the user hovers over the Duration column, **Then** no editable cue is shown.
3. **Given** the table is in view mode, **When** the user hovers over any cell, **Then** no editable cues are displayed.

---

### Edge Cases

- What happens when the user edits a cell and the save operation fails (e.g., database error)? The cell should revert to its previous value and display a brief error notification.
- What happens when the user clears a required field (e.g., Title)? The system should preserve the previous value and not allow saving an empty title.
- What happens when the user toggles from edit mode to view mode while a cell is being actively edited? The pending edit should be committed (saved) before transitioning to view mode.
- What happens when audio is playing and the user enters edit mode? Playback should continue uninterrupted; editing and playback are independent.
- What happens if the user clicks on a different editable cell while one is already being edited? The first cell's edit should be committed, and the newly clicked cell should become the active editor.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a mode toggle that switches the Ideas Table between view mode and edit mode.
- **FR-002**: System MUST default to view mode when the Ideas Table is first displayed.
- **FR-003**: In view mode, the system MUST NOT allow any cell to be edited inline.
- **FR-004**: In edit mode, system MUST allow the user to click on any editable cell (Title, Instruments, Key, BPM, Authors, Section, Notes) to activate inline editing for that cell.
- **FR-005**: In edit mode, the Duration column, Created column, and Actions column MUST remain non-editable at all times.
- **FR-006**: When a cell is activated for editing, the system MUST display a text input pre-populated with the cell's current value.
- **FR-007**: System MUST commit (save) the edited value when the user presses the Escape key.
- **FR-008**: System MUST commit (save) the edited value when the user clicks outside the active cell (blur event).
- **FR-009**: System MUST persist the committed changes to the database so they survive application restarts.
- **FR-010**: Only one cell may be in an active editing state at any given time. Activating a new cell MUST first commit the previously active cell.
- **FR-011**: In edit mode, editable cells MUST display a visual hover affordance to indicate editability.
- **FR-012**: If a save operation fails, the cell MUST revert to its previous value and the user MUST be notified of the failure.
- **FR-013**: Switching from edit mode to view mode while a cell is actively being edited MUST commit the pending edit before completing the mode transition.
- **FR-014**: Audio playback MUST remain fully functional in both view mode and edit mode.

### Key Entities

- **AudioNote**: The primary entity. Editable fields: `title`, `bpm`, `musical_key`, `authors`, `song_section`, `notes`, `instruments` (via junction table). Non-editable fields: `id`, `file_path`, `duration_seconds`, `is_used`, `created_at`, `updated_at`.
- **Table Mode**: A UI state (`view` or `edit`) that controls whether inline editing affordances are active.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can toggle between view and edit modes in under 1 second with no perceived delay.
- **SC-002**: Users can click an editable cell, modify its value, and have it saved in 3 actions or fewer (click → type → press Escape or click away).
- **SC-003**: 100% of edits committed via Escape key or blur are persisted and visible after restarting the application.
- **SC-004**: Existing view-mode interactions (playback, deletion, navigation) remain fully functional with zero regressions.
- **SC-005**: Users can distinguish editable from non-editable cells within 2 seconds of entering edit mode through visual cues.

## Assumptions

- The existing backend update pipeline (IPC handler, database query, preload bridge, context method) is fully operational and does not require modification.
- The `UpdateAudioNoteInput` type already correctly excludes `duration_seconds`, `id`, `file_path`, and `created_at` from updatable fields.
- The mode toggle is a UI-only concept — it does not need to be persisted across sessions (the table always opens in view mode).
- "Move my ideas" in the user's description refers to reordering ideas within the table, which is existing or future functionality outside the scope of this feature.
- The Escape key behavior for committing edits is intentional per the user's request, even though Escape typically cancels edits in other applications.
