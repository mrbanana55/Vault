# Research & Technical Decisions: Fix Audio Playback CSP and Real Duration Display

**Feature**: Fix Audio Playback CSP and Real Duration Display
**Branch**: `009-fix-playback-duration`
**Date**: 2026-09-08

## Overview

This research document resolves the root causes of two interconnected issues:
1. **CSP Media-Source Violation & `NotSupportedError`**: Chromium console error `Refused to load media from 'vault-audio://...' because it violates Content Security Policy directive: 'default-src 'self''` and subsequent `NotSupportedError: Failed to load because no supported source was found`.
2. **Missing / 00:00 Duration Display**: Ideas in the table displaying `00:00` duration because `extractAudioDuration` was blocked by CSP when attempting to load `blob:` URLs, resulting in `duration_seconds: 0` being saved in SQLite.

---

## Decision 1: Content Security Policy Configuration for Custom Protocol & Blobs

### Decision
Update the Content Security Policy in `src/renderer/index.html` to explicitly permit media sources from:
```text
media-src 'self' vault-audio: blob:;
```
Additionally, enhance scheme privilege registration in `src/main/audio/audio-protocol-handler.ts` by adding `bypassCSP: true`:
```typescript
protocol.registerSchemesAsPrivileged([
  {
    scheme: VAULT_AUDIO_SCHEME,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
      bypassCSP: true,
    },
  },
]);
```

### Rationale
- **Direct Root Cause Resolution**: In `src/renderer/index.html`, the CSP was previously defined as:
  `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'`
  Because `media-src` was not explicitly set, Chromium fell back to `default-src 'self'`, which strictly restricts media to the same origin (`http://localhost:5173` or packaged root). It blocked both `vault-audio://` and `blob:` URLs.
- **Enables Both Playback and Duration Extraction**: Adding `media-src 'self' vault-audio: blob:;` allows `<audio src="vault-audio://...">` to load without error, and simultaneously allows `extractAudioDuration(file)` to load `<audio src="blob:...">` to read duration metadata upon file import.
- **Defense-in-Depth**: Setting `bypassCSP: true` on scheme registration ensures Chromium's networking layer does not apply origin restrictions to the custom protocol.

### Alternatives Considered
- Setting `webSecurity: false` in `BrowserWindow`: Strictly rejected. Disabling web security leaves the app vulnerable and violates the Vault Constitution.
- Reading audio files entirely into memory as Base64 data URLs: Rejected. Base64 strings impose 33% memory overhead and cannot support Range-based HTTP streaming.

---

## Decision 2: Accurate MIME Type Headers in Custom Protocol Handler

### Decision
In `src/main/audio/audio-protocol-handler.ts`, guarantee that streaming responses served by `handleVaultAudioProtocol` return explicit, standardized audio MIME types matching file extensions:
- `.wav` → `audio/wav`
- `.mp3` → `audio/mpeg`
- `.m4a` → `audio/mp4`
- `.ogg` → `audio/ogg`
- `.flac` → `audio/flac`

If `net.fetch(fileUrl)` returns generic `text/plain`, `application/octet-stream`, or missing content type for `.m4a` files on certain operating systems, the protocol handler overrides the `Content-Type` response header with the correct audio MIME type.

### Rationale
- Chromium's HTML5 media engine emits `NotSupportedError: Failed to load because no supported source was found` if an audio element receives a stream with an unrecognized or non-audio MIME type. Ensuring `audio/mp4` for `.m4a` and `audio/mpeg` for `.mp3` guarantees seamless decoding.

### Alternatives Considered
- Relying on OS file association registry for MIME types: Rejected because Windows and Linux distributions frequently lack or misconfigure `.m4a` MIME mapping.

---

## Decision 3: Retroactive Duration Resolution for Existing Database Records

### Decision
Implement a two-tiered duration resolution mechanism:
1. **Extend Update Schema**: Update `UpdateAudioNoteInput` in `@shared/types` and `updateNote` in `src/main/db/note-repository.ts` to accept an optional `duration_seconds?: number` field.
2. **Dynamic Resolution on Playback**: In `AudioPlayerContext`, when `loadedmetadata` or `durationchange` fires on the audio element:
   If `audio.duration > 0` and the current note has `duration_seconds <= 0`, update the local state and asynchronously invoke `window.vaultAPI.notes.update({ id: currentNote.id, duration_seconds: audio.duration })`.
3. **Automatic Table Resolution**: In `src/renderer/hooks/useNotes.ts` (or a dedicated duration-sync effect), when notes are loaded:
   If any note has `duration_seconds <= 0`, load its duration via `vault-audio://stream/${note.file_path}` in the background and update the database row.

### Rationale
- Fixes the user's immediate problem: existing ideas that were already imported with `00:00` will automatically update to their real duration without requiring the user to re-import or edit them manually.
- Clean architectural fit: respects the Constitution by keeping audio metadata decoding in the Renderer while persisting updates via standard typed IPC to the Main process SQLite repository.

### Alternatives Considered
- Database migration with Node-based file parser: Rejected. Node standard library cannot parse AAC/M4A atoms or VBR MP3 duration without third-party dependencies (which violates STACK SIMPLICITY).
- Leaving existing notes as 00:00 and only fixing new imports: Rejected. Violates user requirement: "Also, the idea's duration is shown as 00:00 but that's not true. Show the real audio duration on each idea".

---

## Decision 4: Robust Duration Extraction During Import

### Decision
In `src/renderer/lib/audio-metadata.ts`:
1. Use `URL.createObjectURL(file)` now that `blob:` is whitelisted in CSP.
2. Add a 3-second timeout to `extractAudioDuration` so corrupted files do not hang the import batch.
3. If HTML5 `Audio.onloadedmetadata` fails, provide a fallback attempt using `AudioContext.decodeAudioData` (slicing the first 1MB or full buffer) before falling back to 0.

### Rationale
- Guarantees high resilience during batch imports of voice memos and stems across various formats and container encodings.
