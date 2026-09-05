# Implementation Plan: Ideas Table UI

**Branch**: `005-ideas-table-ui` | **Date**: 2026-09-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-ideas-table-ui/spec.md` requesting a basic desktop app interface displaying music ideas in a tabbed table (active unused ideas vs archived used ideas), visible metadata labels, light/dark mode toggle, Apple-like minimal design system, and reserved bottom recording area.

---

## Summary

Build the complete frontend renderer infrastructure (React 19, Vite, Tailwind CSS v3) and deliver the Ideas Table UI inside the Electron Renderer process (`src/renderer`). The interface presents musical ideas partitioned into "Ideas" and "Archive" tabs, displays all stored metadata attributes (Title, Duration, BPM, Key, Authors, Song Section, Instruments, Created Date, and Notes), provides a per-row toggle to switch used status, supports persistent light and dark themes styled according to Apple Human Interface Guidelines (SF Pro / system fonts, generous whitespace, hairline borders, restrained palette), and reserves a fixed bottom dock for future recording controls.

---

## Technical Context

**Language/Version**: TypeScript 5.5 (strict mode, ES2022, React JSX)  
**Primary Dependencies**: Electron 35, React 19, Tailwind CSS v3.4, Vite 6, better-sqlite3 11.8, Node.js v24  
**Frontend Bundler**: Vite (`@vitejs/plugin-react`) with root `src/renderer` outputting to `dist/renderer`  
**Storage**: SQLite (`vault.db`) via IPC + `localStorage` for theme preference (`vault_theme`)  
**Testing**: Vitest 3.2 + jsdom + `@testing-library/react` (`npm test`)  
**Target Platform**: Desktop (macOS, Windows, Linux)  
**Project Type**: Electron Desktop Application (React Renderer + Node/Electron Main)  
**Performance Goals**: Table loads in <1s, tab switching instant, theme switching instant with zero layout shift  
**Constraints**: Zero `fs`, `path`, or Node.js imports in Renderer; strict typed IPC contracts with `IPCResult<T>`; zero `any` usage; Apple design system aesthetics.  
**Scale/Scope**: Browsable and filterable table supporting 100+ ideas without rendering lag; light/dark theming; reserved layout dock.

---

## Constitution Check

*GATE: Must pass before implementation.*

| Principle | Requirement | Status | Verification |
|---|---|---|---|
| **STACK SIMPLICITY** | Stick strictly to Electron, React, TypeScript, Tailwind, Node, SQLite. No unapproved dependencies. | ✅ PASS | Uses React 19, Tailwind CSS v3, Vite, and standard browser Web APIs. No third-party UI libraries, component kits, or state management bloat. |
| **PROCESS SEPARATION** | UI logic strictly in Renderer; disk/SQLite access strictly in Main via IPC and Preload. | ✅ PASS | Renderer consumes capabilities exclusively through `window.vaultAPI` (`notes.getAll`, `notes.getById`, `notes.update`). Zero `fs` or direct SQLite calls in Renderer. |
| **VERIFIABLE TESTS** | Automated tests passing cleanly before merge. | ✅ PASS | Unit and component tests for format utilities, ThemeContext, TabBar, and EmptyState, plus full suite regression (92 existing + new renderer tests = 108+ total). |
| **DATA INTEGRITY** | Audio files on local filesystem. SQLite stores relative paths only. | ✅ PASS | UI only displays metadata and updates `is_used` status; physical file paths remain isolated and relative in database. |
| **UNIFIED LANGUAGE** | English for all code, types, comments, docs, commits. | ✅ PASS | All code, types, UI labels, comments, and documentation in English. |

*Gate outcome: All 5 constitutional principles pass without violations.*

---

## Project Structure

### Documentation (this feature)

```text
specs/005-ideas-table-ui/
├── spec.md                       # Feature specification & clarifications
├── plan.md                       # This implementation plan (/speckit-plan command output)
├── research.md                   # Phase 0: Vite, React, Tailwind, Apple design decisions
├── data-model.md                 # Phase 1: View models, column mappings, state machine
├── contracts/
│   └── ui-contracts.md           # Phase 1: Bridge interfaces & component props contracts
├── quickstart.md                 # Phase 1: End-to-end verification scenarios
├── checklists/
│   ├── requirements.md           # Spec quality checklist (12/12 passing)
│   └── ui-completeness.md        # UI completeness review checklist (CHK001–CHK018)
└── tasks.md                      # Phase 2: Actionable task list
```

### Source Code Architecture

```text
src/
├── main/
│   └── index.ts                           # [MODIFY] Load Vite dev server URL or built HTML
├── shared/                                # Existing contracts (@shared)
├── renderer/
│   ├── index.html                         # [NEW] HTML entry point with CSP
│   ├── index.tsx                          # [NEW] React root bootstrap (createRoot)
│   ├── App.tsx                            # [NEW] App root with ThemeProvider
│   ├── test-setup.ts                      # [NEW] jsdom test setup with jest-dom
│   ├── styles/
│   │   └── index.css                      # [NEW] Tailwind directives & Apple theme variables
│   ├── context/
│   │   ├── ThemeContext.tsx               # [NEW] Light/Dark theme provider with localStorage
│   │   └── __tests__/
│   │       └── ThemeContext.test.tsx      # [NEW] ThemeContext tests
│   ├── lib/
│   │   ├── format.ts                      # [NEW] formatDuration and formatDate utilities
│   │   └── __tests__/
│   │       └── format.test.ts             # [NEW] Formatting unit tests
│   ├── hooks/
│   │   └── useNotes.ts                    # [NEW] Data fetching hook (getAll + getById instruments)
│   └── components/
│       ├── AppLayout.tsx                  # [NEW] Shell layout (Header, Content, RecordingPanel)
│       ├── Header.tsx                     # [NEW] App header bar with Vault title
│       ├── ThemeToggle.tsx                # [NEW] Sun/Moon toggle button
│       ├── TabBar.tsx                     # [NEW] Apple-style segmented Ideas/Archive tabs
│       ├── IdeasTable.tsx                 # [NEW] Main table with columns & empty state
│       ├── TableRow.tsx                   # [NEW] Individual row with metadata and toggle
│       ├── EmptyState.tsx                 # [NEW] Friendly empty state for tabs
│       ├── RecordingPanel.tsx             # [NEW] Reserved bottom area placeholder
│       └── __tests__/
│           ├── TabBar.test.tsx            # [NEW] TabBar unit tests
│           └── EmptyState.test.tsx        # [NEW] EmptyState unit tests
├── vite.config.ts                         # [NEW] Vite bundler configuration
├── tailwind.config.cjs                    # [NEW] Tailwind CSS v3 configuration
├── postcss.config.cjs                     # [NEW] PostCSS configuration
└── tsconfig.renderer.json                 # [NEW] TypeScript config for Renderer (JSX + DOM)
```

**Structure Decision**: A clean Electron two-process structure. `src/main` handles window lifecycles and IPC, `src/preload` exposes the typed bridge, `src/renderer` hosts the React single-page application bundled by Vite, and `src/shared` provides universal contracts.

---

## Complexity Tracking

> **No constitutional violations detected. Table intentionally empty.**
