# Research: Audio Ideas Import

**Feature**: `006-import-audio-ideas`  
**Date**: 2026-09-08  
**Status**: Completed  

---

## 1. Drag-and-Drop & File Path Acquisition in Electron Sandbox

### Context
Vault runs with `sandbox: true`, `contextIsolation: true`, and `nodeIntegration: false` in the Renderer process. When a user drags and drops files onto the window, we must acquire the file data and its source file system path to copy the original file into the application's internal audio storage without modifying or removing the original.

### Decision
Use native HTML5 Drag and Drop events (`dragenter`, `dragover`, `dragleave`, `drop`) on a top-level window/app listener, coupled with Electron's official `webUtils.getPathForFile(file)` exposed securely through the preload bridge (`window.vaultAPI.getPathForFile`).

### Rationale
- `webUtils.getPathForFile(file)` is Electron's designated, secure replacement for the deprecated `file.path` property in sandboxed environments.
- Passing the physical `sourcePath` directly to the Main process allows `AudioStorageService.importFile(sourcePath)` to perform an atomic, high-performance file copy on disk (`fs.copyFileSync`) without needing to serialize multi-megabyte binary payloads across the IPC boundary.
- If `getPathForFile` returns an empty string (e.g. in headless unit tests or synthetic files), the system gracefully falls back to reading the `ArrayBuffer` via `file.arrayBuffer()` and transmitting it via the existing `notes:create` audio buffer channel.

### Alternatives Considered
- **Pure binary streaming over IPC**: Reading `await file.arrayBuffer()` for every file and transferring the entire buffer across IPC. *Rejected as primary approach*: Transmitting large audio files (e.g. 100MB+ WAV) across IPC causes unnecessary RAM bloat and garbage collection pauses when disk-to-disk copy (`fs.copyFileSync`) is orders of magnitude faster and zero-overhead.
- **Renderer-level direct `fs` calls**: *Rejected*: Violates the **PROCESS SEPARATION** constitutional principle.

---

## 2. Option Bar Import Mechanism

### Context
Musicians need an accessible, conventional option in the header/option bar to trigger file selection without using drag-and-drop.

### Decision
Implement a dual-trigger architecture:
1. In the header bar, add an "Import" button that triggers a hidden HTML5 `<input type="file" multiple accept=".wav,.mp3,.m4a,.ogg,.flac" />`.
2. Augment the preload bridge with an optional `dialog.showOpenDialog` wrapper (`vaultAPI.openFileDialog`) via IPC channel `IPC_CHANNELS.AUDIO.OPEN_FILE_DIALOG`.

### Rationale
- `<input type="file">` automatically triggers the operating system's native file picker in Electron, restricted to `.wav, .mp3, .m4a, .ogg, .flac`.
- The `change` event from `<input type="file">` yields standard `File` objects identical to those produced by the Drag and Drop `drop` event, allowing both entry points to funnel through a single, unified import pipeline.
- Exposing `dialog.showOpenDialog` over IPC provides programmatic backup and ensures complete native OS dialog styling across macOS, Windows, and Linux.

### Alternatives Considered
- **Separate code paths for Drag & Drop vs Dialog**: *Rejected*: Maintaining two separate ingestion pipelines introduces duplication and increases testing surface. Unifying around an `AudioFileItem` abstraction ensures consistent behavior.

---

## 3. Audio Duration & Metadata Extraction

### Context
When importing external audio files, Vault must record the exact duration in seconds. Per the project constitution:
> *"Audio duration and peak calculation for visual waveforms must be extracted at capture time within the Renderer via the Web Audio API prior to dispatching creation payloads to Main."*

### Decision
Extract audio duration in the Renderer process using lightweight HTML5 `Audio` metadata decoding:
```typescript
export async function extractAudioDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio();
    const objectUrl = URL.createObjectURL(file);
    audio.src = objectUrl;

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
      audio.removeAttribute('src');
    };

    audio.onloadedmetadata = () => {
      const duration = isFinite(audio.duration) ? audio.duration : 0;
      cleanup();
      resolve(duration);
    };

    audio.onerror = () => {
      cleanup();
      resolve(0); // Fallback if format container cannot be parsed
    };
  });
}
```

### Rationale
- **Zero Dependencies (STACK SIMPLICITY)**: Pure native browser API built into Chromium. No external npm packages (like `music-metadata` or `node-id3`) required.
- **Fast & Memory-Efficient**: `loadedmetadata` inspects only the audio container header and duration tracks, avoiding decoding entire multi-channel PCM streams into RAM.
- **Broad Format Support**: Chromium natively parses headers for WAV, MP3, M4A/AAC, OGG Vorbis, and FLAC.
- **Test-Friendly**: Can be easily mocked in Vitest/jsdom unit tests by configuring `window.Audio`.

### Alternatives Considered
- **Web Audio API `decodeAudioData`**: *Rejected*: Requires decompressing the entire audio file into PCM samples in memory. For a 200MB file, this consumes ~1GB of RAM just to read duration.
- **Node.js Main Process Header Parsers**: *Rejected*: Node has no built-in duration parser for MP3/M4A/OGG/FLAC. Parsing variable-bitrate MP3 or MP4 atoms without third-party dependencies is complex, fragile, and violates Process Separation.

---

## 4. Circular Progress Indicator & Multi-File Batching

### Context
Users require visual progress feedback showing the exact loading percentage (0% to 100%) during single or multi-file imports.

### Decision
Create a specialized, reusable `<CircularProgressModal />` component built with SVG:
- An animated SVG circular stroke using `stroke-dasharray` and `stroke-dashoffset`.
- Center-aligned typography showing the current integer percentage (e.g. `45%`), current filename, and batch status (`Importing 3 of 8 ideas...`).
- Batch progress calculation:
  $$\text{Progress} = \frac{(i - 1) + \text{fileFraction}}{N} \times 100\%$$
  where each file transitions through structured stages (Reading $\rightarrow$ Validating $\rightarrow$ Copying $\rightarrow$ Registering) so single large files also show smooth incremental progress.
- Clean dismiss: At 100%, display a brief checkmark animation (350ms) before cleanly unmounting.

### Rationale
- Pure Tailwind CSS + SVG implementation aligns with Apple Human Interface Guidelines (clean, minimal, translucent backdrop blur).
- Provides immediate visual feedback to the user, preventing repeated drag attempts or window closures during large operations.

### Alternatives Considered
- **Simple indeterminate spinner**: *Rejected*: User explicitly requested a loading circle with numeric percentage display.
- **Linear horizontal progress bar**: *Rejected*: Does not satisfy the user's specific request for a "loading circle showing the load percentage".

---

## 5. File Naming & Deduplication Strategy

### Context
Imported audio files should default to meaningful idea titles, while preserving disk uniqueness and ensuring original files are never altered.

### Decision
1. **Title Derivation**: Strip the extension from the source filename (e.g., `Bridge Riff Take 2.wav` $\rightarrow$ `Bridge Riff Take 2`). Trim whitespace. If empty, fall back to atomic monotonic naming (`idea-N`).
2. **Disk Copy**: Handled exclusively by `AudioStorageService.importFile(sourcePath)`. It generates a UUID filename (`recordings/{uuid}.{format}`) inside `audio_vault/` and copies the source using `fs.copyFileSync`.
3. **Source Integrity**: Zero operations touch the source file descriptor for write/unlink. Source file remains 100% untouched.

### Rationale
- Familiar and intuitive for musicians who name their demo files on their DAW or voice recorder.
- Guarantees zero namespace collisions on disk even if multiple files with the same name are imported.
