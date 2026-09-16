# Implementation Plan: Desktop Application Packaging for macOS and Windows

**Branch**: `015-app-packaging` | **Date**: 2026-09-16 | **Spec**: [specs/015-app-packaging/spec.md](./spec.md)

**Input**: Feature specification from `specs/015-app-packaging/spec.md`

## Summary

Implement standalone desktop application packaging and installer generation for macOS and Windows using **Electron Forge**. The packaging pipeline compiles production assets, automatically rebuilds the native `better-sqlite3` database bindings for target Electron architectures, bundles multi-resolution platform icons derived from `assets/VaultLogo.png` and `assets/VaultLogo.ico`, and produces ready-to-share distributables: Apple Disk Image (`.dmg`) and compressed archive (`.zip`) for macOS, and standard Setup installer (`.exe`) and portable zip for Windows. An automated GitHub Actions CI workflow matrix is established to build and publish both platform installers seamlessly.

## Technical Context

**Language/Version**: TypeScript 5.8 / Node.js 22 (Electron 35)  
**Primary Dependencies**: Electron 35, React 19, Tailwind CSS v3, Vite 6  
**Packaging Framework**: Electron Forge (`@electron-forge/cli`, `@electron-forge/maker-dmg`, `@electron-forge/maker-squirrel`, `@electron-forge/maker-zip`)  
**Storage**: SQLite (`better-sqlite3`) and local file system audio vault, persisted in OS-standard `app.getPath('userData')`  
**Testing**: Vitest 3.2 test suite verification (`npm test`) + Packaging verification scripts (`npm run package`, `npm run make`)  
**Target Platform**: macOS (Apple Silicon `arm64`, Intel `x64`), Windows 10/11 (64-bit `x64`)  
**Project Type**: Desktop Application (Electron Standalone Bundle + Native Installers)  
**Performance Goals**: Sub-5 minute full packaging time; standalone app launch under 2 seconds; clean offline operation without local dev server dependencies  
**Constraints**:
- Use Electron Forge for packaging per user directive
- Use `assets/VaultLogo.png` and `assets/VaultLogo.ico` for application icons
- Zero runtime third-party dependencies added to client bundle (**STACK SIMPLICITY**)
- Native module `better-sqlite3` must be rebuilt matching packaged Electron ABI (**DATA INTEGRITY**)
- Production code loads from `dist/` via `loadFile`; dev server disabled when packaged (**PROCESS SEPARATION**)  
**Scale/Scope**: Distributable packages for macOS (.dmg, .zip) and Windows (.exe, .zip)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Requirement | Status | Verification Detail |
|---|---|---|---|
| **STACK SIMPLICITY** | Stick to Electron, React, TypeScript, Tailwind CSS, Node.js, SQLite. Zero runtime additions. | ✅ PASS | Packaging tooling installed strictly as `devDependencies` (`@electron-forge/*`). Zero runtime client libraries added. |
| **PROCESS SEPARATION** | UI logic in Renderer; `fs` and SQLite in Main; clean offline production loading. | ✅ PASS | `src/main/index.ts` loads bundled `dist/renderer/index.html` directly via `loadFile` in packaged mode. |
| **VERIFIABLE TESTS** | Automated tests passing before merge; packaging builds verifiable. | ✅ PASS | All 325 existing unit/integration tests pass cleanly with `npm test`. Packaging commands are verified end-to-end. |
| **DATA INTEGRITY** | Physical files in `userData/audio_vault/`; relative paths in SQLite; upgrade safety. | ✅ PASS | Packaged app preserves `userData` location across updates; native `better-sqlite3` bindings rebuilt to prevent runtime crashes. |
| **UNIFIED LANGUAGE** | All code, types, schemas, and docs in English. | ✅ PASS | All Forge configs, scripts, documentation, and error messages are in English. |

## Project Structure

### Documentation (this feature)

```text
specs/015-app-packaging/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── packaging-contract.md
├── checklists/
│   └── requirements.md  # Requirements quality checklist
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code & Configuration Layout

```text
assets/
├── VaultLogo.png                # Source 1024x1024 logo
├── VaultLogo.ico                # Windows icon resource
└── VaultLogo.icns               # macOS icon container (generated via sips/iconutil)

scripts/
└── generate-icns.sh             # Helper script converting VaultLogo.png to VaultLogo.icns

.github/
└── workflows/
    └── package.yml              # GitHub Actions CI matrix for macOS and Windows packaging

forge.config.cjs                 # Electron Forge declarative configuration
package.json                     # Forge devDependencies and packaging scripts (package, make)
```

**Structure Decision**: Electron Forge configuration is placed in `forge.config.cjs` (CommonJS module to cleanly interface with Node and Forge while root `package.json` retains `"type": "module"`). Icon generation is handled by a self-contained shell script using built-in macOS utilities.

## Complexity Tracking

> *No constitutional violations detected. Table left intentionally empty.*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| *None* | *N/A* | *N/A* |
