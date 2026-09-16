# Quickstart: Packaging & Distributing Vault

**Feature**: Desktop Application Packaging for macOS and Windows (`015-app-packaging`)  
**Date**: 2026-09-16  
**Status**: Complete

This guide details step-by-step runnable procedures to validate packaging, asset generation, and standalone execution.

---

## Prerequisites

- Node.js 22+ installed
- macOS environment (for local macOS `.dmg` and `.zip` verification and `.icns` conversion)
- Windows environment or GitHub Actions (for Windows `.exe` verification)

---

## Scenario 1: Generate High-Resolution Platform Icons

Convert the source logo `assets/VaultLogo.png` into the native Apple Icon Image container `assets/VaultLogo.icns`.

```bash
# 1. Run icon generation script
bash scripts/generate-icns.sh

# 2. Verify files exist
ls -la assets/VaultLogo.*
```

**Expected Outcome**:
- `assets/VaultLogo.png` (source, present)
- `assets/VaultLogo.ico` (Windows icon, present)
- `assets/VaultLogo.icns` (generated macOS multi-res icon, present)

---

## Scenario 2: Build and Package Standalone Bundle (Local Platform)

Compile the main process, renderer assets, and package the application into a standalone folder.

```bash
# 1. Build and package application
npm run package

# 2. Verify packaged output directory
ls -la out/Vault-*
```

**Expected Outcome**:
- The output directory contains the complete standalone bundle (e.g. `out/Vault-darwin-arm64/Vault.app` on Apple Silicon macOS).
- `node_modules/better-sqlite3` is bundled with the compiled `.node` native binary.
- Source directories (`src/`, `specs/`, `docs/`) are excluded from the ASAR/bundle.

---

## Scenario 3: Launch Packaged Application Standalone

Verify that the packaged app launches without any local dev servers running.

```bash
# 1. Ensure no dev servers are running on localhost:5173
lsof -i :5173 || true

# 2. Launch the packaged application directly
open out/Vault-darwin-arm64/Vault.app
```

**Expected Outcome**:
- Vault opens immediately into the main catalog table.
- Dock displays the custom `VaultLogo` icon.
- Recording a new audio idea works and saves to `~/Library/Application Support/Vault/audio_vault/`.
- SQLite database initializes cleanly without any `NODE_MODULE_VERSION` ABI warnings.

---

## Scenario 4: Generate macOS Installers (`.dmg` and `.zip`)

Generate ready-to-share distributables for macOS.

```bash
# Generate installers
npm run make:mac

# Verify maker outputs
ls -la out/make/
```

**Expected Outcome**:
- `out/make/Vault-*.dmg` exists. Double-clicking mounts the disk image showing the Vault app icon alongside the Applications shortcut.
- `out/make/zip/darwin/.../Vault-*.zip` exists and expands cleanly to `Vault.app`.

---

## Scenario 5: Multi-Platform Cloud Packaging via GitHub Actions

Validate the cross-platform CI matrix workflow for generating both Windows and macOS installers.

1. Navigate to the repository on GitHub -> **Actions** tab.
2. Select **Package & Distribute** workflow.
3. Click **Run workflow** (`workflow_dispatch`).
4. Wait for both runners (`macos-latest` and `windows-latest`) to complete.
5. Download artifacts:
   - `Vault-macOS-arm64.zip` (contains `.dmg`)
   - `Vault-macOS-x64.zip` (contains `.dmg`)
   - `Vault-Windows-x64.zip` (contains `Vault-Setup.exe` and `.zip`)

**Expected Outcome**:
- Both macOS and Windows installers compile, package, and upload with 100% success rate.
