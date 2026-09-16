# Implementation Plan: Filter Ideas Table

**Branch**: `013-filter-ideas-table` | **Date**: 2026-09-15 | **Spec**: [`specs/013-filter-ideas-table/spec.md`](spec.md)

**Input**: Feature specification from `specs/013-filter-ideas-table/spec.md`

## Summary

This feature introduces a comprehensive filtering system for the Ideas Table:
1. **Toolbar Filter Button & Clear Button**: Positioned in the toolbar adjacent to the trash button. The Filter button opens the modal, has a tooltip (`"Filter ideas"`), and indicates active filtering via styling. The Clear `'X'` button appears only when filters are active, has a tooltip (`"Clear all filters"`), and immediately wipes all filters with zero confirmation prompts.
2. **Filter Ideas Modal**: An Apple HIG-styled modal dialog featuring 5 parameter rows: BPM (range: Min and Max), Key, Authors, Section, and Instruments.
3. **Multi-Token Comma Matching (AND Logic)**: In Authors and Instruments fields, multiple items entered with commas (e.g. `John, Paul` or `Guitar, Piano`) are parsed into distinct tokens requiring **all** specified items to be present on the idea, order-independently and case-insensitively.
4. **Contextual Input Tooltips**: Every parameter row in the modal displays an informative hover tooltip guiding users on formatting conventions (including comma separation for multiple authors and instruments).
5. **Click-Only Apply**: Criteria are applied to the ideas table exclusively when the user clicks the "Apply" button in the footer. Form submission via the `Enter` key is explicitly suppressed to avoid premature/accidental submits while filling out multiple fields.
6. **Draft Cancellation on Dismissal**: Dismissing the modal without clicking "Apply" (Escape, Close button, backdrop click) cancels uncommitted draft values and preserves the table's current filter state.
7. **Client-Side In-Memory Filtering**: Leverages the already enriched note catalog in `useNotes` to filter instantly (<1ms perceived delay) using pure functions, maintaining strict process separation and zero SQLite or IPC churn.

---

## Technical Context

**Language/Version**: TypeScript 5.7+ (Node.js 20+, Electron 35)  
**Primary Dependencies**: React 19, Tailwind CSS v3, Vitest 3, Testing Library  
**Storage**: SQLite via `better-sqlite3` (unchanged; filtering operates on loaded entities in Renderer memory)  
**Testing**: Vitest (`npm test`) using jsdom  
**Target Platform**: Desktop application (Electron / macOS, Windows, Linux)  
**Project Type**: Desktop application (Renderer UI components & state hooks)  
**Performance Goals**: <200ms perceived filter apply delay; <1ms in-memory filtering execution; instant modal open/close (<50ms)  
**Constraints**: Zero new third-party dependencies; strict process separation (purely in `src/renderer/`); 100% English code, comments, and specs  
**Scale/Scope**: 
- 2 new UI components (`FilterModal.tsx`, `FilterButton.tsx`, `ClearFiltersButton.tsx` or integrated)
- 1 new filtering library (`filter-ideas.ts` with tokenizer and AND logic)
- 1 updated layout (`AppLayout.tsx`)
- 1 updated empty state (`EmptyState.tsx`)
- Comprehensive unit and integration test suites

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Requirement | Compliance Status | Rationale |
|---|---|---|---|
| **STACK SIMPLICITY** | No third-party dependencies added | ✅ PASS | Built purely with React 19, Tailwind CSS v3, and native HTML form attributes. |
| **PROCESS SEPARATION** | UI logic isolated in Renderer | ✅ PASS | Filtering occurs in Renderer memory on already enriched note models. Zero modifications to SQLite, IPC handlers, or Main process. |
| **VERIFIABLE TESTS** | Automated tests for all components & utilities | ✅ PASS | Unit tests planned for `filter-ideas.ts` (100% branch coverage including tokenization), `FilterModal.test.tsx`, `FilterButton.test.tsx`, and `AppLayout.test.tsx`. |
| **DATA INTEGRITY** | Read-only presentation of notes | ✅ PASS | Filtering is strictly a transient view transformation. Database rows and physical audio files remain untouched. |
| **UNIFIED LANGUAGE** | All code, docs, and commits in English | ✅ PASS | 100% English compliance across all types, components, specs, and docs. |

---

## Project Structure

### Documentation (this feature)

```text
specs/013-filter-ideas-table/
├── spec.md              # Feature specification
├── plan.md              # This technical implementation plan
├── research.md          # Architectural research & decisions
├── data-model.md        # Data models, tokenization & filter matching logic
├── contracts/           # Component interface contracts & tooltips
│   └── ui-contracts.md
├── checklists/          # Specification quality checklist
│   └── requirements.md
├── quickstart.md        # Runnable validation scenarios
└── tasks.md             # Implementation tasks (generated via /speckit-tasks)
```

### Source Code Impact

```text
src/
└── renderer/
    ├── components/
    │   ├── __tests__/
    │   │   ├── FilterButton.test.tsx       # [NEW] Toolbar button & tooltip tests
    │   │   ├── ClearFiltersButton.test.tsx # [NEW] Clear 'X' button tests
    │   │   ├── FilterModal.test.tsx        # [NEW] Modal form, input tooltips, enter suppression & apply tests
    │   │   └── AppLayout.test.tsx          # [UPDATE] Filter state & toolbar integration tests
    │   ├── FilterButton.tsx                # [NEW] Filter trigger button with active indicator
    │   ├── ClearFiltersButton.tsx          # [NEW] Toolbar 'X' button to reset filters
    │   ├── FilterModal.tsx                 # [NEW] Filter modal dialog with 5 parameter rows, tooltips & Apply button
    │   ├── EmptyState.tsx                  # [UPDATE] Support filtered zero-match empty state
    │   ├── IdeasTable.tsx                  # [UPDATE] Pass filtered empty state affordance
    │   └── AppLayout.tsx                   # [UPDATE] Orchestrate filter state & toolbar placement
    ├── lib/
    │   ├── __tests__/
    │   │   └── filter-ideas.test.ts        # [NEW] Unit tests for tokenizer, matching engine & edge cases
    │   └── filter-ideas.ts                 # [NEW] Pure filtering functions (BPM, tokenizer, multi-token AND logic)
    └── types/
        └── filters.ts                      # [NEW] IdeaFilterCriteria interface, tooltips & initial state
```

**Structure Decision**: Standard Vault Renderer component architecture, cleanly isolating the filtering engine and tokenizer in `src/renderer/lib/filter-ideas.ts` and the UI components in `src/renderer/components/`.

---

## Complexity Tracking

*No violations. All principles pass unconditionally.*
