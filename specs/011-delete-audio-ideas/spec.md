# Feature Specification: Delete Selected Audio Ideas

**Feature Branch**: `011-delete-audio-ideas`

**Created**: 2026-09-11

**Status**: Ready for Planning

**Input**: User description: "I want to have a delete button next to the tabs section. This button should be a trash icon. When I select one or more ideas i should be able to delete them, if no idea is selected then the delete button should be unusable. Before deleting any idea I want to see a confirmation message saying that once the audio is deleted i won’t be able to recover it. In that message i should click either accept or cancel."

## Clarifications

### Session 2026-09-11

- Q: Where exactly should the trash delete button be placed relative to the tabs, and how should it display the count of selected ideas? → A: Option A — Positioned immediately to the right of the `TabBar` segmented control as an icon button with a trash icon, displaying a subtle badge and tooltip with the number of selected ideas when active.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Delete Button Availability & Visual State (Priority: P1)

A musician viewing their ideas catalog wants a quick, clear way to initiate deletion directly from the navigation/toolbar next to the tabs. A dedicated delete button featuring a trash icon sits immediately to the right of the `TabBar`. When zero ideas are currently selected, the button is visually disabled and unusable. As soon as one or more ideas are selected via the row checkboxes, the button becomes active, displays a subtle count badge, and becomes visually responsive to clicks.

**Why this priority**: Clear action affordances prevent user confusion. Disabling the delete button when nothing is selected prevents empty action dispatches and signals that deletion operates on the active selection.

**Independent Test**: Can be tested by rendering the toolbar with 0 selected ideas (verifying the trash button is disabled and unclickable), selecting 1 idea (verifying the trash button activates and shows count badge), and deselecting (verifying it returns to disabled).

**Acceptance Scenarios**:

1. **Given** no audio ideas are selected in the table, **When** the toolbar renders next to the tabs, **Then** the delete button with a trash icon is displayed in a disabled, unusable state immediately to the right of `TabBar`.
2. **Given** no audio ideas are selected, **When** the user clicks the disabled delete button, **Then** nothing happens and no dialog or deletion is triggered.
3. **Given** one or more audio ideas are selected, **When** the user inspects the delete button, **Then** the button is enabled with an active interactive hover state and displays the selected item count.

---

### User Story 2 - Irreversible Deletion Confirmation Modal (Priority: P1)

Because audio deletions are permanent and cannot be undone, a musician who clicks the active delete button must see an explicit confirmation dialog before any data or physical files are destroyed. The dialog warns the user that "once the audio is deleted you won’t be able to recover it", presenting explicit "Accept" and "Cancel" actions.

**Why this priority**: Permanent data destruction without confirmation is high-risk. A confirmation dialog prevents catastrophic accidental loss of recordings and ideas.

**Independent Test**: Can be tested by selecting 1 or more ideas, clicking the trash button, verifying the confirmation dialog opens with the exact warning message and Accept/Cancel buttons, clicking Cancel (verifying the dialog closes and ideas remain untouched), and testing Escape key dismiss.

**Acceptance Scenarios**:

1. **Given** one or more ideas are selected, **When** the user clicks the delete button, **Then** a confirmation modal opens displaying a warning stating that once deleted, the audio cannot be recovered.
2. **Given** the confirmation modal is open, **When** the user clicks the "Cancel" button or presses Escape, **Then** the modal closes without deleting any ideas, and the selected ideas remain in the table.
3. **Given** the confirmation modal is open, **When** the user clicks the "Accept" button, **Then** the deletion execution is initiated.

---

### User Story 3 - Batch Deletion Execution and Table Refresh (Priority: P1)

When the musician confirms deletion by clicking "Accept", the application deletes all selected audio ideas from both the database and physical local storage, closes the confirmation dialog, clears the selection set, and immediately refreshes the ideas table.

**Why this priority**: Completes the core user journey of removing unwanted ideas from the collection and freeing storage.

**Independent Test**: Can be tested by selecting 2 ideas, confirming deletion, and verifying that both ideas disappear from the table, are removed from the database, have their files unlinked on disk, and selection state returns to empty.

**Acceptance Scenarios**:

1. **Given** 1 idea is selected and the confirmation dialog is accepted, **When** deletion completes, **Then** that idea is permanently removed from the view and storage, and the selection is cleared.
2. **Given** 3 ideas are selected and the confirmation dialog is accepted, **When** deletion completes, **Then** all 3 ideas are permanently removed from the view and storage, and the selection is cleared.
3. **Given** an idea currently being played is among the selected ideas, **When** deletion occurs, **Then** audio playback stops immediately to prevent errors or orphan stream requests.
4. **Given** deletion completes, **When** the table refreshes, **Then** the delete button returns to its disabled state since 0 ideas are selected.

---

### Edge Cases

- **Deleting an idea that is currently playing**: If a user deletes an idea that is actively playing or paused in the audio player, the player must stop playback and clear the active track.
- **Partial deletion failure**: If one item fails to delete during a multi-item batch (e.g. disk write lock), the user is notified of any errors, and successfully deleted items are still removed from the view.
- **Switching tabs while confirmation is open**: The confirmation dialog is a modal overlay blocking background interaction, preventing tab changes while confirmation is pending.
- **Empty table or all items deleted**: If all items in a tab are deleted, the table immediately transitions to its friendly EmptyState view.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A delete button displaying a trash icon MUST be positioned in the toolbar immediately to the right of the tab bar (`TabBar`).
- **FR-002**: When `selectedCount === 0`, the delete button MUST be disabled (unclickable, visually dimmed with `cursor-not-allowed`, and `aria-disabled="true"`).
- **FR-003**: When `selectedCount >= 1`, the delete button MUST be enabled with active click and danger hover styling (e.g., subtle red/danger background or text tint) and display a count badge indicating the number of selected items.
- **FR-004**: Clicking the enabled delete button MUST display a confirmation dialog modal before any delete operation is executed.
- **FR-005**: The confirmation dialog MUST explicitly communicate that once the audio is deleted, the user will not be able to recover it.
- **FR-006**: The confirmation dialog MUST include two action buttons: an "Accept" (destructive/confirm) button and a "Cancel" button.
- **FR-007**: Clicking "Cancel" or pressing the Escape key MUST dismiss the modal without performing any deletion.
- **FR-008**: Clicking "Accept" MUST trigger deletion of all selected ideas from SQLite and physical storage via the existing `window.vaultAPI.notes.delete` interface.
- **FR-009**: If the currently playing note is deleted, audio playback MUST immediately stop.
- **FR-010**: Upon completion of deletion, the confirmation dialog MUST close, the table MUST refresh to reflect the remaining notes, and the selection set MUST be cleared (disabling the delete button).
- **FR-011**: The delete button and confirmation modal MUST follow Apple design system conventions (subtle borders, clean typography, backdrop blur overlay, smooth transitions, high contrast in both light and dark modes).

### Key Entities

- **SelectedItems**: Collection of note IDs queued for deletion based on active row checkboxes.
- **DeleteConfirmationState**: Modal state controlling visibility (`isOpen: boolean`), pending note count, and execution status (`isDeleting: boolean`).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can trigger the delete workflow in a single click from the main toolbar next to the tabs whenever 1 or more ideas are selected.
- **SC-002**: 100% of delete attempts require explicit user confirmation before any records or audio files are removed.
- **SC-003**: 0% accidental deletes: clicking "Cancel" leaves 100% of data and physical files intact.
- **SC-004**: Deletion of 1 to 10 selected ideas completes and refreshes the table in under 1 second.
- **SC-005**: The delete button cannot be triggered when zero items are selected.

## Assumptions

- Deletions utilize the existing `window.vaultAPI.notes.delete` IPC channel which handles SQLite row removal and unlinks physical audio files from `userData/audio_vault/recordings/`.
- Deletion applies to ideas currently selected on the active tab ("Ideas" or "Archive").
