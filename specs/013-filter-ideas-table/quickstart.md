# Quickstart & Verification Guide: Filter Ideas Table

**Feature**: `013-filter-ideas-table` | **Date**: 2026-09-15

This guide provides end-to-end validation scenarios for verifying the Ideas Table filtering implementation.

---

## Prerequisites

1. Vault development environment configured.
2. Dependencies installed via `npm install`.
3. Application build verified via `npm run build`.

---

## Automated Verification

Run all unit and integration test suites:

```bash
npm test
```

Run test suites specific to filtering:

```bash
# Filter matching engine unit tests (tokenization, multi-author & multi-instrument AND logic)
npm test src/renderer/lib/__tests__/filter-ideas.test.ts

# Component unit tests (tooltips, inputs, enter suppression)
npm test src/renderer/components/__tests__/FilterButton.test.tsx
npm test src/renderer/components/__tests__/ClearFiltersButton.test.tsx
npm test src/renderer/components/__tests__/FilterModal.test.tsx

# Layout integration tests
npm test src/renderer/components/__tests__/AppLayout.test.tsx
```

Verify TypeScript strict compilation across all configurations:

```bash
npx tsc --noEmit
npx tsc -p tsconfig.main.json --noEmit
npx tsc -p tsconfig.renderer.json --noEmit
```

---

## Manual Verification Scenarios

### Scenario 1: Filter Button Visibility and Modal Triggering
1. Launch the application (`npm start`).
2. Verify the top toolbar displays the Filter button directly to the right of the trash (delete) button.
3. Hover over the Filter button; verify tooltip displays `"Filter ideas"`.
4. Click the Filter button; verify the Filter Ideas modal opens with 5 parameter rows (BPM range, Key, Authors, Section, Instruments) and an "Apply" button in the footer.
5. Verify the toolbar does **not** show the Clear ('X') button yet.

### Scenario 2: Parameter Row Tooltips
1. In the open Filter modal, hover over the **BPM** row label/inputs; verify tooltip displays `"Tempo in beats per minute. Specify a minimum, maximum, or both to filter by range."`
2. Hover over the **Key** row label/input; verify tooltip displays `"Musical key signature (e.g., C maj, A min, F#). Matches partial text."`
3. Hover over the **Authors** row label/input; verify tooltip displays `"Songwriters and performers. Separate multiple authors with commas to require all of them (e.g., John, Paul)."`
4. Hover over the **Section** row label/input; verify tooltip displays `"Song section (e.g., Chorus, Verse, Bridge, Intro). Matches partial text."`
5. Hover over the **Instruments** row label/input; verify tooltip displays `"Musical instruments tagged on the idea. Separate multiple instruments with commas to require all of them (e.g., Guitar, Piano)."`

### Scenario 3: Enter Key Suppression
1. In the open Filter modal, type `"120"` into the BPM Min input.
2. Press the `Enter` key.
3. **Verify**:
   - The form is NOT submitted.
   - The modal stays open.
   - The ideas table in the background is NOT filtered.

### Scenario 4: Apply Multi-Author Filter (Comma-Separated AND Logic)
1. Ensure the library has ideas with authors like `"John Lennon, Paul McCartney"` and `"John Lennon"`.
2. In the Filter modal, enter `"Paul, John"` into the Authors input (order reversed).
3. Click the primary **"Apply"** button.
4. **Verify**:
   - The modal closes.
   - Only ideas containing **both** John and Paul are displayed (order-independent).
   - Ideas with only John or only Paul are excluded.
   - The Filter button shows an active visual highlight.
   - The `'X'` (Clear all filters) button appears in the toolbar with tooltip `"Clear all filters"`.

### Scenario 5: Apply Multi-Instrument Filter (Comma-Separated AND Logic)
1. Re-open the modal; verify previous values are preserved.
2. Enter `"Guitar, Piano"` into the Instruments input.
3. Click "Apply".
4. **Verify**:
   - Ideas tagged with **both** a guitar (e.g., "Acoustic Guitar") and a piano (e.g., "Grand Piano") match.
   - Ideas with only guitar or only piano are excluded.

### Scenario 6: Dismissal Without Applying Discards Draft
1. Click the Filter button to re-open the modal.
2. Change the Key field to `"F# minor"`.
3. Press `Escape` (or click the Close `×` icon, or click the outer backdrop).
4. **Verify**:
   - The modal closes.
   - The table does NOT update with the `"F# minor"` filter.
   - The prior filter (Authors + Instruments) remains active.
5. Re-open the modal; verify the Key field is empty (the unapplied edit was discarded).

### Scenario 7: Instant Clear via 'X' Button
1. With active filters applied, click the `'X'` button in the toolbar.
2. **Verify**:
   - All filters are cleared immediately without any confirmation prompt.
   - The full catalog of ideas is restored in the table.
   - The `'X'` button disappears from the toolbar.
   - The Filter button returns to its default neutral appearance.
3. Click the Filter button; verify all form inputs are completely cleared.

### Scenario 8: Zero Matching Ideas Empty State
1. Open the Filter modal, enter Min BPM `999`.
2. Click "Apply".
3. **Verify**:
   - Table displays the filtered empty state: `"No matching ideas"`.
   - Clear filters affordance is visible.
