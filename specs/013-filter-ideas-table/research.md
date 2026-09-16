# Architectural Research: Filter Ideas Table

**Feature**: `013-filter-ideas-table` | **Date**: 2026-09-15

This document outlines the technical research, architectural decisions, and alternatives evaluated for implementing the Ideas Table filtering system.

---

## Decision 1: Client-Side (Renderer) vs. Server-Side (Main/SQLite) Filtering

### Context
Users need to filter audio ideas across 5 parameters: BPM (range: min, max), Key, Authors, Section, and Instruments. Text searches must be case-insensitive with partial string matching, and multiple authors or instruments entered with commas must be parsed and matched using AND logic. We need to decide whether filtering runs in SQLite via IPC or in the Renderer process.

### Options Evaluated

1. **Option A: Server-Side SQLite Querying via IPC**
   - *How it works*: Pass filter criteria over IPC to `vaultAPI.notes.getAll(filters)`. Modify `getNotes` in `note-repository.ts` with dynamic SQL clauses (`LIKE`, subqueries, joins).
   - *Pros*: Executes directly against the database engine.
   - *Cons*:
     - Requires modifying Main process IPC channels, SQL query builders, and database tests.
     - Multi-token comma parsing in SQL requires dynamic string tokenization or complex joined subqueries.
     - IPC serialization overhead on every filter application.
     - SQLite `LIKE` in `better-sqlite3` is case-insensitive only for ASCII characters by default; multi-table instrument queries require junction subquery joins.
     - Notes must already be enriched with instruments in the Renderer for table display anyway (`useNotes` enriches notes on load).

2. **Option B: Client-Side Filtering in the Renderer (Selected)**
   - *How it works*: `useNotes` already loads and caches enriched notes (`NoteWithInstruments[]`, which includes `bpm`, `musical_key`, `authors`, `song_section`, and `instruments: Instrument[]`) for the active tab. Filtering runs in React memory via a pure helper function wrapped in `useMemo`.
   - *Pros*:
     - **Sub-millisecond execution**: Immediate table re-rendering with zero IPC round-trip latency.
     - **Process Separation**: 100% compliant with the Vault Constitution. UI display filtering belongs strictly in the Renderer; database and disk I/O remain untouched.
     - **Stack Simplicity**: Zero new dependencies, zero SQLite schema/query modifications, zero IPC contract changes.
     - **Rock-solid testability**: Pure filtering and tokenizer functions are trivial to unit test with 100% branch coverage.
     - **Flexible tokenization**: JavaScript easily splits strings by commas, trims tokens, ignores empty values, and runs `.every()` across tokens.

### Decision
**Option B: Client-Side Filtering in the Renderer.** Filter logic is encapsulated in a dedicated module `src/renderer/lib/filter-ideas.ts` and consumed via React state in `AppLayout.tsx`.

---

## Decision 2: Filter Modal Architecture & Draft State vs. Applied State

### Context
The user specified that:
1. Entering values into the filter modal must **not** filter the table reactively on every keystroke.
2. The form must **not** submit on the `Enter` key, preventing accidental submissions while filling multiple rows.
3. The user must explicitly click the **"Apply"** button in the modal footer to commit the criteria and update the table.
4. Closing the modal without clicking "Apply" (Escape, Close button, backdrop click) must discard unapplied draft changes.

### State Architecture
We implement a two-tier state model:

```text
[AppLayout State: appliedFilters]
          │
          ▼ (on Open Modal)
[FilterModal Internal State: draftFilters] ──(typing)──> Updates draftFilters only
          │                                                (Enter key suppressed via e.preventDefault())
          ├─── (Click "Apply") ────> Calls onApply(draftFilters) ──> Updates appliedFilters & closes modal
          │
          └─── (Click Close / Esc / Backdrop) ──> Calls onClose() ──> Discards draftFilters
```

- **Enter Key Suppression**: An `onKeyDown` handler on `<form>` checks `if (e.key === 'Enter') e.preventDefault()`. Individual `<input>` elements also capture `onKeyDown` to guarantee no default form submission triggers.
- **Draft Initialization**: When `isOpen` transitions to `true`, `draftFilters` is initialized with a copy of `appliedFilters`.

---

## Decision 3: Parameter Matching Rules & Multi-Token Comma Parsing

### 1. Multi-Token Comma Tokenizer
For fields that support multiple values (**Authors** and **Instruments**), user input is tokenized by commas:

```typescript
export function parseFilterTokens(query?: string): string[] {
  if (!query) return [];
  return query
    .split(',')
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);
}
```
- Discards empty tokens (e.g. `John, , Paul,` -> `['john', 'paul']`).
- Trims surrounding whitespace.
- Normalizes to lowercase for case-insensitive comparison.

### 2. Multi-Author Matching (AND Logic)
- Evaluates whether **every** author token in the query is included in `note.authors`:
  ```typescript
  const authorTokens = parseFilterTokens(criteria.authors);
  if (authorTokens.length > 0) {
    const authorsText = note.authors?.toLowerCase() ?? '';
    if (!authorTokens.every((token) => authorsText.includes(token))) {
      return false;
    }
  }
  ```
- **Order-Independent**: Searching `Paul, John` matches an idea with `authors: "John Lennon, Paul McCartney"`.
- **Substring Match**: Searching `John` matches `John Lennon`.

### 3. Multi-Instrument Matching (AND Logic)
- Evaluates whether **every** instrument token in the query matches at least one tagged instrument on the idea:
  ```typescript
  const instrumentTokens = parseFilterTokens(criteria.instruments);
  if (instrumentTokens.length > 0) {
    const hasAll = instrumentTokens.every((token) =>
      note.instruments.some((inst) => inst.name.toLowerCase().includes(token))
    );
    if (!hasAll) return false;
  }
  ```
- Searching `Guitar, Piano` matches ideas tagged with both `"Acoustic Guitar"` and `"Grand Piano"`.

### 4. BPM Range (`bpmMin`, `bpmMax`)
- `bpmMin` only: `note.bpm != null && note.bpm >= bpmMin`.
- `bpmMax` only: `note.bpm != null && note.bpm <= bpmMax`.
- Both: `note.bpm != null && note.bpm >= bpmMin && note.bpm <= bpmMax`.
- Inverted range (`bpmMin > bpmMax`): Strict interval evaluation returns 0 matches without crashing.

### 5. Key and Section
- Case-insensitive substring match:
  `note.musical_key?.toLowerCase().includes(query.trim().toLowerCase())`
  `note.song_section?.toLowerCase().includes(query.trim().toLowerCase())`

### 6. Modal Parameter Input Tooltips
Each parameter row in `FilterModal` displays a descriptive `title` tooltip on hover:
- **BPM**: `"Tempo in beats per minute. Specify a minimum, maximum, or both to filter by range."`
- **Key**: `"Musical key signature (e.g., C maj, A min, F#). Matches partial text."`
- **Authors**: `"Songwriters and performers. Separate multiple authors with commas to require all of them (e.g., John, Paul)."`
- **Section**: `"Song section (e.g., Chorus, Verse, Bridge, Intro). Matches partial text."`
- **Instruments**: `"Musical instruments tagged on this idea. Separate multiple instruments with commas to require all of them (e.g., Guitar, Piano)."`

---

## Decision 4: Toolbar Integration and Clear Filters Button

### Placement and Ergonomics
- Positioned in the top toolbar left action group adjacent to `<DeleteButton />`:
  ```tsx
  <div className="flex items-center gap-2">
    <TabBar activeTab={activeTab} onTabChange={handleTabChange} />
    <DeleteButton selectedCount={selectedCount} onClick={() => setIsConfirmOpen(true)} />
    <FilterButton isFiltered={isFiltered} onClick={() => setIsFilterModalOpen(true)} />
    {isFiltered && <ClearFiltersButton onClick={handleClearFilters} />}
  </div>
  ```
- **FilterButton**:
  - Displays a filter/funnel SVG icon.
  - `title="Filter ideas"`.
  - When `isFiltered === true`, highlighted with `bg-accent/10 text-accent border-accent/40`.
- **ClearFiltersButton**:
  - Displays a close/`×` SVG icon.
  - `title="Clear all filters"`.
  - Clicking invokes `handleClearFilters()` which resets `appliedFilters` to initial empty state, immediately restoring the full table with zero confirmation dialogs.
