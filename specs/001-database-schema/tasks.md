# Tasks — Spec 001: Data Model for Audio Notes

**Spec:** [`spec.md`](file:///Users/andresdelgado/Documents/Coding/Vault/specs/001-database-schema/spec.md)
**Plan:** [`plan.md`](file:///Users/andresdelgado/Documents/Coding/Vault/specs/001-database-schema/plan.md)

---

## Task 1 — Project scaffolding

Set up the project from scratch: `package.json` (with `better-sqlite3`,
`electron`, `typescript`, `vitest`, `@types/better-sqlite3`, `@types/node`),
`tsconfig.json` (strict mode, `@shared/*` path alias), `tsconfig.main.json`
(scoped to `src/main` + `src/shared`), `.gitignore` (node_modules, dist),
and the full directory tree from AGENTS.md (empty placeholder dirs for
`src/main/db`, `src/main/ipc`, `src/main/audio`, `src/preload`,
`src/renderer/components`, `src/renderer/hooks`, `src/renderer/context`,
`src/renderer/types`, `src/shared/types`). Run `npm install` and verify it
completes without errors.

**Covers:** —  (infrastructure, no FRs)

- [x] **Done when:** `npm install` succeeds, `npx tsc --noEmit` exits 0 on an
  empty project, and the directory structure matches AGENTS.md §3.

---

## Task 2 — Shared TypeScript types

Create all shared type definitions consumed by Main and Renderer:

- `src/shared/types/audio-note.ts` — `AudioNote`, `CreateAudioNoteInput`,
  `UpdateAudioNoteInput`
- `src/shared/types/instrument.ts` — `Instrument`
- `src/shared/types/ipc.ts` — `IPCResult<T>`
- `src/shared/types/filters.ts` — `NoteFilters`
- `src/shared/types/index.ts` — barrel re-export

No `any` anywhere. Every optional field uses `| null` or `?` as defined in
the plan.

**Covers:** FR-1, FR-2, FR-5, FR-6, FR-7, FR-8, FR-9, FR-11, FR-12

- [x] **Done when:** `npx tsc --noEmit` passes and all five type files exist
  with correct interfaces matching the plan's type definitions.

---

## Task 3 — Database client and migration runner

Create the SQLite client and migration infrastructure:

- `src/main/db/client.ts` — singleton `getDatabase(dbPath)` and
  `closeDatabase()`. Enables WAL mode and foreign keys.
- `src/main/db/migrations/index.ts` — `runMigrations(db)` with a
  `_migrations` tracking table. Runs pending migrations in order inside
  transactions.

Write the first migration:

- `src/main/db/migrations/001-initial-schema.ts` — creates `audio_notes`,
  `instruments`, `audio_note_instruments`, and `app_meta` tables with all
  columns, constraints, CHECK clauses, foreign keys, and cascade rules as
  defined in the plan.

**Covers:** FR-1, FR-2, FR-3, FR-5, FR-6, FR-7, FR-8, FR-9, FR-11, FR-12,
NFR-1, NFR-2

- [x] **Done when:** a test opens a temp database, calls `runMigrations`,
  and confirms all 4 tables plus `_migrations` exist. Running migrations
  twice is idempotent. `app_meta` contains `next_note_number = '1'`.

---

## Task 4 — Instrument repository + tests

Create `src/main/db/instrument-repository.ts` with:

- `getAllInstruments(db)` → `Instrument[]`
- `getOrCreateInstrument(db, name)` → `Instrument`
- `getInstrumentsByNoteId(db, noteId)` → `Instrument[]`

Write `src/main/db/__tests__/instrument-repository.test.ts`:

- `getOrCreateInstrument("Guitar")` twice → same `id` returned.
- `getAllInstruments()` returns the full catalog.
- Instrument name uniqueness is case-sensitive (`Guitar` ≠ `guitar`).

**Covers:** FR-9, FR-10

- [x] **Done when:** `npm test -- instrument-repository` passes all 3 test
  cases.

---

## Task 5 — Note repository: create and read + tests

Create `src/main/db/note-repository.ts` with:

- `createNote(db, input)` → `AudioNote` — wraps the full transaction:
  read + increment `next_note_number`, default title if absent, INSERT note,
  link instruments via `getOrCreateInstrument`.
- `getNoteById(db, id)` → `AudioNote & { instruments: Instrument[] } | null`
- `getNotes(db, filters)` → `AudioNote[]` — dynamic WHERE builder with
  bound params, default `ORDER BY created_at DESC`.

Write `src/main/db/__tests__/note-repository.test.ts` (create + read cases):

- Create note with all fields → returns complete `AudioNote`.
- Create note without title → title is `idea-1`.
- Create 3 notes, delete middle, create another → title is `idea-4`.
- Create note with `bpm: -10` → throws (CHECK constraint).
- Create note with `bpm: null` → succeeds.
- Create note with instruments → instruments created in catalog.
- Create two notes with same instrument → only one instrument row.
- Get notes default order → most recent first.
- Get notes with `is_used: 0` filter → only available notes returned.
- Optional fields stored as `null`, not empty string.

**Covers:** FR-1, FR-3, FR-4, FR-5, FR-6, FR-7, FR-8, FR-10, FR-11, FR-13,
FR-14, NFR-3, Edge: duplicate titles, Edge: BPM bounds, Edge: null vs empty

- [x] **Done when:** `npm test -- note-repository` passes all 10 test cases.

---

## Task 6 — Note repository: update and delete + tests

Add to `src/main/db/note-repository.ts`:

- `updateNote(db, input)` → `AudioNote` — updates only provided fields,
  refreshes `updated_at`, replaces instrument associations if
  `instrument_names` is provided.
- `deleteNote(db, id)` → `{ file_path: string } | null` — deletes the row
  (CASCADE removes junction rows), returns the `file_path` so the caller
  can handle file removal.

Add test cases to `note-repository.test.ts`:

- Update `is_used` from 0 to 1 → persisted correctly.
- Update title and BPM → only those fields change, `updated_at` advances.
- Update instrument list → old associations removed, new ones created.
- Delete note → row gone, junction rows gone.
- Delete note → orphaned instrument remains in catalog.
- Delete non-existent id → returns `null`.

**Covers:** FR-1, FR-8, FR-15, Edge: orphaned instruments

- [x] **Done when:** `npm test -- note-repository` passes all previous +
  6 new test cases (16 total).

---

## Task 7 — IPC handlers

Create `src/main/ipc/note-handlers.ts` and
`src/main/ipc/instrument-handlers.ts`:

- `notes:create` — calls `createNote`, returns `IPCResult<AudioNote>`.
- `notes:get-all` — calls `getNotes`, returns `IPCResult<AudioNote[]>`.
- `notes:get-by-id` — calls `getNoteById`, returns
  `IPCResult<AudioNote & { instruments: Instrument[] }>`.
- `notes:update` — calls `updateNote`, returns `IPCResult<AudioNote>`.
- `notes:delete` — calls `deleteNote`, then `fs.promises.unlink` on the
  returned `file_path`. If `ENOENT`, sets `file_missing: true` instead of
  throwing. Returns `IPCResult<{ file_missing: boolean }>`.
- `instruments:get-all` — calls `getAllInstruments`, returns
  `IPCResult<Instrument[]>`.

Every handler wraps its body in `try/catch` and returns the `IPCResult`
envelope.

**Covers:** FR-15, FR-16, all FRs via delegation

- [x] **Done when:** all handler files compile (`npx tsc --noEmit`), each
  handler is exported as a registration function that accepts
  `ipcMain` and `Database`, and the delete handler includes the
  `ENOENT` graceful path.

---

## Task 8 — Preload bridge + Electron stub

Create `src/preload/index.ts`:

- Defines `vaultAPI` object with `notes` and `instruments` namespaces.
- Each method calls `ipcRenderer.invoke` for the matching channel.
- Exposes via `contextBridge.exposeInMainWorld('vaultAPI', vaultAPI)`.

Create `src/preload/vaultAPI.d.ts`:

- TypeScript declaration for `window.vaultAPI` so Renderer gets full
  type safety.

Create `src/main/index.ts` (minimal Electron stub):

- Creates `BrowserWindow`, calls `runMigrations`, registers all IPC
  handlers. No real UI loading yet — just enough to verify the wiring.

**Covers:** — (integration wiring, all FRs are covered by prior tasks)

- [x] **Done when:** `npx tsc --noEmit` passes for the full project,
  `npm test` still passes all tests, and the preload exposes all 6
  IPC channels defined in the plan.

---

## Summary

| Task | ~Time  | Depends on | FRs                                           |
|------|--------|------------|-----------------------------------------------|
| 1    | 20 min | —          | — (infra)                                     |
| 2    | 20 min | 1          | FR-1,2,5,6,7,8,9,11,12                       |
| 3    | 25 min | 1, 2       | FR-1,2,3,5,6,7,8,9,11,12, NFR-1,2            |
| 4    | 20 min | 2, 3       | FR-9,10                                       |
| 5    | 30 min | 2, 3, 4    | FR-1,3,4,5,6,7,8,10,11,13,14, NFR-3          |
| 6    | 25 min | 5          | FR-1,8,15, Edge: orphaned                     |
| 7    | 25 min | 5, 6       | FR-15,16, all via delegation                  |
| 8    | 20 min | 7          | — (wiring)                                    |
| **Σ** | **~3h** |           | **FR-1 through FR-16, NFR-1,2,3, all edges** |
