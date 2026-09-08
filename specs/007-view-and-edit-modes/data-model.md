# Data Model: View and Edit Modes

**Feature**: 007-view-and-edit-modes | **Date**: 2026-09-08

## Overview

This feature introduces **no new database entities or schema changes**. All data modifications use the existing `AudioNote` entity and `UpdateAudioNoteInput` contract. The new concepts are purely UI-side state models.

## Existing Entities (Unchanged)

### AudioNote

| Field | Type | Editable in Edit Mode | Notes |
|-------|------|----------------------|-------|
| `id` | `number` | ❌ | Primary key |
| `title` | `string` | ✅ | Cannot be set to empty (backend sanitizes) |
| `file_path` | `string` | ❌ | Relative path to audio file |
| `duration_seconds` | `number` | ❌ | Extracted at capture/import time |
| `bpm` | `number \| null` | ✅ | Must be positive or null; DB constraint `CHECK (bpm IS NULL OR bpm > 0)` |
| `musical_key` | `string \| null` | ✅ | Free text (e.g., "C major", "Am") |
| `authors` | `string \| null` | ✅ | Free text |
| `song_section` | `string \| null` | ✅ | Free text (e.g., "Verse", "Chorus") |
| `notes` | `string \| null` | ✅ | Free text, can be long |
| `is_used` | `0 \| 1` | ❌ (via archive toggle) | Managed by existing archive/restore action |
| `created_at` | `string` | ❌ | ISO 8601, set at creation |
| `updated_at` | `string` | ❌ | ISO 8601, auto-updated by backend on any change |

### Instrument (via junction table)

| Field | Type | Notes |
|-------|------|-------|
| `id` | `number` | Primary key |
| `name` | `string` | Unique instrument name |

**Relationship**: Many-to-many via `audio_note_instruments` junction table. Updated by passing `instrument_names: string[]` to `UpdateAudioNoteInput`, which replaces all associations.

## New UI State Models

### TableMode

```
Type: 'view' | 'edit'
Default: 'view'
Persistence: None (resets to 'view' on component mount)
Scope: AppLayout component state
```

A simple string literal union controlling the interaction mode of the Ideas Table.

### ActiveCellId

```
Type: { noteId: number; field: EditableField } | null
Default: null
Scope: useInlineEdit hook state
```

Tracks which cell is currently being edited. Only valid when `TableMode === 'edit'`. Set to `null` when no cell is active.

### EditableField

```
Type: 'title' | 'bpm' | 'musical_key' | 'authors' | 'song_section' | 'notes' | 'instruments'
```

The set of fields that can be inline-edited. Maps directly to `UpdateAudioNoteInput` keys.

## Field-to-Column Mapping

| Column Header | `AudioNote` Field | `EditableField` Key | Input Type | Commit Transform |
|---------------|-------------------|---------------------|------------|-----------------|
| Title | `title` | `'title'` | Text | Trim; reject if empty (revert) |
| BPM | `bpm` | `'bpm'` | Text | Parse to positive number; empty → `null`; invalid → revert |
| Key | `musical_key` | `'musical_key'` | Text | Trim; empty → `null` |
| Authors | `authors` | `'authors'` | Text | Trim; empty → `null` |
| Section | `song_section` | `'song_section'` | Text | Trim; empty → `null` |
| Notes | `notes` | `'notes'` | Text | Trim; empty → `null` |
| Instruments | `instruments[]` | `'instruments'` | Text | Split by comma, trim each, filter empty → `string[]` |
| Duration | `duration_seconds` | — | Non-editable | — |
| Created | `created_at` | — | Non-editable | — |
| *(Actions)* | — | — | Non-editable | — |

## State Transitions

### Table Mode

```
[View Mode] ---(toggle click)---> [Edit Mode]
[Edit Mode] ---(toggle click)---> [Commit active cell if any] ---> [View Mode]
```

### Cell Editing

```
[Idle]
  |
  |--- (click editable cell in edit mode) --->
  |
[Editing: {noteId, field}]
  |
  |--- (Escape key) ---> [Commit value] ---> [Idle]
  |--- (blur / click outside) ---> [Commit value] ---> [Idle]
  |--- (click different editable cell) ---> [Commit value] ---> [Editing: {newNoteId, newField}]
  |--- (commit fails) ---> [Revert value] ---> [Idle]
  |--- (mode toggled to view) ---> [Commit value] ---> [Idle]
```
