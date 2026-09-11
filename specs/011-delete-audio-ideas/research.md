# Phase 0: Research & Technical Decisions

**Feature**: Delete Selected Audio Ideas (Spec 011)  
**Date**: 2026-09-11

## Overview

The objective is to implement batch deletion of selected audio ideas triggered by a trash icon button next to the tab bar (`TabBar`), protected by an irreversible deletion confirmation modal dialog.

---

## 1. Delete Trigger Placement & Button Architecture

### Decision
Place a dedicated `<DeleteButton />` component immediately to the right of `<TabBar />` in `<AppLayout />`'s top-left toolbar container:
```tsx
<div className="flex items-center gap-2">
  <TabBar activeTab={activeTab} onTabChange={handleTabChange} />
  <DeleteButton
    selectedCount={selectedCount}
    onClick={() => setIsConfirmOpen(true)}
    disabled={selectedCount === 0}
  />
</div>
```

### Rationale
- User explicitly selected Option A: placed next to the tab section as an icon button with a trash icon.
- Disables natively (`disabled={selectedCount === 0}`) with `opacity-40 cursor-not-allowed` when no rows are selected.
- Displays a small numeric badge when `selectedCount > 0` (e.g., `3`) indicating how many items will be deleted, adhering to Apple HIG toolbar patterns.

---

## 2. Confirmation Modal Design & Safety

### Decision
Create a dedicated `<DeleteConfirmationModal />` using Apple design system conventions:
- Backdrop: `fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in`.
- Card: `bg-surface-primary border border-border rounded-2xl p-6 shadow-2xl w-full max-w-sm flex flex-col space-y-4`.
- Explicit warning text:
  - Title: "Delete Idea" (or "Delete N Ideas")
  - Body: "Are you sure you want to delete {count === 1 ? 'this audio idea' : 'these audio ideas'}? Once deleted, the audio cannot be recovered."
- Action Buttons:
  - "Cancel": Secondary button (`bg-surface-secondary text-content-primary hover:bg-surface-hover border border-border`).
  - "Accept": Destructive primary button (`bg-red-600 hover:bg-red-700 text-white font-semibold shadow-xs`).
- Keyboard handling:
  - `Escape` cancels and dismisses.
  - Clicking outside (backdrop) dismisses.
  - Focus trapped within modal while open.

---

## 3. Batch Deletion Execution & IPC Safety

### Decision
Execute deletions by mapping over selected note IDs and calling `window.vaultAPI.notes.delete(id)` for each:
```typescript
const ids = Array.from(selectedIds);
for (const id of ids) {
  await window.vaultAPI.notes.delete(id);
}
```
If the currently playing note's ID is in the deletion set, call `pause()` from `useAudioPlayer()` prior to or during deletion to eliminate orphan audio stream requests or playback errors.

### Rationale
- `window.vaultAPI.notes.delete` is already fully tested, transactional in SQLite, and safely unlinks physical files from `userData/audio_vault/recordings/`.
- Zero new backend or IPC modifications needed, adhering strictly to **Stack Simplicity** and **Process Separation**.

---

## 4. State Synchronization Flow

1. User checks 1+ checkboxes $\rightarrow$ `selectedCount > 0`, trash button activates.
2. User clicks trash button $\rightarrow$ `setIsConfirmOpen(true)`.
3. User clicks "Cancel" (or presses Escape) $\rightarrow$ `setIsConfirmOpen(false)`, selection preserved, zero disk/DB changes.
4. User clicks "Accept":
   - Set `isDeleting(true)` on modal (disabling buttons, showing "Deleting...").
   - If `currentNote?.id` is in `selectedIds`, pause/stop playback.
   - Await deletion of all selected notes via `window.vaultAPI.notes.delete`.
   - Call `refetch()` to refresh table.
   - Call `clearSelection()` to reset selection.
   - Close confirmation modal (`setIsConfirmOpen(false)`).
