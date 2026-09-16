# Vault Distribution Guide

This guide explains how to package, distribute, and run Vault across **macOS** and **Windows**, including instructions for local builds, GitHub Actions cloud builds, and handling operating system security prompts.

---

## 1. Local Packaging Commands

All packaging commands automatically compile both the main process and Vite renderer bundles prior to packaging.

### Build and Package (Host Platform Folder)
```bash
npm run package
```
Generates a standalone unpacked folder in `out/Vault-{platform}-{arch}/` (e.g. `out/Vault-darwin-arm64/Vault.app` on Apple Silicon).

### Generate Platform Installers (Host Platform)
```bash
npm run make
```
Generates distribution packages for your current operating system in `out/make/`.

### Generate macOS Distributables (`.dmg` & `.zip`)
```bash
npm run make:mac
```
Produces:
- `out/make/Vault.dmg`: Apple Disk Image installer with drag-to-Applications layout.
- `out/make/zip/darwin/{arch}/Vault-darwin-{arch}-{version}.zip`: Compressed standalone app bundle.

### Generate Windows Distributables (`.exe` & `.zip`)
```bash
npm run make:win
```
Produces:
- `out/make/squirrel.windows/x64/Vault-Setup.exe`: Standard Windows installer with desktop and Start Menu shortcuts.
- `out/make/zip/win32/x64/Vault-win32-x64-{version}.zip`: Portable executable package.

*(Note: Building Windows native binaries with C++ extensions like `better-sqlite3` from a macOS host can encounter platform toolchain limits. For Windows builds, use a Windows environment or the GitHub Actions workflow below).*

---

## 2. Automated Cloud Builds (GitHub Actions)

Vault includes a preconfigured multi-platform CI workflow at `.github/workflows/package.yml`.

### How to Trigger Cloud Builds:
1. Push your changes to GitHub.
2. In your repository, click the **Actions** tab.
3. Select **Package & Distribute** in the left sidebar.
4. Click **Run workflow** -> **Run workflow** (`workflow_dispatch`), or push a git tag formatted as `v*` (e.g. `git tag v0.1.0 && git push origin v0.1.0`).
5. The workflow concurrently runs on:
   - `macos-latest` (building macOS DMG and ZIP)
   - `windows-latest` (building Windows Setup.exe and ZIP)
6. Once completed, download the distributables directly from the workflow run artifacts summary.

---

## 3. Sharing & Opening Unsigned Builds

Because early builds and shared test versions are distributed without expensive commercial EV code signing certificates, modern operating systems display security warnings. Provide these instructions to recipients:

### macOS Gatekeeper Instructions
When double-clicking the app for the first time, macOS may display:  
> *"Vault" cannot be opened because the developer cannot be verified.*

**How to open:**
1. Open **Finder** and navigate to your `/Applications` folder.
2. **Right-click** (or Control-click) on `Vault.app` and choose **Open**.
3. In the security dialog that appears, click the **Open** button.  
*(This only needs to be done once; subsequent launches open normally).*

**Terminal Alternative (for developers):**
```bash
xattr -cr /Applications/Vault.app
```

### Windows SmartScreen Instructions
When running `Vault-Setup.exe` or `Vault.exe`, Microsoft Defender SmartScreen may display:  
> *Windows protected your PC — Microsoft Defender SmartScreen prevented an unrecognized app from starting.*

**How to open:**
1. Click the **More info** link inside the warning dialog.
2. Click the **Run anyway** button at the bottom.

---

## 4. User Data & Upgrade Safety

- **macOS User Data**: `~/Library/Application Support/Vault/`
- **Windows User Data**: `%APPDATA%\Vault\`

The application's local SQLite database (`vault.db`) and recorded audio files (`audio_vault/`) are stored strictly inside the OS user data directory. Installing updated versions of Vault in the future preserves all existing user recordings and metadata with zero data loss.
