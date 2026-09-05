# Phase 1 Quickstart & Validation Guide: Ideas Table UI

**Feature**: `005-ideas-table-ui`  
**Date**: 2026-09-04  

---

## 1. Prerequisites

1. Working Node.js environment (v20+ or v24).
2. Existing test database with migrations applied.
3. Dependencies installed:
   ```bash
   npm install
   ```

---

## 2. Automated Test Execution

Run the complete test suite:
```bash
npm test
```
Expected: All existing tests (92 tests) plus new renderer tests pass cleanly (108+ total passing tests).

Run TypeScript strict checks across all configurations:
```bash
npx tsc --noEmit                          # Root project typecheck
npx tsc -p tsconfig.main.json --noEmit    # Main process typecheck
npx tsc -p tsconfig.renderer.json --noEmit # Renderer process typecheck
```

Build verification:
```bash
npm run build:main        # Compiles Electron main and preload
npm run build:renderer    # Builds React + Tailwind bundle via Vite
npm run build             # Runs both builds sequentially
```

---

## 3. End-to-End Visual Verification Scenarios

### Scenario 1: Initial App Launch & Ideas Tab
1. Launch the application:
   ```bash
   npm run dev:renderer &
   npm start
   ```
2. **Expectation**:
   - Window opens at 1000x700 with Apple-styled chrome.
   - Header shows "Vault" title on left, Theme toggle on right.
   - Segmented tab bar defaults to "Ideas" selected.
   - Table displays active ideas with columns: Title, Duration, BPM, Key, Authors, Section, Instruments, Created, Notes, and Archive action button.
   - Reserved bottom recording dock is visible with "Recording panel — coming soon".

### Scenario 2: Switching to Archive Tab
1. Click the "Archive" tab on the segmented control.
2. **Expectation**:
   - Tab highlight animates to "Archive".
   - Table updates to display only ideas with `is_used = 1`.
   - Action icon changes to a "Restore" button.

### Scenario 3: Toggling Idea Status (Move Between Tabs)
1. On the "Ideas" tab, click the Archive button on a row.
2. **Expectation**:
   - The row disappears immediately from the Ideas table.
   - Switching to the "Archive" tab displays the idea.
   - Clicking Restore on the Archive tab returns it to the Ideas tab.

### Scenario 4: Light and Dark Theme Toggle
1. Click the Sun/Moon icon in the top right corner.
2. **Expectation**:
   - UI instantly toggles between macOS Light and Dark mode appearances.
   - Background, cards, text, borders, and pills update according to defined Apple design tokens.
3. Quit and restart the application.
4. **Expectation**:
   - Stored theme preference (`vault_theme`) is restored from `localStorage`.
