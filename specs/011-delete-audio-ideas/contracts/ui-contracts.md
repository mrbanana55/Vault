# Phase 1: UI & Component Contracts

**Feature**: Delete Selected Audio Ideas (Spec 011)  
**Date**: 2026-09-11

## Overview

Specifies props and interfaces for the delete button and confirmation modal components.

---

## 1. Component: `<DeleteButton />`

Location: `src/renderer/components/DeleteButton.tsx`

```typescript
export interface DeleteButtonProps {
  /** Total number of currently selected items */
  selectedCount: number;
  /** Callback fired when the button is clicked */
  onClick: () => void;
  /** Explicit disabled override or derived from selectedCount === 0 */
  disabled?: boolean;
}
```

### Markup & Accessibility:
- Element: `<button type="button">`
- `aria-label={selectedCount > 0 ? `Delete ${selectedCount} selected ${selectedCount === 1 ? 'idea' : 'ideas'}` : 'Delete selected ideas'}`
- `title={selectedCount > 0 ? `Delete (${selectedCount})` : 'Select ideas to delete'}`
- `disabled={disabled || selectedCount === 0}`
- Visual layout: Trash SVG icon + optional count badge pill (`<span className="text-[10px] font-bold">`).
- Disabled styling: `opacity-40 cursor-not-allowed text-content-secondary`.
- Active styling: `text-content-secondary hover:text-red-500 hover:bg-red-500/10 cursor-pointer`.

---

## 2. Component: `<DeleteConfirmationModal />`

Location: `src/renderer/components/DeleteConfirmationModal.tsx`

```typescript
export interface DeleteConfirmationModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Number of items to delete */
  count: number;
  /** Whether the delete operation is actively in flight */
  isDeleting: boolean;
  /** Callback to confirm deletion */
  onConfirm: () => void;
  /** Callback to cancel/dismiss modal */
  onCancel: () => void;
}
```

### Markup & Accessibility:
- Modal Dialog: `role="dialog"` `aria-modal="true"` `aria-labelledby="delete-dialog-title"`.
- Warning text: *"Are you sure you want to delete {count === 1 ? 'this audio idea' : `these ${count} audio ideas`}? Once deleted, the audio cannot be recovered."*
- Action buttons:
  - Cancel: `data-testid="delete-cancel-button"`
  - Accept: `data-testid="delete-accept-button"` (shows "Deleting..." when `isDeleting` is true).
- Global keydown: `Escape` calls `onCancel()`.
