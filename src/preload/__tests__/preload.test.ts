import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ipcRenderer } from 'electron';
import { vaultAPI } from '../index';

vi.mock('electron', () => {
  return {
    contextBridge: {
      exposeInMainWorld: vi.fn(),
    },
    ipcRenderer: {
      invoke: vi.fn(),
    },
  };
});

describe('Preload Bridge (vaultAPI)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exposes notes namespace with all 5 methods calling corresponding IPC channels', async () => {
    (ipcRenderer.invoke as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true });

    await vaultAPI.notes.create({ file_path: '/path/1.wav', duration_seconds: 10 });
    expect(ipcRenderer.invoke).toHaveBeenCalledWith('notes:create', {
      file_path: '/path/1.wav',
      duration_seconds: 10,
    });

    await vaultAPI.notes.getAll({ is_used: 0 });
    expect(ipcRenderer.invoke).toHaveBeenCalledWith('notes:get-all', { is_used: 0 });

    await vaultAPI.notes.getById(123);
    expect(ipcRenderer.invoke).toHaveBeenCalledWith('notes:get-by-id', 123);

    await vaultAPI.notes.update({ id: 123, title: 'Updated' });
    expect(ipcRenderer.invoke).toHaveBeenCalledWith('notes:update', { id: 123, title: 'Updated' });

    await vaultAPI.notes.delete(123);
    expect(ipcRenderer.invoke).toHaveBeenCalledWith('notes:delete', 123);
  });

  it('exposes instruments namespace with getAll calling instruments:get-all', async () => {
    (ipcRenderer.invoke as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true, data: [] });

    await vaultAPI.instruments.getAll();
    expect(ipcRenderer.invoke).toHaveBeenCalledWith('instruments:get-all');
  });
});
