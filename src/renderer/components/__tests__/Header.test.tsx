import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { Header } from '../Header';
import { ThemeProvider } from '../../context/ThemeContext';

describe('Header', () => {
  it('renders Vault branding and Import button', () => {
    render(
      <ThemeProvider>
        <Header />
      </ThemeProvider>
    );

    expect(screen.getByText('Vault')).toBeInTheDocument();
    expect(screen.getByTestId('header-import-button')).toBeInTheDocument();
    expect(screen.getByText('Import')).toBeInTheDocument();
  });

  it('triggers file selection when Import button is clicked', () => {
    const onImportFiles = vi.fn();
    render(
      <ThemeProvider>
        <Header onImportFiles={onImportFiles} />
      </ThemeProvider>
    );

    const input = screen.getByTestId('header-file-input') as HTMLInputElement;
    const file = new File(['audio-bytes'], 'idea.wav', { type: 'audio/wav' });

    fireEvent.change(input, { target: { files: [file] } });
    expect(onImportFiles).toHaveBeenCalled();
  });
});
