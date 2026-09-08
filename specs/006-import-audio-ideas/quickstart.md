# Quickstart & Validation Guide: Audio Ideas Import

**Feature**: `006-import-audio-ideas`  
**Date**: 2026-09-08  
**Status**: Completed  

---

## 1. Automated Test Suite Execution

Run all unit and integration tests covering the import functionality:

```bash
# Run complete test suite (includes audio header, storage service, IPC, and UI components)
npm test

# Run specifically the new audio import tests
npx vitest run src/main/ipc/__tests__/import-handlers.test.ts src/renderer/components/__tests__/CircularProgressModal.test.tsx
```

### Expected Output
- All tests pass (100% pass rate).
- Zero TypeScript diagnostics:
  ```bash
  npx tsc --noEmit && npx tsc -p tsconfig.main.json --noEmit && npx tsc -p tsconfig.renderer.json --noEmit
  ```

---

## 2. End-to-End Manual Validation Scenarios

### Scenario 1: Drag-and-Drop Single Audio File
1. **Setup**: Create or locate a test audio file on your desktop (e.g. `riff-idea.wav`).
2. **Action**: Open Vault (`npm run dev`). Drag `riff-idea.wav` from Finder / File Explorer over the Vault window.
3. **Observation**:
   - Vault displays the dashed drop overlay.
   - Upon releasing the mouse, the `<CircularProgressModal />` appears showing the loading circle advancing smoothly to `100%`.
   - The modal dismisses, and a new row appears in the "Ideas" table with title `riff-idea`, correct duration, and `is_used = 0`.
4. **Source Verification**: Check the original `riff-idea.wav` on the desktop. Verify it is still present, unmodified, with identical file size and modification date.

---

### Scenario 2: Option Bar / Header Import Button
1. **Action**: Click the "Import" button in the Vault header.
2. **Observation**: The operating system native file open dialog appears with filter set to audio files (`.wav`, `.mp3`, `.m4a`, `.ogg`, `.flac`).
3. **Action**: Select one or more files and click "Open".
4. **Observation**: Circular progress modal animates from 0% to 100%. The table updates with all newly imported ideas.
5. **Action**: Click "Import" again, but click "Cancel" in the file dialog.
6. **Observation**: No modal appears, no errors are logged, and the table remains unchanged.

---

### Scenario 3: Batch Multi-File Import with Progress
1. **Setup**: Select 4 audio files (`test1.wav`, `test2.mp3`, `test3.flac`, `test4.ogg`).
2. **Action**: Drag and drop all 4 files simultaneously into Vault.
3. **Observation**:
   - The circular progress indicator shows cumulative progress advancing across the batch (e.g., `25%` -> `50%` -> `75%` -> `100%`).
   - The label indicates `"Importing 2 of 4 files..."`.
   - Upon reaching 100%, all 4 files appear in the Ideas table.
   - All 4 original files remain untouched on the source disk.

---

### Scenario 4: Unsupported File Type Rejection
1. **Action**: Drag a text file (`document.txt`) or image (`picture.png`) onto Vault.
2. **Observation**:
   - The application does not crash.
   - A friendly alert or error toast notifies the user: `"Unsupported format. Supported audio formats are: WAV, MP3, M4A, OGG, FLAC"`.
   - No rows are created in the database.
