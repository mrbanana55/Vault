import { describe, it, expect, vi, beforeEach } from 'vitest';
import { contextBridge, ipcRenderer } from 'electron';
import { vaultAPI } from '../index';
import { IPC_CHANNELS } from '@shared/ipc-channels';
import type { AudioNote, Instrument } from '@shared/types';

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

  it('exposes notes namespace with all 5 methods calling corresponding IPC channels and returning typed IPCResult', async () => {
    const mockNote: AudioNote = {
      id: 1,
      title: 'Idea 1',
      file_path: 'recordings/1.wav',
      duration_seconds: 10,
      bpm: null,
      musical_key: null,
      authors: null,
      song_section: null,
      notes: null,
      is_used: 0,
      created_at: '2026-09-03T00:00:00.000Z',
      updated_at: '2026-09-03T00:00:00.000Z',
    };

    (ipcRenderer.invoke as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true, data: mockNote });
    const createRes = await vaultAPI.notes.create({ file_path: '/path/1.wav', duration_seconds: 10 });
    expect(ipcRenderer.invoke).toHaveBeenCalledWith(IPC_CHANNELS.NOTES.CREATE, {
      file_path: '/path/1.wav',
      duration_seconds: 10,
    });
    expect(createRes).toEqual({ success: true, data: mockNote });

    (ipcRenderer.invoke as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true, data: [mockNote] });
    const getAllRes = await vaultAPI.notes.getAll({ is_used: 0 });
    expect(ipcRenderer.invoke).toHaveBeenCalledWith(IPC_CHANNELS.NOTES.GET_ALL, { is_used: 0 });
    expect(getAllRes).toEqual({ success: true, data: [mockNote] });

    const noteWithInst = { ...mockNote, instruments: [{ id: 1, name: 'Guitar' }] };
    (ipcRenderer.invoke as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true, data: noteWithInst });
    const getByIdRes = await vaultAPI.notes.getById(123);
    expect(ipcRenderer.invoke).toHaveBeenCalledWith(IPC_CHANNELS.NOTES.GET_BY_ID, 123);
    expect(getByIdRes).toEqual({ success: true, data: noteWithInst });

    (ipcRenderer.invoke as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true, data: mockNote });
    const updateRes = await vaultAPI.notes.update({ id: 123, title: 'Updated' });
    expect(ipcRenderer.invoke).toHaveBeenCalledWith(IPC_CHANNELS.NOTES.UPDATE, { id: 123, title: 'Updated' });
    expect(updateRes).toEqual({ success: true, data: mockNote });

    (ipcRenderer.invoke as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true, data: { file_missing: false } });
    const deleteRes = await vaultAPI.notes.delete(123);
    expect(ipcRenderer.invoke).toHaveBeenCalledWith(IPC_CHANNELS.NOTES.DELETE, 123);
    expect(deleteRes).toEqual({ success: true, data: { file_missing: false } });
  });

  it('exposes instruments namespace with getAll calling instruments:get-all and returning typed IPCResult', async () => {
    const mockInstruments: Instrument[] = [{ id: 1, name: 'Piano' }];
    (ipcRenderer.invoke as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true, data: mockInstruments });

    const res = await vaultAPI.instruments.getAll();
    expect(ipcRenderer.invoke).toHaveBeenCalledWith(IPC_CHANNELS.INSTRUMENTS.GET_ALL);
    expect(res).toEqual({ success: true, data: mockInstruments });
  });

  describe('Security Boundaries (US4)', () => {
    it('calls contextBridge.exposeInMainWorld for vaultAPI upon loading preload', async () => {
      vi.resetModules();
      const electron = await import('electron');
      const preloadModule = await import('../index');
      expect(electron.contextBridge.exposeInMainWorld).toHaveBeenCalledWith('vaultAPI', preloadModule.vaultAPI);
    });

    it('vaultAPI contains only notes and instruments namespaces, without exposing ipcRenderer or Node internals', () => {
      const keys = Object.keys(vaultAPI);
      expect(keys.sort()).toEqual(['instruments', 'notes']);

      expect('ipcRenderer' in vaultAPI).toBe(false);
      expect('require' in vaultAPI).toBe(false);
      expect('process' in vaultAPI).toBe(false);
      expect('electron' in vaultAPI).toBe(false);
    });

    it('notes namespace exposes only the 5 permitted CRUD methods', () => {
      const noteMethods = Object.keys(vaultAPI.notes);
      expect(noteMethods.sort()).toEqual(['create', 'delete', 'getAll', 'getById', 'update']);
    });

    it('instruments namespace exposes only getAll', () => {
      const instMethods = Object.keys(vaultAPI.instruments);
      expect(instMethods).toEqual(['getAll']);
    });
  });
});
