# Research: IPC Bridge & Contracts

**Feature**: 003-ipc-bridge-contracts
**Date**: 2026-09-03

## Research Task 1: Channel Registry Pattern for Electron IPC

**Decision**: Use a single `as const` object literal exported from `src/shared/ipc-channels.ts` with nested domain grouping.

**Rationale**: TypeScript's `as const` assertion provides:
- Literal string types (not `string`) for each channel value, enabling compile-time type checking
- A single import for all channel names: `IPC_CHANNELS.NOTES.CREATE`
- Nested structure mirrors the `vaultAPI` namespace organization (`notes.*`, `instruments.*`)
- Runtime immutability — the object is deeply frozen by `as const`
- No enum overhead or reverse mapping bloat

**Alternatives considered**:
- **String enum per domain**: Rejected. TypeScript enums generate reverse-mapping runtime code and cannot be nested. Would require separate `NoteChannels` and `InstrumentChannels` enums with no unifying type.
- **Flat object with prefix keys**: Rejected. Loses the domain grouping that mirrors `vaultAPI` namespaces, making it harder to find related channels at a glance.
- **Map or class-based registry**: Rejected. Over-engineered for 6 static channels. A `Map` loses compile-time literal types. A class adds indirection for no benefit.

## Research Task 2: VaultAPI Type Declaration Placement

**Decision**: Move the `VaultAPI` interface and `Window` augmentation from `src/preload/vaultAPI.d.ts` to `src/shared/types/vault-api.ts` and re-export through the barrel `src/shared/types/index.ts`.

**Rationale**:
- The `VaultAPI` type is consumed by both the Preload (to implement the bridge) and the Renderer (to type `window.vaultAPI`). Placing it in `shared/` aligns with the constitution's directive that shared data contracts live in `src/shared/`.
- The `.d.ts` file in `preload/` is a declaration-only ambient file that cannot import runtime values. Moving to a `.ts` file in `shared/` allows it to import `IPCResult`, `AudioNote`, etc. from sibling modules without ambient module declaration workarounds.
- The `declare global { interface Window { vaultAPI: VaultAPI } }` augmentation remains in the same file and continues to work via TypeScript's module augmentation.

**Alternatives considered**:
- **Keep in `preload/vaultAPI.d.ts`**: Rejected. Forces the Renderer to reference a preload-owned type, violating the directional dependency (Renderer → shared, not Renderer → preload). Also creates a `.d.ts` vs `.ts` split that complicates the build.
- **Duplicate the type in both preload and renderer**: Rejected. Violates DRY and risks drift.

## Research Task 3: Error Coercion in Handler Try/Catch Blocks

**Decision**: Use a shared `toErrorMessage` utility function that coerces any `unknown` caught value to a `string`, handling non-Error throws (strings, numbers, objects).

**Rationale**: The current handlers use `(err as Error).message` which crashes if a non-Error object is thrown (edge case from spec). A small utility function avoids repeating coercion logic in every handler:

```typescript
export function toErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return String(err);
}
```

**Alternatives considered**:
- **Inline `String(err)` in each handler**: Rejected. Loses the Error-specific `.message` extraction (which produces cleaner messages for real Error objects). Repeating the conditional in 6+ handlers adds noise.
- **Create a custom IPC error class**: Rejected. Over-engineering for a coercion utility. The `IPCResult` envelope already standardizes the error shape.

## Research Task 4: Preload Bridge Method Channel Reference Pattern

**Decision**: The Preload `index.ts` will import `IPC_CHANNELS` from `@shared/ipc-channels` and use dot-access for each `ipcRenderer.invoke` call. No factory function — each method remains an explicit arrow function for transparency.

**Rationale**:
- Explicit methods make the bridge readable without jumping to a factory definition.
- Each method's TypeScript signature is visible in the source, matching the `VaultAPI` interface. A factory pattern would obscure the type annotations.
- The `as const` channel object provides literal types, so a typo in `IPC_CHANNELS.NOTES.CREAT` (missing 'E') will fail at compile time.

**Alternatives considered**:
- **Generic factory function**: e.g., `createBridgeMethod<TInput, TOutput>(channel)`. Rejected. Hides method signatures, makes the preload harder to audit for security, and doesn't reduce code significantly with only 6 methods.
- **Code generation from channel registry**: Rejected. Massive over-engineering for 6 methods. Adds a build step and tooling dependency for negligible benefit.

## Summary

All research tasks resolved. No NEEDS CLARIFICATION items remain. The implementation approach is:
1. Create `src/shared/ipc-channels.ts` with `as const` nested object
2. Move `VaultAPI` interface to `src/shared/types/vault-api.ts`
3. Add `toErrorMessage` utility to `src/shared/types/ipc.ts` (co-located with `IPCResult<T>`)
4. Refactor handlers and preload to use `IPC_CHANNELS` constants
5. Update tests to use constants instead of string literals
