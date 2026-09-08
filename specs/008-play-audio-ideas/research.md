# Research & Technical Decisions: Play Audio Ideas

**Feature**: Play Audio Ideas
**Branch**: `008-play-audio-ideas`
**Date**: 2026-09-08

## Overview

This document resolves all technical decisions and potential ambiguities for implementing audio playback from the ideas table, the top-center scrubber/time bar with duration display, and global Space bar play/pause keyboard shortcuts.

---

## Decision 1: Custom Protocol Handler for Audio Streaming (`vault-audio://`)

### Decision
Implement the `vault-audio://` custom protocol in Electron Main process:
1. Call `protocol.registerSchemesAsPrivileged` before `app.whenReady()` specifying `{ scheme: 'vault-audio', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } }`.
2. Register a handler with `protocol.handle('vault-audio', async (request) => ...)` after `app.whenReady()`.
3. Resolve the relative audio path using `audioStorageService.resolveAbsolutePath(relativePath)` to prevent path traversal.
4. Delegate file serving and HTTP Range request handling to `net.fetch(pathToFileURL(absolutePath).toString())`.

### Rationale
- **Constitution Compliance**: The Vault Constitution explicitly mandates registering `vault-audio` as a privileged scheme before `app.ready` with `{ standard: true, secure: true, supportFetchAPI: true, stream: true }` and serving chunks supporting HTTP Range requests (`bytes=...`).
- **Native Range & Scrubbing Support**: Modern Electron (`net.fetch`) automatically parses HTTP Range headers from HTML5 media elements and generates `206 Partial Content` responses with streaming chunks. This enables seamless audio seeking/scrubbing without loading entire files into memory.
- **Security & Sandboxing**: Keeps the Renderer securely sandboxed without exposing absolute file paths or filesystem APIs (`fs`).

### Alternatives Considered
- `protocol.registerFileProtocol` / `protocol.registerStreamProtocol`: Deprecated in modern Electron (v25+) and lacks native WHATWG `fetch`/`Response` pipeline integration.
- Custom manual Range header parsing with Node `fs.createReadStream`: Adds unnecessary code complexity and error edge cases; `net.fetch` on `file://` URLs is Electron's standard recommended approach.

---

## Decision 2: URL Scheme Format for Audio Files

### Decision
Use the URI format:
```text
vault-audio://stream/${encodeURIComponent(relativePath)}
```
Or for paths with directory separators:
```text
vault-audio://stream/${relativePath}
```
Example: `vault-audio://stream/recordings/550e8400-e29b-41d4-a716-446655440000.wav`.
The protocol handler strips `vault-audio://stream/`, extracts the relative path, and verifies that the file exists within the audio vault.

### Rationale
- Standard URI schemes require a host or authority component (`vault-audio://<host>/<path>`). Using `stream` as a fixed authority avoids confusing hostname parsing with arbitrary directory names.
- Clean and predictable parsing in Chromium URL parser across macOS, Windows, and Linux.

### Alternatives Considered
- `vault-audio://${note.file_path}`: If `file_path` is `recordings/uuid.wav`, Chromium interprets `recordings` as host and `/uuid.wav` as path, which complicates reconstructing the full relative path across platforms.
- `vault-audio:///${note.file_path}` (three slashes): Can result in empty hostname or unpredictable normalization in different Chromium versions.

---

## Decision 3: Audio Playback Engine in Renderer

### Decision
Use an HTML5 `Audio` instance (`HTMLAudioElement`) managed inside a dedicated React context (`AudioPlayerContext`) and encapsulated hook (`useAudioPlayer`).

### Rationale
- HTML5 `Audio` directly supports streaming media via custom schemes (`vault-audio://stream/...`), automatically issues HTTP Range requests for seeking, handles buffering and playback state events (`play`, `pause`, `timeupdate`, `ended`, `error`), and consumes minimal memory.
- Web Audio API (`AudioContext`) would require downloading the entire audio buffer (`fetch` -> `arrayBuffer()` -> `decodeAudioData()`) before playback can start, introducing noticeable latency for longer recordings and consuming substantial memory.

### Alternatives Considered
- Web Audio API (`AudioContext`): Unnecessary memory overhead and latency for simple playback/scrubbing; best reserved for DSP/visualizer waveforms.
- External audio library (Howler.js, Tone.js): Prohibited by Vault Constitution principle STACK SIMPLICITY (no third-party dependencies without architectural approval).

---

## Decision 4: Playback State Management Architecture

### Decision
Create an `AudioPlayerContext` (`src/renderer/context/AudioPlayerContext.tsx`) that owns the single `HTMLAudioElement` instance and exposes:
- `currentNote: NoteWithInstruments | null`
- `isPlaying: boolean`
- `currentTime: number`
- `duration: number`
- `play: (note: NoteWithInstruments) => void`
- `pause: () => void`
- `togglePlay: (note?: NoteWithInstruments) => void`
- `seek: (timeSeconds: number) => void`
- `error: string | null`

Wrap the application tree in `<AudioPlayerProvider>` inside `App.tsx` or `AppLayout.tsx`.

### Rationale
- Decouples playback logic and audio element lifecycle from UI view hierarchies.
- `TableRow` consumes `useAudioPlayer()` to render its play/pause toggle and identify if it is the currently playing row.
- `Header` consumes `useAudioPlayer()` to render the top-center scrubber time bar and duration indicators.
- Guarantees single-track playback at any time: playing a new note automatically pauses and replaces the previous audio source.

### Alternatives Considered
- Prop drilling through `AppLayout` -> `Header` and `AppLayout` -> `IdeasTable` -> `TableRow`: Clutters intermediate component interfaces and triggers unnecessary re-renders.
- Global singleton module outside React: Causes React component state desynchronization and makes testing difficult.

---

## Decision 5: Space Bar Keyboard Shortcut Isolation

### Decision
Implement global Space bar handling via a window `keydown` event listener in `AudioPlayerProvider` (or hook `useAudioKeyboardShortcut`), with strict guard checks:
1. Verify `event.code === 'Space' || event.key === ' '`.
2. Check if active target is editable:
   - `target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement`
   - `(target as HTMLElement).isContentEditable`
   - Active inline edit mode in table (`activeCellId !== null` or input element focused)
3. If inside an editable field, do nothing (allow normal space input).
4. If outside editable fields, call `event.preventDefault()` (to prevent page scrolling) and invoke `togglePlay()`.

### Rationale
- Completely avoids interfering with the inline metadata editor (Title, BPM, Key, Notes, Authors).
- Prevents annoying browser default scrolling behavior when Space is pressed.
- Delivers the expected fluid UX found in music applications (Ableton, Logic, Spotify).

### Alternatives Considered
- Attaching listener only to the table DOM element: Requires user to maintain explicit focus on the table, which breaks natural keyboard play/pause while glancing at the app.

---

## Decision 6: Top-Center Scrubber / Time Bar UI

### Decision
Build an `AudioTimeBar` component placed in `Header.tsx` (centered between the logo and import buttons):
- An accessible HTML `<input type="range">` styled with Tailwind CSS, showing playback progress.
- A duration counter on the right displaying formatted elapsed time and total duration (`formatDuration(currentTime) / formatDuration(duration)`).
- Visual states:
  - Inactive/Empty: subtle placeholder or disabled appearance when no note is loaded.
  - Active: clear track highlight, smooth progress thumb, interactive scrub and seek.
- Reuses `formatDuration` from `src/renderer/lib/format.ts`.

### Rationale
- Accessible, keyboard-navigable (`ArrowLeft`/`ArrowRight` scrubbing), zero extra dependencies, native drag support across desktop OSes.
- Centered header position matches Apple Music / Spotify desktop layouts.

### Alternatives Considered
- Custom drag-and-drop div element: Harder to make accessible; prone to pointer-capture edge cases.
