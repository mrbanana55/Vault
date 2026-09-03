/**
 * Centralized IPC channel registry.
 * Single source of truth for all IPC communication channels between Main and Renderer processes.
 */
export const IPC_CHANNELS = {
  NOTES: {
    CREATE: 'notes:create',
    GET_ALL: 'notes:get-all',
    GET_BY_ID: 'notes:get-by-id',
    UPDATE: 'notes:update',
    DELETE: 'notes:delete',
  },
  INSTRUMENTS: {
    GET_ALL: 'instruments:get-all',
  },
  AUDIO: {
    SAVE_FILE: 'audio:save-file',
  },
} as const;

export type IPCChannels = typeof IPC_CHANNELS;
