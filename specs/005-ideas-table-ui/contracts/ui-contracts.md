# Phase 1 Contracts: UI Contracts & Bridge Integration

**Feature**: `005-ideas-table-ui`  
**Date**: 2026-09-04  

---

## 1. VaultAPI Bridge Interface (Consumed by UI)

The Renderer interacts strictly with `window.vaultAPI` (defined in `@shared/types/vault-api.ts`):

```typescript
export interface VaultAPI {
  notes: {
    create: (input: CreateAudioNoteInput) => Promise<IPCResult<AudioNote>>;
    getAll: (filters?: NoteFilters) => Promise<IPCResult<AudioNote[]>>;
    getById: (id: number) => Promise<IPCResult<AudioNote & { instruments: Instrument[] }>>;
    update: (input: UpdateAudioNoteInput) => Promise<IPCResult<AudioNote>>;
    delete: (id: number) => Promise<IPCResult<{ file_missing: boolean }>>;
  };
  instruments: {
    getAll: () => Promise<IPCResult<Instrument[]>>;
  };
  saveAudioFile: (
    buffer: ArrayBuffer,
    format?: AudioFormat
  ) => Promise<IPCResult<AudioIngestionResult>>;
}
```

### Channels & Payloads Used by Spec 005

| Action | IPC Channel | Input Payload | Return Payload |
|---|---|---|---|
| Fetch Ideas | `notes:get-all` | `{ is_used: 0 }` | `IPCResult<AudioNote[]>` |
| Fetch Archive | `notes:get-all` | `{ is_used: 1 }` | `IPCResult<AudioNote[]>` |
| Fetch Instruments | `notes:get-by-id` | `id: number` | `IPCResult<AudioNote & { instruments: Instrument[] }>` |
| Toggle to Used | `notes:update` | `{ id: number, is_used: 1 }` | `IPCResult<AudioNote>` |
| Toggle to Unused | `notes:update` | `{ id: number, is_used: 0 }` | `IPCResult<AudioNote>` |

---

## 2. Component Contract Specifications

### `<TabBar />`
```typescript
export interface TabBarProps {
  activeTab: 0 | 1;
  onTabChange: (tab: 0 | 1) => void;
}
```
- Emits `0` when "Ideas" tab is clicked.
- Emits `1` when "Archive" tab is clicked.
- Styled as an Apple-like segmented pill.

### `<IdeasTable />`
```typescript
export interface IdeasTableProps {
  isUsed: 0 | 1;
}
```
- Fetches notes matching `isUsed`.
- Displays loading indicator while fetching.
- Displays friendly `<EmptyState />` if result set is empty.
- Displays table headers and `<TableRow />` items when data exists.

### `<TableRow />`
```typescript
export interface TableRowProps {
  note: NoteWithInstruments;
  onToggle: () => void;
}
```
- Renders all 9 metadata columns plus toggle action column.
- Clicking the toggle calls `window.vaultAPI.notes.update({ id: note.id, is_used: newStatus })` and triggers `onToggle()` upon success.

### `<ThemeToggle />`
```typescript
export function ThemeToggle(): JSX.Element;
```
- Reads theme from `ThemeContext`.
- Toggles between `'light'` and `'dark'`.
- Renders Sun icon in light mode and Moon icon in dark mode.
