import React from 'react';

export interface DragDropOverlayProps {
  isDragging: boolean;
}

export function DragDropOverlay({ isDragging }: DragDropOverlayProps) {
  if (!isDragging) return null;

  return (
    <div
      data-testid="drag-drop-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-6 pointer-events-none transition-all duration-200"
    >
      <div className="flex flex-col items-center justify-center w-full max-w-lg h-72 rounded-2xl border-2 border-dashed border-accent-blue bg-surface-primary/90 shadow-2xl p-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-accent-blue/10 flex items-center justify-center text-accent-blue">
          <svg
            className="w-8 h-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>
        <div className="space-y-1">
          <p className="text-lg font-semibold text-content-primary">
            Drop audio files to import into Vault
          </p>
          <p className="text-xs text-content-secondary">
            Supported formats: WAV, MP3, M4A, OGG, FLAC
          </p>
        </div>
      </div>
    </div>
  );
}
