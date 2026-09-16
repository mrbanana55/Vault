# Packaging & Distribution Contracts

**Feature**: Desktop Application Packaging for macOS and Windows (`015-app-packaging`)  
**Date**: 2026-09-16  
**Status**: Draft

---

## 1. CLI Commands & NPM Scripts Contract

The project exposes standard packaging scripts in `package.json`:

```json
{
  "scripts": {
    "package": "npm run build && electron-forge package",
    "make": "npm run build && electron-forge make",
    "make:mac": "npm run build && electron-forge make --platform=darwin",
    "make:win": "npm run build && electron-forge make --platform=win32"
  }
}
```

### Script Execution Expectations

| Command | Pre-requisite | Output Directory | Result Artifacts |
|---|---|---|---|
| `npm run package` | `build:main`, `build:renderer` | `out/Vault-{platform}-{arch}/` | Packaged standalone application bundle |
| `npm run make` | `build:main`, `build:renderer` | `out/make/` | Platform-specific installer(s) for current host OS |
| `npm run make:mac` | `build:main`, `build:renderer` | `out/make/` | `.dmg` installer and `.zip` archive for macOS |
| `npm run make:win` | `build:main`, `build:renderer` | `out/make/` | `Setup.exe` installer and `.zip` archive for Windows |

---

## 2. Forge Configuration Contract (`forge.config.cjs`)

The Forge configuration file must satisfy the following declarative structure:

```javascript
/** @type {import('@electron-forge/shared-types').ForgeConfig} */
module.exports = {
  packagerConfig: {
    name: 'Vault',
    executableName: 'Vault',
    appBundleId: 'com.vault.app',
    icon: './assets/VaultLogo',
    asar: {
      unpack: '**/better-sqlite3/**'
    },
    ignore: [
      /^\/src($|\/)/,
      /^\/specs($|\/)/,
      /^\/docs($|\/)/,
      /^\/\.specify($|\/)/,
      /^\/\.agents($|\/)/,
      /^\/\.github($|\/)/,
      /^\/tsconfig.*\.json$/,
      /^\/vite\.config\.ts$/,
      /^\/vitest\.config\.ts$/,
      /^\/tailwind\.config\.cjs$/,
      /^\/postcss\.config\.cjs$/
    ]
  },
  rebuildConfig: {
    onlyModules: ['better-sqlite3']
  },
  makers: [
    {
      name: '@electron-forge/maker-dmg',
      config: {
        name: 'Vault',
        icon: './assets/VaultLogo.icns'
      }
    },
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'vault',
        setupExe: 'Vault-Setup.exe',
        setupIcon: './assets/VaultLogo.ico'
      }
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin', 'win32']
    }
  ]
};
```

---

## 3. GitHub Actions CI Matrix Contract (`.github/workflows/package.yml`)

For automated cloud generation of both macOS and Windows installers:

```yaml
name: Package & Distribute

on:
  workflow_dispatch:
  push:
    tags:
      - 'v*'

jobs:
  build:
    name: Build on ${{ matrix.os }} (${{ matrix.arch }})
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        include:
          - os: macos-latest
            arch: arm64
            target_cmd: npm run make:mac -- --arch=arm64
            artifact_name: Vault-macOS-arm64
          - os: macos-latest
            arch: x64
            target_cmd: npm run make:mac -- --arch=x64
            artifact_name: Vault-macOS-x64
          - os: windows-latest
            arch: x64
            target_cmd: npm run make:win -- --arch=x64
            artifact_name: Vault-Windows-x64

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build and Package
        run: ${{ matrix.target_cmd }}

      - name: Upload Distributable Artifacts
        uses: actions/upload-artifact@v4
        with:
          name: ${{ matrix.artifact_name }}
          path: out/make/**/*
```

---

## 4. Unsigned Security Bypass Contract (User Instructions)

Because packages may be distributed without commercial EV/Apple Developer certificates, user-facing instructions must accompany distributed artifacts:

### macOS Gatekeeper
- **Symptom**: `"Vault" cannot be opened because the developer cannot be verified.`
- **Bypass Procedure**:
  1. In Finder, navigate to `/Applications`.
  2. Right-click (Control-click) on `Vault.app` and choose **Open**.
  3. In the warning dialog, click **Open**.
  *(Alternatively in Terminal: `xattr -cr /Applications/Vault.app`)*

### Windows SmartScreen
- **Symptom**: `Windows protected your PC — Microsoft Defender SmartScreen prevented an unrecognized app from starting.`
- **Bypass Procedure**:
  1. Click the **More info** link inside the warning card.
  2. Click the **Run anyway** button that appears.
