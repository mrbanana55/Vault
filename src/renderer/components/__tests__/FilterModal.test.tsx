import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterModal } from '../FilterModal';
import { INITIAL_FILTER_CRITERIA, FILTER_TOOLTIPS } from '../../types/filters';

describe('FilterModal', () => {
  it('does not render when isOpen is false', () => {
    render(
      <FilterModal
        isOpen={false}
        initialCriteria={INITIAL_FILTER_CRITERIA}
        onApply={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(screen.queryByTestId('filter-modal')).not.toBeInTheDocument();
  });

  it('renders all 5 parameter rows, inputs, and tooltips when isOpen is true', () => {
    render(
      <FilterModal
        isOpen={true}
        initialCriteria={INITIAL_FILTER_CRITERIA}
        onApply={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByTestId('filter-modal')).toBeInTheDocument();
    expect(screen.getByText('Filter Ideas')).toBeInTheDocument();

    const bpmMin = screen.getByTestId('filter-bpm-min');
    const bpmMax = screen.getByTestId('filter-bpm-max');
    const keyInput = screen.getByTestId('filter-key');
    const authorsInput = screen.getByTestId('filter-authors');
    const sectionInput = screen.getByTestId('filter-section');
    const instrumentsInput = screen.getByTestId('filter-instruments');

    expect(bpmMin).toBeInTheDocument();
    expect(bpmMax).toBeInTheDocument();
    expect(keyInput).toBeInTheDocument();
    expect(authorsInput).toBeInTheDocument();
    expect(sectionInput).toBeInTheDocument();
    expect(instrumentsInput).toBeInTheDocument();

    // Verify tooltips
    expect(bpmMin).toHaveAttribute('title', FILTER_TOOLTIPS.bpm);
    expect(keyInput).toHaveAttribute('title', FILTER_TOOLTIPS.key);
    expect(authorsInput).toHaveAttribute('title', FILTER_TOOLTIPS.authors);
    expect(sectionInput).toHaveAttribute('title', FILTER_TOOLTIPS.section);
    expect(instrumentsInput).toHaveAttribute('title', FILTER_TOOLTIPS.instruments);
  });

  it('suppresses Enter key submission across all input fields', () => {
    const handleApply = vi.fn();
    render(
      <FilterModal
        isOpen={true}
        initialCriteria={INITIAL_FILTER_CRITERIA}
        onApply={handleApply}
        onClose={vi.fn()}
      />
    );

    const bpmMin = screen.getByTestId('filter-bpm-min');
    fireEvent.change(bpmMin, { target: { value: '120' } });

    // Press Enter in input
    const enterEvent = fireEvent.keyDown(bpmMin, { key: 'Enter', code: 'Enter' });
    expect(enterEvent).toBe(false); // defaultPrevented
    expect(handleApply).not.toHaveBeenCalled();

    const authorsInput = screen.getByTestId('filter-authors');
    fireEvent.change(authorsInput, { target: { value: 'John' } });
    const authorEnter = fireEvent.keyDown(authorsInput, { key: 'Enter', code: 'Enter' });
    expect(authorEnter).toBe(false);
    expect(handleApply).not.toHaveBeenCalled();
  });

  it('submits criteria exclusively when Apply button is clicked', () => {
    const handleApply = vi.fn();
    const handleClose = vi.fn();

    render(
      <FilterModal
        isOpen={true}
        initialCriteria={INITIAL_FILTER_CRITERIA}
        onApply={handleApply}
        onClose={handleClose}
      />
    );

    fireEvent.change(screen.getByTestId('filter-bpm-min'), { target: { value: '100' } });
    fireEvent.change(screen.getByTestId('filter-bpm-max'), { target: { value: '140' } });
    fireEvent.change(screen.getByTestId('filter-key'), { target: { value: 'Am' } });
    fireEvent.change(screen.getByTestId('filter-authors'), { target: { value: 'John, Paul' } });
    fireEvent.change(screen.getByTestId('filter-section'), { target: { value: 'Chorus' } });
    fireEvent.change(screen.getByTestId('filter-instruments'), { target: { value: 'Guitar, Piano' } });

    const applyBtn = screen.getByTestId('filter-apply-button');
    fireEvent.click(applyBtn);

    expect(handleApply).toHaveBeenCalledTimes(1);
    expect(handleApply).toHaveBeenCalledWith({
      bpmMin: 100,
      bpmMax: 140,
      key: 'Am',
      authors: 'John, Paul',
      section: 'Chorus',
      instruments: 'Guitar, Piano',
    });
  });

  it('calls onClose and discards unapplied changes on Cancel, Close button, and Escape key', () => {
    const handleApply = vi.fn();
    const handleClose = vi.fn();

    const { rerender } = render(
      <FilterModal
        isOpen={true}
        initialCriteria={INITIAL_FILTER_CRITERIA}
        onApply={handleApply}
        onClose={handleClose}
      />
    );

    // 1. Cancel button
    fireEvent.change(screen.getByTestId('filter-key'), { target: { value: 'C' } });
    fireEvent.click(screen.getByTestId('filter-cancel-button'));
    expect(handleClose).toHaveBeenCalledTimes(1);
    expect(handleApply).not.toHaveBeenCalled();

    // 2. Close × button
    fireEvent.click(screen.getByTestId('filter-modal-close-button'));
    expect(handleClose).toHaveBeenCalledTimes(2);
    expect(handleApply).not.toHaveBeenCalled();

    // 3. Escape key
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(3);
    expect(handleApply).not.toHaveBeenCalled();

    // 4. Backdrop click
    fireEvent.click(screen.getByTestId('filter-modal'));
    expect(handleClose).toHaveBeenCalledTimes(4);
    expect(handleApply).not.toHaveBeenCalled();

    // 5. Re-open (simulate modal closing and re-opening)
    rerender(
      <FilterModal
        isOpen={false}
        initialCriteria={INITIAL_FILTER_CRITERIA}
        onApply={handleApply}
        onClose={handleClose}
      />
    );
    rerender(
      <FilterModal
        isOpen={true}
        initialCriteria={INITIAL_FILTER_CRITERIA}
        onApply={handleApply}
        onClose={handleClose}
      />
    );
    expect(screen.getByTestId('filter-key')).toHaveValue('');
  });
});
