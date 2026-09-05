# Phase 0 Research: Ideas Table UI & Frontend Stack

**Feature**: `005-ideas-table-ui`  
**Date**: 2026-09-04  
**Context**: Setting up React, Vite, and Tailwind CSS for the Electron Renderer process, implementing the ideas catalog table, light/dark theming, and Apple-inspired visual design.

---

## 1. Frontend Build Tooling (Vite + React)

### Decision
Use **Vite** (`@vitejs/plugin-react`) configured with `root: 'src/renderer'` and `base: './'` to build the renderer bundle to `dist/renderer`.

### Rationale
- **Speed & Simplicity**: Instant Hot Module Replacement (HMR) in development and Rollup-based tree-shaken production bundling.
- **Electron Integration**: Works seamlessly with Electron's sandboxed BrowserWindow. In dev mode, Electron loads `http://localhost:5173`; in production, `mainWindow.loadFile('dist/renderer/index.html')`.
- **Constitutional Alignment**: Adheres strictly to *Stack Simplicity* (Electron, React, TypeScript, Tailwind, Node.js). Avoids heavy multi-page bundlers.

### Alternatives Considered
- *Webpack*: Mature but heavyweight, requires complex loaders for TypeScript, CSS, PostCSS, and React. Slower build times.
- *esbuild standalone*: Extremely fast but lacks first-class React HMR and CSS pipeline integration compared to Vite.

---

## 2. Styling System & Tailwind CSS Architecture

### Decision
Use **Tailwind CSS v3** with minimal PostCSS (executing `tailwindcss` plugin only, **without `autoprefixer`**) and `darkMode: 'class'`. Define semantic CSS variables in `@layer base` for Apple design system tokens.

### Rationale
- **Class-based dark mode**: Toggling `.dark` on `document.documentElement` controls the entire app styling predictably.
- **Tailwind v3 stability**: Fully compatible with Node.js and PostCSS in CommonJS/ESM hybrid Electron setups.
- **No Autoprefixer needed**: Electron targets a single known modern browser engine (Chromium 134+). Vendor prefixing for obsolete browsers is dead weight and is excluded to honor **Stack Simplicity**.
- **Dynamic semantic tokens**: Mapping CSS variables (`--color-surface-primary`, `--color-content-primary`, etc.) into Tailwind allows seamless theming without scattering duplicate utility overrides across components.

### Alternatives Considered
- *Include Autoprefixer*: Standard in web tutorials, but redundant for modern Electron apps.
- *Tailwind CSS v4*: In early release stages with alpha/beta Vite plugins that have known issues in Electron CommonJS/ESM interop.
- *CSS Modules / Styled Components*: Introduces runtime styling overhead or verbose CSS class mapping, violating *Stack Simplicity*.

---

## 3. Visual Design & Aesthetic Direction (Apple HIG & Frontend-Design Skill)

### Decision
Implement an authentic macOS/Apple desktop design language tailored for musicians cataloging voice memos and ideas:
- **Palette**:
  - Light: Canvas `#F5F5F7`, Surface `#FFFFFF`, Hover `#E8E8ED`, Hairline Border `#D2D2D7`, Text Primary `#1D1D1F`, Text Muted `#86868B`, System Accent `#007AFF`, Toggle Active `#34C759`.
  - Dark: Canvas `#1C1C1E`, Surface `#2C2C2E`, Hover `#3A3A3C`, Hairline Border `#38383A`, Text Primary `#F5F5F7`, Text Muted `#8E8E93`, System Accent `#0A84FF`, Toggle Active `#30D158`.
- **Typography**:
  - System font stack (`-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif`).
  - Strict typographic hierarchy: 17px window title, 12px uppercase table column headers, 13px tabular rows, 11px metadata tags. Tabular figures (`tabular-nums`) for BPM, duration, and dates.
- **Restraint & Anti-AI Clichés**:
  - No warm cream backgrounds, no harsh neon acid-greens, no oversized card shadows.
  - Flat table layout with subtle hairline rules, rounded segmented tab controls, and clean hover state feedback.

---

## 4. Data Layer & IPC Integration Pattern

### Decision
Create a custom React hook `useNotes(isUsed: 0 | 1)` that:
1. Calls `window.vaultAPI.notes.getAll({ is_used: isUsed })` to fetch filtered notes.
2. In parallel via `Promise.all`, calls `window.vaultAPI.notes.getById(note.id)` to enrich each note with its associated `Instrument[]`.
3. Exposes `{ notes, loading, error, refetch }`.

### Rationale
- The database schema and IPC contract established in Spec 001/003 separate `notes.getAll` (which returns base note attributes) and `notes.getById` (which joins `audio_note_instruments`).
- SQLite in-process execution is virtually instantaneous (<10ms for hundreds of notes), making client-side enrichment fast without requiring schema or IPC migrations in this spec.
- Provides immediate reactivity when toggling `is_used` status.

### Alternatives Considered
- *Add a new IPC channel `notes:getAllWithInstruments`*: Would require changing Main process IPC handlers, breaking Spec 003 contracts. Deferred to an optimization spec if large catalog scale (>5,000 notes) requires it.

---

## 5. Process Separation & Security Hardening

### Decision
- Renderer code lives strictly in `src/renderer/`.
- No Node.js `fs`, `path`, or `child_process` imports in Renderer.
- All OS and database capabilities flow through `window.vaultAPI` (Preload bridge).
- CSP configured in `src/renderer/index.html`: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'`.
