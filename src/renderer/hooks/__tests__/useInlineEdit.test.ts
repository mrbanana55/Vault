import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInlineEdit } from '../useInlineEdit';

describe('useInlineEdit', () => {
  it('initializes with activeCellId as null', () => {
    const onSave = vi.fn().mockResolvedValue(true);
    const { result } = renderHook(() => useInlineEdit(onSave));

    expect(result.current.activeCellId).toBeNull();
  });

  it('sets activeCellId on startEdit', () => {
    const onSave = vi.fn().mockResolvedValue(true);
    const { result } = renderHook(() => useInlineEdit(onSave));

    act(() => {
      result.current.startEdit(1, 'title');
    });

    expect(result.current.activeCellId).toEqual({ noteId: 1, field: 'title' });
  });

  it('clears activeCellId on clearEdit', () => {
    const onSave = vi.fn().mockResolvedValue(true);
    const { result } = renderHook(() => useInlineEdit(onSave));

    act(() => {
      result.current.startEdit(1, 'title');
    });
    expect(result.current.activeCellId).not.toBeNull();

    act(() => {
      result.current.clearEdit();
    });
    expect(result.current.activeCellId).toBeNull();
  });

  it('commits edit via onSave and clears activeCellId', async () => {
    const onSave = vi.fn().mockResolvedValue(true);
    const { result } = renderHook(() => useInlineEdit(onSave));

    act(() => {
      result.current.startEdit(42, 'bpm');
    });

    await act(async () => {
      await result.current.commitEdit(42, 'bpm', '135');
    });

    expect(onSave).toHaveBeenCalledWith(42, 'bpm', '135');
    expect(result.current.activeCellId).toBeNull();
  });

  it('clears activeCellId even if onSave returns false or throws', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const onSave = vi.fn().mockResolvedValue(false);
    const { result } = renderHook(() => useInlineEdit(onSave));

    act(() => {
      result.current.startEdit(10, 'title');
    });

    await act(async () => {
      await result.current.commitEdit(10, 'title', '');
    });

    expect(result.current.activeCellId).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
