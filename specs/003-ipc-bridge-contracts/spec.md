# Feature Specification: IPC Bridge & Contracts

**Feature Branch**: `003-ipc-bridge-contracts`

**Created**: 2026-09-03

**Status**: Draft

**Input**: User description: "Let's make the ipc bridge and contracts and a secure API for the communication between the main process and renderer. Establish the IPC channels, shared types and the exposed interface in contextBridge"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Renderer Calls Main-Process Operations Through a Typed Bridge (Priority: P1)

A developer working on the Renderer (React) needs to create, read, update, or delete audio notes and retrieve instruments. Instead of guessing channel strings and payload shapes, they use the globally available `window.vaultAPI` object. Each method has a fully typed signature that is enforced at compile time and returns a predictable `IPCResult<T>` envelope, so the developer always knows whether the call succeeded and what data shape to expect.

**Why this priority**: Without a typed, documented bridge, the Renderer cannot safely communicate with the Main process. This is the most fundamental cross-process interaction in the entire application.

**Independent Test**: Can be fully tested by importing the `VaultAPI` type in a Renderer-side module, invoking any method (e.g., `window.vaultAPI.notes.getAll()`), and verifying the response conforms to the `IPCResult<AudioNote[]>` type at both compile time and runtime.

**Acceptance Scenarios**:

1. **Given** the application is running with `contextIsolation: true`, **When** a Renderer component calls `window.vaultAPI.notes.getAll()`, **Then** the call is routed through `ipcRenderer.invoke` to the correct Main-process handler and returns an `IPCResult<AudioNote[]>`.
2. **Given** a developer imports the `VaultAPI` interface in a Renderer TypeScript file, **When** they attempt to call a method with wrong argument types, **Then** the TypeScript compiler raises a type error.
3. **Given** the preload script is loaded, **When** the Renderer inspects `window.vaultAPI`, **Then** only the explicitly exposed methods are available — no access to `ipcRenderer`, Node APIs, or Electron internals.

---

### User Story 2 - Channel Names Are Defined in a Single Source of Truth (Priority: P1)

A developer adding a new IPC operation defines the channel name in one place. Both the Main-process handler registration and the Preload bridge method reference that constant, eliminating string duplication and preventing mismatches that cause silent failures.

**Why this priority**: Duplicated string literals across Main and Preload are the primary source of IPC bugs. A single channel registry is foundational to a reliable bridge.

**Independent Test**: Can be tested by renaming a channel constant and verifying that both the handler and the bridge reference update without manual search-and-replace, and that a typo in the channel name causes a compile-time error.

**Acceptance Scenarios**:

1. **Given** a channel constant `IPC_CHANNELS.NOTES.CREATE` is defined in the shared contracts, **When** the Main handler registers `ipc.handle(IPC_CHANNELS.NOTES.CREATE, ...)` and the Preload bridge calls `ipcRenderer.invoke(IPC_CHANNELS.NOTES.CREATE, ...)`, **Then** both reference the same string value at compile time.
2. **Given** a developer introduces a new channel, **When** they add it to the channel registry but forget to add the corresponding handler, **Then** the omission is apparent because the handler registration function expects all registered channels to be wired.
3. **Given** all channel names are defined as typed constants, **When** a developer tries to use an unregistered string literal in an `ipcRenderer.invoke` call within the Preload, **Then** the call is detectable during code review as a deviation from the established pattern.

---

### User Story 3 - Main-Process Handlers Return Consistent Error Envelopes (Priority: P1)

When any Main-process handler encounters an error (database failure, file system error, validation rejection), it catches the exception and returns a typed `IPCResult<T>` with `success: false` and a human-readable error string. The Renderer never receives raw exceptions or unstructured errors.

**Why this priority**: Consistent error handling is critical for the Renderer to display meaningful feedback and avoid uncaught promise rejections.

**Independent Test**: Can be tested by invoking a handler with invalid input (e.g., deleting a non-existent note ID) and verifying the response is `{ success: false, error: "..." }` rather than a thrown exception.

**Acceptance Scenarios**:

1. **Given** a note with ID 999 does not exist, **When** the Renderer calls `window.vaultAPI.notes.delete(999)`, **Then** the response is `{ success: false, error: "Note with id 999 not found" }`.
2. **Given** the database connection fails during a query, **When** any handler catches the error, **Then** the response includes `success: false` with the error message and no stack trace is exposed to the Renderer.
3. **Given** an audio ingestion payload fails header validation, **When** the create handler processes it, **Then** the response indicates failure with a descriptive validation error.

---

### User Story 4 - Preload Script Enforces Security Boundaries (Priority: P2)

The preload script exposes only the `vaultAPI` object to the Renderer via `contextBridge.exposeInMainWorld`. It never leaks `ipcRenderer`, `ipcMain`, `require`, `process`, or any Node.js / Electron internal API. Context isolation remains enabled and node integration remains disabled.

**Why this priority**: Security is essential but the application already enforces `contextIsolation: true` and `nodeIntegration: false`. This story formalizes and validates those guarantees.

**Independent Test**: Can be tested by inspecting `window` in the Renderer DevTools and confirming that only `vaultAPI` is present — no `require`, `process`, `electron`, or `ipcRenderer`.

**Acceptance Scenarios**:

1. **Given** the application is running, **When** Renderer code attempts `window.require('fs')`, **Then** the call is `undefined` or throws a reference error.
2. **Given** the preload script is the only bridge, **When** the Renderer accesses `window.vaultAPI`, **Then** the object contains only the `notes` and `instruments` namespaces with their defined methods.
3. **Given** `contextIsolation` is `true`, **When** the preload script executes, **Then** it runs in an isolated context and cannot pollute or be polluted by Renderer-side JavaScript.

---

### User Story 5 - Audio Payload Travels Securely Over IPC (Priority: P2)

When a musician finishes recording, the Renderer serializes the audio `Blob` into an `ArrayBuffer` and sends it through the typed bridge. The Main process receives the binary data, validates it, and writes it to disk. The bridge method signature enforces that only `ArrayBuffer` payloads are accepted for audio ingestion.

**Why this priority**: Audio data transfer is the most performance-sensitive IPC operation and requires explicit typing to prevent accidental data corruption.

**Independent Test**: Can be tested by creating a mock `ArrayBuffer`, calling the ingestion bridge method, and verifying the Main process receives the correct byte sequence.

**Acceptance Scenarios**:

1. **Given** a recorded audio payload as an `ArrayBuffer`, **When** the Renderer calls the audio ingestion method, **Then** the Main process receives a `Buffer` with identical byte content.
2. **Given** a developer attempts to pass a string instead of an `ArrayBuffer` to the ingestion method, **Then** the TypeScript compiler raises a type error.
3. **Given** the audio payload is 10 MB, **When** it is sent over IPC, **Then** the transfer completes without truncation and the file written to disk matches the original byte count.

---

### Edge Cases

- What happens when the Renderer calls a bridge method before the Main-process handlers are registered (race condition during startup)? The call must either queue until handlers are ready or return a clear error.
- What happens when the Renderer sends an excessively large `ArrayBuffer` (e.g., a 2 GB recording)? The system must fail gracefully with an error rather than exhausting memory.
- What happens when a handler throws a non-Error object (e.g., a string)? The error envelope must still produce a string message.
- What happens when multiple Renderer windows exist and both invoke the same channel? Each call must be handled independently without interference.
- What happens when the Renderer calls a method after the Main process has begun quitting? The call must not crash the application.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST define all IPC channel names as typed constants in a single shared module accessible to both Main and Preload code.
- **FR-002**: The system MUST expose exactly one global object (`window.vaultAPI`) to the Renderer via `contextBridge.exposeInMainWorld`.
- **FR-003**: The `vaultAPI` object MUST expose a `notes` namespace containing methods: `create`, `getAll`, `getById`, `update`, and `delete`.
- **FR-004**: The `vaultAPI` object MUST expose an `instruments` namespace containing a method: `getAll`.
- **FR-005**: Every method exposed through `vaultAPI` MUST return `Promise<IPCResult<T>>` where `T` is the typed response payload.
- **FR-006**: The `IPCResult<T>` type MUST be a discriminated union: `{ success: true; data: T }` or `{ success: false; error: string }`.
- **FR-007**: Every Main-process handler registered via `ipcMain.handle` MUST wrap its logic in a `try/catch` and return an `IPCResult<T>` — never throw to the Renderer.
- **FR-008**: Each bridge method in the Preload MUST reference a channel constant from the shared channel registry rather than a string literal.
- **FR-009**: The shared contracts module MUST define TypeScript interfaces for all IPC payloads: `CreateAudioNoteInput`, `UpdateAudioNoteInput`, `NoteFilters`, `AudioNote`, `Instrument`, and `IPCResult<T>`.
- **FR-010**: The Preload script MUST NOT expose `ipcRenderer`, `ipcMain`, `require`, `process`, or any Electron/Node internal API to the Renderer.
- **FR-011**: The `BrowserWindow` configuration MUST set `contextIsolation: true` and `nodeIntegration: false`.
- **FR-012**: The system MUST provide a `VaultAPI` TypeScript interface that mirrors the runtime shape of `window.vaultAPI`, declared on the global `Window` type for Renderer-side type safety.
- **FR-013**: Audio data sent from the Renderer to the Main process for ingestion MUST be typed as `ArrayBuffer` in the bridge method signature.
- **FR-014**: The Main process MUST convert received `ArrayBuffer` payloads to `Buffer` before writing to disk.
- **FR-015**: The channel registry MUST use a nested object structure that groups channels by domain (e.g., `notes`, `instruments`) to support organized scaling as new domains are added.

### Key Entities

- **IPC Channel**: A named string constant that identifies a specific request–response operation between the Renderer and Main process. Channels follow a `domain:action` naming convention (e.g., `notes:create`, `instruments:get-all`).
- **VaultAPI**: The typed interface exposed to the Renderer through `contextBridge`. It is the sole communication surface between UI code and system capabilities. Organized into domain namespaces (`notes`, `instruments`).
- **IPCResult\<T\>**: A discriminated union envelope that wraps every handler response. Guarantees the Renderer always receives a predictable structure indicating success with typed data, or failure with an error description.
- **Shared Contracts**: The collection of TypeScript types, interfaces, and constants in `src/shared/` that are imported by both Main-process handlers and the Preload bridge, ensuring compile-time agreement on channel names and payload shapes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of IPC channel strings used in Main handlers and Preload bridge methods originate from the shared channel registry — zero string literals.
- **SC-002**: Every `vaultAPI` method has a matching TypeScript signature in the `VaultAPI` interface, and all Renderer-side calls compile without type errors.
- **SC-003**: 100% of Main-process handlers return an `IPCResult<T>` for both success and error paths — zero unhandled exceptions cross the IPC boundary.
- **SC-004**: The Renderer's `window` object exposes only `vaultAPI` from the Preload — zero Electron or Node internals are accessible.
- **SC-005**: A developer can add a new IPC channel by defining it in the channel registry and wiring the handler and bridge method, with the TypeScript compiler catching any type mismatches.
- **SC-006**: Audio payloads up to 50 MB transfer over IPC without data loss, verified by byte-count comparison between Renderer-sent `ArrayBuffer` and Main-received `Buffer`.

## Assumptions

- Specs 001 (Data Model) and 002 (Audio I/O Management) are implemented: `AudioNote`, `Instrument`, and `AudioStorageService` types and handlers exist.
- The existing `IPCResult<T>` type in `src/shared/types/ipc.ts` will be preserved; this spec formalizes but does not redesign it.
- The existing shared types (`AudioNote`, `CreateAudioNoteInput`, `UpdateAudioNoteInput`, `NoteFilters`, `Instrument`) in `src/shared/types/` are the source of truth for payload shapes.
- The application uses the `invoke`/`handle` pattern exclusively (no `send`/`on` fire-and-forget messaging) for all current operations.
- The `vault-audio://` custom protocol (defined in the constitution) operates outside the IPC channel system and is not covered by this spec.
- The Preload script is loaded via the `webPreferences.preload` path and does not use `preload` scripts from extensions or plugins.
- Future domains (e.g., `settings`, `audio-protocol`) can extend the channel registry and `VaultAPI` interface without modifying existing contracts.
