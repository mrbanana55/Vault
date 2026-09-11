import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRowSelection } from '../useRowSelection';

describe('useRowSelection', () => {
  const sampleNotes = [
    { id: 101 },
    { id: 102 },
    { id: 103 },
    { id: 104 },
    { id: 105 },
  ];

  it('initializes with an empty selection', () => {
    const { result } = renderHook(() =>
      useRowSelection({ notes: sampleNotes, activeTab: 0 })
    );

    expect(result.current.selectedIds.size).toBe(0);
    expect(result.current.selectedCount).toBe(0);
    expect(result.current.isAllSelected).toBe(false);
    expect(result.current.isIndeterminate).toBe(false);
    expect(result.current.isSelected(101)).toBe(false);
  });

  it('toggles an individual row on and off', () => {
    const { result } = renderHook(() =>
      useRowSelection({ notes: sampleNotes, activeTab: 0 })
    );

    // Select row 0 (id 101)
    act(() => {
      result.current.handleRowSelect(101, 0, false);
    });
    expect(result.current.selectedIds.has(101)).toBe(true);
    expect(result.current.selectedCount).toBe(1);
    expect(result.current.isSelected(101)).toBe(true);
    expect(result.current.isIndeterminate).toBe(true);

    // Select row 2 (id 103)
    act(() => {
      result.current.handleRowSelect(103, 2, false);
    });
    expect(result.current.selectedIds.has(101)).toBe(true);
    expect(result.current.selectedIds.has(103)).toBe(true);
    expect(result.current.selectedCount).toBe(2);

    // Unselect row 0 (id 101)
    act(() => {
      result.current.handleRowSelect(101, 0, false);
    });
    expect(result.current.selectedIds.has(101)).toBe(false);
    expect(result.current.selectedIds.has(103)).toBe(true);
    expect(result.current.selectedCount).toBe(1);
  });

  it('supports selectAll and clearSelection', () => {
    const { result } = renderHook(() =>
      useRowSelection({ notes: sampleNotes, activeTab: 0 })
    );

    act(() => {
      result.current.selectAll();
    });
    expect(result.current.selectedCount).toBe(5);
    expect(result.current.isAllSelected).toBe(true);
    expect(result.current.isIndeterminate).toBe(false);
    sampleNotes.forEach((n) => expect(result.current.isSelected(n.id)).toBe(true));

    act(() => {
      result.current.clearSelection();
    });
    expect(result.current.selectedCount).toBe(0);
    expect(result.current.isAllSelected).toBe(false);
    expect(result.current.isIndeterminate).toBe(false);
  });

  it('prunes selected IDs when notes are removed or updated', () => {
    let currentNotes = [...sampleNotes];
    const { result, rerender } = renderHook(
      ({ notes }) => useRowSelection({ notes, activeTab: 0 }),
      { initialProps: { notes: currentNotes } }
    );

    act(() => {
      result.current.handleRowSelect(101, 0, false);
      result.current.handleRowSelect(102, 1, false);
    });
    expect(result.current.selectedCount).toBe(2);

    // Note 102 is removed (e.g. archived or deleted)
    currentNotes = currentNotes.filter((n) => n.id !== 102);
    rerender({ notes: currentNotes });

    expect(result.current.selectedIds.has(101)).toBe(true);
    expect(result.current.selectedIds.has(102)).toBe(false);
    expect(result.current.selectedCount).toBe(1);
  });

  it('handles downwards Shift + Click range selection', () => {
    const { result } = renderHook(() =>
      useRowSelection({ notes: sampleNotes, activeTab: 0 })
    );

    // Click row index 1 (id 102)
    act(() => {
      result.current.handleRowSelect(102, 1, false);
    });
    expect(result.current.selectedCount).toBe(1);

    // Shift-click row index 3 (id 104)
    act(() => {
      result.current.handleRowSelect(104, 3, true);
    });

    // Expect rows 1, 2, 3 (ids 102, 103, 104) to be selected
    expect(result.current.selectedIds.has(102)).toBe(true);
    expect(result.current.selectedIds.has(103)).toBe(true);
    expect(result.current.selectedIds.has(104)).toBe(true);
    expect(result.current.selectedCount).toBe(3);
    expect(result.current.selectedIds.has(101)).toBe(false);
    expect(result.current.selectedIds.has(105)).toBe(false);
  });

  it('handles upwards Shift + Click range selection', () => {
    const { result } = renderHook(() =>
      useRowSelection({ notes: sampleNotes, activeTab: 0 })
    );

    // Click row index 4 (id 105)
    act(() => {
      result.current.handleRowSelect(105, 4, false);
    });

    // Shift-click row index 1 (id 102)
    act(() => {
      result.current.handleRowSelect(102, 1, true);
    });

    // Expect rows 1, 2, 3, 4 (ids 102, 103, 104, 105) to be selected
    expect(result.current.selectedIds.has(102)).toBe(true);
    expect(result.current.selectedIds.has(103)).toBe(true);
    expect(result.current.selectedIds.has(104)).toBe(true);
    expect(result.current.selectedIds.has(105)).toBe(true);
    expect(result.current.selectedCount).toBe(4);
    expect(result.current.selectedIds.has(101)).toBe(false);
  });

  it('treats Shift + Click as normal click if no anchor exists yet', () => {
    const { result } = renderHook(() =>
      useRowSelection({ notes: sampleNotes, activeTab: 0 })
    );

    // Shift-click immediately
    act(() => {
      result.current.handleRowSelect(103, 2, true);
    });

    expect(result.current.selectedCount).toBe(1);
    expect(result.current.selectedIds.has(103)).toBe(true);

    // Now shift-click index 4
    act(() => {
      result.current.handleRowSelect(105, 4, true);
    });

    expect(result.current.selectedCount).toBe(3); // 103, 104, 105
    expect(result.current.selectedIds.has(103)).toBe(true);
    expect(result.current.selectedIds.has(104)).toBe(true);
    expect(result.current.selectedIds.has(105)).toBe(true);
  });

  it('resets selection when activeTab changes', () => {
    let tab: 0 | 1 = 0;
    const { result, rerender } = renderHook(
      ({ activeTab }: { activeTab: 0 | 1 }) =>
        useRowSelection({ notes: sampleNotes, activeTab }),
      { initialProps: { activeTab: 0 as 0 | 1 } }
    );

    act(() => {
      result.current.handleRowSelect(101, 0, false);
      result.current.handleRowSelect(102, 1, false);
    });
    expect(result.current.selectedCount).toBe(2);

    // Switch to Archive tab (1)
    tab = 1;
    rerender({ activeTab: tab });

    expect(result.current.selectedCount).toBe(0);
    expect(result.current.selectedIds.size).toBe(0);
  });
});
