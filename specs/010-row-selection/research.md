# Phase 0: Research & Technical Decisions

**Feature**: Row Selection via Checkboxes (Spec 010)  
**Date**: 2026-09-11

## Overview

The objective is to implement a robust, accessible, and high-performance row selection system for the Vault audio ideas table. This includes individual checkbox toggling and Gmail-style range selection via `Shift + Click`, while maintaining strict separation of concerns, zero new third-party dependencies, and seamless integration with existing playback and inline editing features.

---

## 1. Selection State Model

### Decision
Represent the selected rows using a `Set<number>` containing the active note IDs, alongside a `lastClickedIndex: number | null` anchor stored in React component state.

### Rationale
- `Set<number>` provides $O(1)$ lookups when rendering rows to determine `isSelected = selectedIds.has(note.id)`.
- Set immutability is straightforward in React via `new Set(...)`.
- Tracking `lastClickedIndex` (the 0-based visual row index in `notes`) allows instant range calculation during `Shift + Click` without needing array searches or DOM queries.

### Alternatives Considered
- **Array of IDs (`number[]`)**: Requires $O(N)$ lookups (`includes()`) on every row render, which adds overhead during scrolling or fast state changes.
- **Boolean property on Note objects**: Mutates note models or requires cloning the entire array of notes on every toggle, violating immutability and coupling data fetching to transient UI selection.

---

## 2. Shift + Click Range Selection Algorithm (Gmail Behavior)

### Decision
Implement the standard 2-point index range algorithm with anchor tracking:
1. When a checkbox is clicked **without Shift**:
   - Toggle the item's presence in `selectedIds`.
   - Update `lastClickedIndex` to the clicked row's visual index.
2. When a checkbox is clicked **with Shift**:
   - If `lastClickedIndex === null`: treat as normal click, select the row, and set `lastClickedIndex`.
   - If `lastClickedIndex !== null`: determine `startIndex = Math.min(lastClickedIndex, currentIndex)` and `endIndex = Math.max(lastClickedIndex, currentIndex)`.
   - Take all notes in `notes.slice(startIndex, endIndex + 1)` and add their IDs to `selectedIds` (union operation).
   - In standard Gmail / OS convention, range selection expands the selection to include all items in the range.
   - Do NOT change `lastClickedIndex` during shift-click (or update to target depending on preference; keeping anchor or moving anchor: Gmail updates the selection range while retaining the original anchor until a non-shift click).

### Rationale
- Matches standard desktop and Gmail behavior intuitively.
- Handles bidirectional selection naturally (downward or upward ranges).
- Immune to ID ordering differences because it operates on the ordered `notes: NoteWithInstruments[]` array currently displayed.

---

## 3. Suppression of Unintended Text Selection

### Decision
Call `window.getSelection()?.removeAllRanges()` or invoke `e.preventDefault()` on the mousedown/click event when `e.shiftKey` is true on the checkbox input/wrapper.

### Rationale
In Chromium/Electron, Shift-clicking native DOM elements can inadvertently trigger OS native text range selection across table cells. Preventing default or clearing selection ranges on Shift-clicks guarantees clean checkbox toggling without blue text highlight artifacts.

---

## 4. Interaction Isolation & Event Bubbling

### Decision
Position the checkbox column at table index 0 (`TABLE_COLUMNS[0] = ''` or a header checkbox / label placeholder). Use a dedicated `<td>` cell containing `<input type="checkbox" />` with an explicit `onClick` / `onChange` handler that stops propagation (`e.stopPropagation()`).

### Rationale
- The existing `TableRow` has hover states, play/pause controls, inline editable cells, and archive buttons.
- Stopping propagation ensures clicking the checkbox never triggers table row selection handlers, cell editing activation (`onCellClick`), or audio playback.

---

## 5. Visual Hierarchy & Theme Styling

### Decision
- **Checkbox styling**: Accessible native checkbox `<input type="checkbox" />` styled with Tailwind accent utilities (`accent-accent-blue` or custom styled SVG checkbox, matching Apple HIG minimal aesthetics, with `rounded`, `cursor-pointer`).
- **Row highlight**: When selected, apply a background tint:
  - If selected AND currently playing: blend or prioritize playing highlight with a distinct indicator (e.g. `bg-surface-secondary/90 ring-1 ring-accent-blue/50`).
  - If selected (not playing): `bg-surface-secondary/70 dark:bg-surface-secondary/50`.
  - Normal row: `hover:bg-surface-hover`.

### Rationale
Maintains Apple design system simplicity, ensures high contrast in both light and dark modes, and avoids clashing with the active audio playback styling.

---

## 6. Tab Switching & Pruning

### Decision
Clear `selectedIds` and `lastClickedIndex` whenever `activeTab` changes in `AppLayout` (or in `useRowSelection`). Additionally, filter out any `selectedIds` that no longer exist in `notes` after deletion or status archiving.

### Rationale
Prevents phantom selections where an ID selected in "Ideas" is accidentally acted upon while looking at the "Archive" tab.
