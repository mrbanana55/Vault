/** Standard IPC result envelope used by all handlers. */
export type IPCResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Safely coerces an unknown caught error into a string message.
 * Handles Error instances, strings, and arbitrary thrown values.
 */
export function toErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }
  if (typeof err === 'string') {
    return err;
  }
  return String(err);
}
