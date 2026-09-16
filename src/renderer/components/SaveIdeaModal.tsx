import React, { useState, useEffect } from 'react';
import type { PostRecordingIdeaInput } from '../types/recording-dock';
import { formatDuration } from '../lib/format';

export interface SaveIdeaModalProps {
  isOpen: boolean;
  durationSeconds: number;
  onSave: (metadata: PostRecordingIdeaInput) => Promise<void>;
  onDiscard: () => void;
}

export function SaveIdeaModal({
  isOpen,
  durationSeconds,
  onSave,
  onDiscard,
}: SaveIdeaModalProps) {
  const [title, setTitle] = useState('');
  const [musicalKey, setMusicalKey] = useState('');
  const [bpm, setBpm] = useState('');
  const [authors, setAuthors] = useState('');
  const [songSection, setSongSection] = useState('');
  const [instruments, setInstruments] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Reset form when opened
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setMusicalKey('');
      setBpm('');
      setAuthors('');
      setSongSection('');
      setInstruments('');
      setNotes('');
      setIsSaving(false);
      setShowDiscardConfirm(false);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    try {
      const parsedBpm = bpm.trim().length > 0 ? parseFloat(bpm) : null;
      await onSave({
        title: title.trim(),
        musical_key: musicalKey.trim() || undefined,
        bpm: Number.isFinite(parsedBpm) && parsedBpm !== null && parsedBpm > 0 ? parsedBpm : null,
        authors: authors.trim() || undefined,
        song_section: songSection.trim() || undefined,
        instruments: instruments.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      data-testid="save-idea-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
      // Explicitly ignore backdrop click to protect recorded take
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="w-full max-w-lg bg-surface-primary border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-content-primary">Save Recorded Idea</h2>
            <p className="text-xs text-content-secondary mt-0.5">
              Captured take duration: <span className="font-mono text-accent">{formatDuration(durationSeconds)}</span>
            </p>
          </div>
          <span className="text-xs text-content-secondary/80 bg-surface-secondary px-2.5 py-1 rounded-full border border-border">
            All fields optional
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-sm flex-1">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-content-secondary mb-1">
              Title <span className="text-content-secondary/60">(leave blank for &quot;Idea-XX&quot;)</span>
            </label>
            <input
              type="text"
              data-testid="input-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Idea-XX (leave blank for default)"
              autoFocus
              className="w-full px-3 py-2 rounded-lg bg-surface-secondary border border-border text-content-primary placeholder:text-content-secondary/40 focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          {/* Key & BPM row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-content-secondary mb-1">
                Musical Key
              </label>
              <input
                type="text"
                data-testid="input-key"
                value={musicalKey}
                onChange={(e) => setMusicalKey(e.target.value)}
                placeholder="e.g. C Major, Am"
                className="w-full px-3 py-2 rounded-lg bg-surface-secondary border border-border text-content-primary placeholder:text-content-secondary/40 focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-content-secondary mb-1">
                BPM
              </label>
              <input
                type="number"
                data-testid="input-bpm"
                value={bpm}
                min="1"
                max="999"
                onChange={(e) => setBpm(e.target.value)}
                placeholder="e.g. 120"
                className="w-full px-3 py-2 rounded-lg bg-surface-secondary border border-border text-content-primary placeholder:text-content-secondary/40 focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          {/* Authors & Song Section row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-content-secondary mb-1">
                Authors
              </label>
              <input
                type="text"
                data-testid="input-authors"
                value={authors}
                onChange={(e) => setAuthors(e.target.value)}
                placeholder="e.g. Alice, Bob"
                className="w-full px-3 py-2 rounded-lg bg-surface-secondary border border-border text-content-primary placeholder:text-content-secondary/40 focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-content-secondary mb-1">
                Song Section
              </label>
              <input
                type="text"
                data-testid="input-section"
                value={songSection}
                onChange={(e) => setSongSection(e.target.value)}
                placeholder="e.g. Verse, Chorus"
                className="w-full px-3 py-2 rounded-lg bg-surface-secondary border border-border text-content-primary placeholder:text-content-secondary/40 focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          {/* Instruments */}
          <div>
            <label className="block text-xs font-medium text-content-secondary mb-1">
              Instruments <span className="text-content-secondary/60">(comma-separated)</span>
            </label>
            <input
              type="text"
              data-testid="input-instruments"
              value={instruments}
              onChange={(e) => setInstruments(e.target.value)}
              placeholder="e.g. Acoustic Guitar, Vocal"
              className="w-full px-3 py-2 rounded-lg bg-surface-secondary border border-border text-content-primary placeholder:text-content-secondary/40 focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-content-secondary mb-1">
              Notes
            </label>
            <textarea
              data-testid="input-notes"
              value={notes}
              rows={3}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Chords, capo position, mic setup, thoughts..."
              className="w-full px-3 py-2 rounded-lg bg-surface-secondary border border-border text-content-primary placeholder:text-content-secondary/40 focus:outline-none focus:ring-1 focus:ring-accent resize-none"
            />
          </div>

          {/* Discard confirmation banner */}
          {showDiscardConfirm && (
            <div
              data-testid="discard-confirm-banner"
              className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-between text-xs animate-fade-in"
            >
              <span className="text-red-500 font-medium">
                Discard this take? This action cannot be undone.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  data-testid="btn-cancel-discard"
                  onClick={() => setShowDiscardConfirm(false)}
                  className="px-2.5 py-1 text-content-secondary hover:text-content-primary rounded transition-colors"
                >
                  Keep
                </button>
                <button
                  type="button"
                  data-testid="btn-confirm-discard"
                  onClick={onDiscard}
                  className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white font-medium rounded transition-colors"
                >
                  Confirm Discard
                </button>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-2 border-t border-border flex items-center justify-between">
            <button
              type="button"
              data-testid="btn-discard"
              onClick={() => setShowDiscardConfirm(true)}
              className="px-3.5 py-2 text-xs font-medium text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              Discard Take
            </button>

            <button
              type="submit"
              disabled={isSaving}
              data-testid="btn-save-idea"
              className="px-5 py-2 text-xs font-medium bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSaving ? 'Saving...' : 'Save Idea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
