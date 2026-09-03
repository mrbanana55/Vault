# Quickstart Validation Guide: IPC Bridge & Contracts

**Feature**: 003-ipc-bridge-contracts
**Date**: 2026-09-03

## Prerequisites

- Node.js 18+ installed
- Project dependencies installed (`npm install`)
- Existing tests passing (`npm test`)

## Validation Scenarios

### 1. Channel Registry Compilation

**What it proves**: The `IPC_CHANNELS` constant exists, exports correct literal types, and is importable from both Main and Preload code (FR-001, FR-008, FR-015).

**Steps**:

```bash
# Compile the main process (which imports shared + main)
npx tsc -p tsconfig.main.json --noEmit

# Should exit with code 0 and produce no errors
```

**Expected outcome**: Clean compilation. No type errors. The `IPC_CHANNELS` object is resolvable via the `@shared` path alias.

### 2. Unit Tests Pass

**What it proves**: All IPC handlers return `IPCResult<T>` envelopes (FR-005, FR-007), channel constants match handler registrations (FR-001, FR-008), and the preload bridge wires to the correct channels.

**Steps**:

```bash
# Run the full test suite
npm test
```

**Expected outcome**: All tests pass, including:
- `ipc-handlers.test.ts` — verifies all 6 channels are registered and return correct envelope shapes
- `preload.test.ts` — verifies all bridge methods invoke the correct channel constants

### 3. No String Literals in IPC Layer

**What it proves**: SC-001 — zero hardcoded channel strings remain in handler or preload files.

**Steps**:

```bash
# Search for string literals matching the channel pattern in IPC files
grep -rn "'notes:" src/main/ipc/ src/preload/index.ts
grep -rn '"notes:' src/main/ipc/ src/preload/index.ts
grep -rn "'instruments:" src/main/ipc/ src/preload/index.ts
grep -rn '"instruments:' src/main/ipc/ src/preload/index.ts
```

**Expected outcome**: Zero matches. All channel references use `IPC_CHANNELS.*` constants. The only files containing the literal strings should be `src/shared/ipc-channels.ts` (the registry definition) and test files (if they assert string values).

### 4. VaultAPI Type Is Globally Available

**What it proves**: FR-012 — the `VaultAPI` interface is declared on the global `Window` type and Renderer code can reference it without explicit imports.

**Steps**:

```bash
# Check that the Window augmentation compiles
npx tsc -p tsconfig.json --noEmit
```

**Expected outcome**: Clean compilation. The `window.vaultAPI` type resolves to the `VaultAPI` interface in any file under `src/`.

### 5. Security Boundary Verification

**What it proves**: FR-010, FR-011 — the preload does not expose `ipcRenderer`, and `BrowserWindow` config has `contextIsolation: true` and `nodeIntegration: false`.

**Steps**:

```bash
# Verify contextIsolation and nodeIntegration in main entry
grep -A2 "contextIsolation" src/main/index.ts
grep -A2 "nodeIntegration" src/main/index.ts

# Verify ipcRenderer is NOT in the exposed API object
grep "ipcRenderer" src/preload/index.ts
```

**Expected outcome**:
- `contextIsolation: true` appears in `webPreferences`
- `nodeIntegration: false` appears in `webPreferences`
- `ipcRenderer` appears only in `import` statements and inside bridge method bodies (as `ipcRenderer.invoke(...)`) — never as an exposed property on the `vaultAPI` object

### 6. Error Coercion Utility

**What it proves**: Edge case — handlers produce a string error message even when a non-Error value is thrown.

**Steps**:

```bash
npm test -- --reporter=verbose
```

**Expected outcome**: Tests confirm that `toErrorMessage` correctly handles `Error` objects, plain strings, and arbitrary values.

## Success Criteria Cross-Reference

| Scenario | Validates |
|----------|-----------|
| 1. Channel Registry Compilation | SC-001, SC-002, SC-005 |
| 2. Unit Tests Pass | SC-002, SC-003, SC-006 |
| 3. No String Literals | SC-001 |
| 4. VaultAPI Global Type | SC-002 |
| 5. Security Boundary | SC-004 |
| 6. Error Coercion | SC-003 |
