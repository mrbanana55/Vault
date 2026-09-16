# UI Component Contracts: Filter Ideas Table

**Feature**: `013-filter-ideas-table` | **Date**: 2026-09-15

This document defines the component prop interfaces, event contracts, accessibility attributes, and test IDs for the Filter Ideas UI.

---

## 1. `FilterButton`

Toolbar button located directly next to `DeleteButton`.

### Props Interface

```typescript
export interface FilterButtonProps {
  /** Indicates whether one or more filter parameters are currently applied */
  isFiltered: boolean;
  /** Callback fired when the user clicks the filter button */
  onClick: () => void;
  /** Optional disabled state */
  disabled?: boolean;
}
```

### DOM and Accessibility Contract

- **Tag**: `<button type="button">`
- **`data-testid`**: `"filter-button"`
- **`aria-label`**: `"Filter ideas"`
- **`title`**: `"Filter ideas"`
- **Visual styling**:
  - Inactive: `border border-border bg-surface-primary text-content-secondary hover:text-content-primary hover:bg-surface-hover shadow-xs`
  - Active (`isFiltered === true`): `border border-accent/40 bg-accent/10 text-accent font-semibold shadow-xs`
  - Disabled: `opacity-40 cursor-not-allowed`

---

## 2. `ClearFiltersButton`

Toolbar button positioned adjacent to `FilterButton`, displayed only when `isFiltered === true`.

### Props Interface

```typescript
export interface ClearFiltersButtonProps {
  /** Callback fired when the user clicks the clear button */
  onClick: () => void;
}
```

### DOM and Accessibility Contract

- **Tag**: `<button type="button">`
- **`data-testid`**: `"clear-filters-button"`
- **`aria-label`**: `"Clear all filters"`
- **`title`**: `"Clear all filters"`
- **Visual styling**:
  - `border border-border bg-surface-primary text-content-secondary hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/30 cursor-pointer shadow-xs active:scale-95`
- **Icon**: Small close / `×` SVG icon.

---

## 3. `FilterModal`

Modal dialog presenting the 5 parameter filter rows, dismissal controls, primary Apply button, and contextual input tooltips.

### Props Interface

```typescript
import type { IdeaFilterCriteria } from '../types/filters';

export interface FilterModalProps {
  /** Whether the modal is currently visible */
  isOpen: boolean;
  /** The currently applied filter criteria */
  initialCriteria: IdeaFilterCriteria;
  /** Callback invoked when the user explicitly clicks the "Apply" button */
  onApply: (criteria: IdeaFilterCriteria) => void;
  /** Callback invoked when dismissing the modal without applying */
  onClose: () => void;
}
```

### DOM and Accessibility Contract

- **Outer container**:
  - `role="dialog"`
  - `aria-modal="true"`
  - `aria-labelledby="filter-modal-title"`
  - `data-testid="filter-modal"`
- **Card**:
  - `data-testid="filter-modal-card"`
  - Header with `id="filter-modal-title"`, Close button with `data-testid="filter-modal-close-button"`
- **Form**:
  - `<form onSubmit={(e) => e.preventDefault()}>`
  - `onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}` to suppress submission on Enter.
- **Input Fields & Tooltips**:
  - **BPM Row**:
    - Label `title`: `"Tempo in beats per minute. Specify a minimum, maximum, or both to filter by range."`
    - `data-testid="filter-bpm-min"`: `<input type="number" min="1" placeholder="Min" title="..." />`
    - `data-testid="filter-bpm-max"`: `<input type="number" min="1" placeholder="Max" title="..." />`
  - **Key Row**:
    - Label & Input `title`: `"Musical key signature (e.g., C maj, A min, F#). Matches partial text."`
    - `data-testid="filter-key"`: `<input type="text" placeholder="e.g. C maj, Am" title="..." />`
  - **Authors Row**:
    - Label & Input `title`: `"Songwriters and performers. Separate multiple authors with commas to require all of them (e.g., John, Paul)."`
    - `data-testid="filter-authors"`: `<input type="text" placeholder="e.g. John, Paul" title="..." />`
  - **Section Row**:
    - Label & Input `title`: `"Song section (e.g., Chorus, Verse, Bridge, Intro). Matches partial text."`
    - `data-testid="filter-section"`: `<input type="text" placeholder="e.g. Chorus, Verse" title="..." />`
  - **Instruments Row**:
    - Label & Input `title`: `"Musical instruments tagged on the idea. Separate multiple instruments with commas to require all of them (e.g., Guitar, Piano)."`
    - `data-testid="filter-instruments"`: `<input type="text" placeholder="e.g. Guitar, Piano" title="..." />`
- **Footer Buttons**:
  - `data-testid="filter-cancel-button"`: Closes modal and calls `onClose()` (discards draft).
  - `data-testid="filter-apply-button"`: Calls `onApply(draftCriteria)` (applies criteria and closes modal).

---

## 4. `EmptyState` Integration for Filtered Queries

When `notes` exist in the database for the active tab, but `filterIdeas(notes, criteria)` returns 0 matches:

```typescript
export interface EmptyStateProps {
  isArchive: boolean;
  isFiltered?: boolean;
  onClearFilters?: () => void;
}
```

- When `isFiltered === true`:
  - Icon: 🔍
  - Title: "No matching ideas"
  - Subtitle: "No ideas match your current filter criteria. Try adjusting or clearing your filters."
  - Action button: "Clear Filters" (calls `onClearFilters`).
