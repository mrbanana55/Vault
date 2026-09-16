# Technical Research: Desktop Application Packaging (Electron Forge)

**Feature**: Desktop Application Packaging for macOS and Windows (`015-app-packaging`)  
**Date**: 2026-09-16  
**Status**: Completed

---

## 1. Packaging Tooling Selection

### Decision
Use **Electron Forge** (`@electron-forge/cli` v7.11.x) with targeted makers:
- `@electron-forge/maker-dmg`: Generates Apple Disk Image (`.dmg`) drag-to-Applications installers on macOS.
- `@electron-forge/maker-zip`: Generates portable `.zip` archives for macOS and Windows.
- `@electron-forge/maker-squirrel`: Generates standard Windows installer executables (`Setup.exe` with desktop/start menu shortcuts).

### Rationale
- **User Directive**: Explicitly requested Electron Forge.
- **First-Party Support**: Electron Forge is the official packaging and distribution framework maintained directly by the Electron core team.
- **Native Rebuild Integration**: Electron Forge integrates natively with `@electron/rebuild` (already present in `devDependencies`). During the package phase, Forge automatically invokes `@electron/rebuild` targeting the packaged Electron version and architecture without requiring external custom scripts.
- **Modularity**: Forge makers are decoupled packages; adding or switching makers (e.g. WiX, Squirrel, DMG, Flatpak) requires only configuration adjustments.

### Alternatives Considered
- **`electron-builder`**: Highly capable and popular, but rejected because user explicitly requested Electron Forge.
- **Raw `electron-packager`**: Simpler primitive, but lacks built-in maker plugins for generating installer formats (`.dmg`, `.exe` setup wizards) and requires writing custom installer logic.

---

## 2. Platform Makers & Target Configurations

### Decision
Configure two maker targets in `forge.config.js`:

#### macOS (`darwin`):
1. **`@electron-forge/maker-dmg`**:
   - `name`: `Vault`
   - `icon`: `./assets/VaultLogo.icns`
   - Provides the standard macOS drag-and-drop window layout (Vault app on the left, `/Applications` folder alias on the right).
2. **`@electron-forge/maker-zip`**:
   - `platforms`: `['darwin']`
   - Produces a `.zip` archive containing the `.app` bundle for direct extraction or automated distribution.

#### Windows (`win32`):
1. **`@electron-forge/maker-squirrel`**:
   - `name`: `vault`
   - `setupExe`: `Vault-Setup.exe`
   - `setupIcon`: `./assets/VaultLogo.ico`
   - `iconUrl`: URL or path to `.ico` for shortcuts.
   - Installs to per-user AppData directory without requiring UAC admin privileges.
2. **`@electron-forge/maker-zip`**:
   - `platforms`: `['win32']`
   - Produces a portable `.zip` containing `Vault.exe` and runtime libraries for users who cannot run setup installers.

### Rationale
- Covers both standard installer workflows (DMG on macOS, Squirrel setup on Windows) and lightweight portable zip archives for both operating systems.
- Meets all requirements in [spec.md](./spec.md) (FR-001 through FR-007).

### Alternatives Considered
- **`@electron-forge/maker-wix` (Windows MSI)**: Requires WiX Toolset installed on the Windows host. Squirrel is more standard for Electron desktop applications and creates lightweight per-user installers.

---

## 3. Native Module Bundling (`better-sqlite3`)

### Decision
Configure Forge's `rebuildConfig` with:
```javascript
rebuildConfig: {
  onlyModules: ['better-sqlite3']
}
```
And ensure Forge bundles the rebuilt native `.node` binary into `node_modules/better-sqlite3/build/Release/better_sqlite3.node`.

### Rationale
- `better-sqlite3` is a compiled C++ Node.js addon. As experienced earlier, loading a native module compiled for system Node (ABI 137) in Electron (ABI 133) crashes the app.
- Electron Forge inspects dependencies and invokes `@electron/rebuild` automatically during `forge package` and `forge make`.
- Pinned `onlyModules: ['better-sqlite3']` prevents Forge from scanning or attempting to recompile non-native dependencies, reducing build times.

### Alternatives Considered
- **Pre-packaging manual rebuild**: Running `npm run rebuild` before packaging. While good as a pre-step, relying solely on manual rebuilds is error-prone when targeting different architectures (e.g. cross-packaging x64 from arm64). Forge's internal rebuild handler guarantees alignment with target Electron arch.

---

## 4. Package File Inclusion and Size Optimization

### Decision
Use `packagerConfig.ignore` to exclude development-only files and directories:
- Exclude `src/`, `specs/`, `docs/`, `.specify/`, `.agents/`, `.git/`, `.github/`
- Exclude `tsconfig*.json`, `vite.config.ts`, `tailwind.config.cjs`, `postcss.config.cjs`, `vitest.config.ts`
- Exclude dev-only dotfiles (`.DS_Store`, `.editorconfig`)
- Explicitly include:
  - `dist/` (contains compiled `main`, `preload`, and Vite `renderer` bundles)
  - `package.json`
  - `node_modules/` (production dependencies including `better-sqlite3`)

### Rationale
- The application runtime loads exclusively from `dist/main/index.js`, `dist/preload/index.js`, and `dist/renderer/index.html`.
- Packaging raw TypeScript sources, markdown specs, test suites, and build configs bloats the installer by 100+ MB with zero runtime benefit.

### Alternatives Considered
- **Packaging entire workspace**: Simplest to configure, but creates bloated, messy application bundles containing internal specs, unit test suites, and raw source code.

---

## 5. Platform Icons & Asset Pipeline

### Decision
- **Source Assets**:
  - Windows: Use existing `assets/VaultLogo.ico` (36KB).
  - macOS: Generate `assets/VaultLogo.icns` from `assets/VaultLogo.png` (427KB) using macOS native utilities `sips` and `iconutil` via a helper script `scripts/generate-icns.sh`.
  - Web / Window header: Use existing `assets/VaultLogo.png`.
- In `packagerConfig`:
  - Set `icon: './assets/VaultLogo'` (without file extension).
  - Electron Packager automatically resolves `.icns` on macOS, `.ico` on Windows, and `.png` on Linux.

### Rationale
- macOS `.app` bundles strictly require the Apple `.icns` container format to render crisp icons at all Retina resolutions (16x16 up to 1024x1024).
- Windows strictly requires the `.ico` container format.
- Supplying the base path `./assets/VaultLogo` allows Electron Packager to resolve the platform-appropriate format automatically without branching config logic.

### Alternatives Considered
- **Third-party npm icon conversion libraries (`png2icons`, `icon-gen`)**: Rejected to uphold **STACK SIMPLICITY**. macOS has built-in `sips` and `iconutil` that produce Apple-certified `.icns` files without adding heavy npm dependencies.

---

## 6. Cross-Platform Build & CI Automation

### Decision
1. **Local Commands**:
   - `npm run package`: Runs `npm run build` and packages for current platform.
   - `npm run make`: Runs `npm run build` and produces installers for current platform.
   - `npm run make:mac`: Explicitly builds macOS `.dmg` and `.zip`.
   - `npm run make:win`: Explicitly builds Windows `.exe` and `.zip`.
2. **Automated Multi-Platform CI Workflow**:
   - Create `.github/workflows/package.yml` using a GitHub Actions matrix (`macos-latest` and `windows-latest`).
   - Generates native macOS (`.dmg`, `.zip`) on macOS runners and native Windows (`Setup.exe`, `.zip`) on Windows runners.
   - Uploads distributable artifacts to GitHub Actions workflow run artifacts or release draft.

### Rationale
- Native C++ modules like `better-sqlite3` require the Windows C++ Build Tools and Windows SDK to compile `better_sqlite3.node` for Windows. Cross-compiling Windows native C++ binaries from a macOS host without Wine/cross-compilers is notoriously fragile.
- Having local commands for host packaging plus a standard GitHub Actions workflow gives the developer an immediate, reliable way to produce authentic Windows and macOS packages simultaneously.

### Alternatives Considered
- **Cross-compiling Windows on macOS via Wine/Docker**: Extremely slow, requires installing multi-gigabyte Wine and Windows SDK toolchains locally, and frequently breaks native node bindings. A GitHub Actions runner is cleaner, zero-cost, and completely authentic.
