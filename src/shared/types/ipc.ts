/** Standard IPC result envelope used by all handlers. */
export type IPCResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
