import { useState, useEffect, useCallback } from 'react';
import type { AudioNote, Instrument } from '@shared/types';
import { resolveAudioUrlDuration } from '../lib/audio-metadata';

export interface NoteWithInstruments extends AudioNote {
  instruments: Instrument[];
}

export interface UseNotesResult {
  notes: NoteWithInstruments[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useNotes(isUsed: 0 | 1): UseNotesResult {
  const [notes, setNotes] = useState<NoteWithInstruments[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  const refetch = useCallback(() => setFetchKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    async function load() {
      try {
        const result = await window.vaultAPI.notes.getAll({ is_used: isUsed });
        if (cancelled) return;

        if (!result.success) {
          setError(result.error);
          setLoading(false);
          return;
        }

        // Enrich each note with its associated instruments in parallel
        const enriched = await Promise.all(
          result.data.map(async (note): Promise<NoteWithInstruments> => {
            const detail = await window.vaultAPI.notes.getById(note.id);
            return {
              ...note,
              instruments: detail.success ? detail.data.instruments : [],
            };
          })
        );

        if (cancelled) return;
        setNotes(enriched);
        setLoading(false);

        // Retroactively resolve true duration for any notes stored with duration_seconds <= 0
        const notesNeedingDuration = enriched.filter(
          (n) => !n.duration_seconds || n.duration_seconds <= 0
        );

        if (notesNeedingDuration.length > 0) {
          for (const note of notesNeedingDuration) {
            try {
              const streamUrl = `vault-audio://stream/${note.file_path}`;
              const realDuration = await resolveAudioUrlDuration(streamUrl);
              if (cancelled) break;

              if (realDuration > 0) {
                setNotes((prevNotes) =>
                  prevNotes.map((n) =>
                    n.id === note.id ? { ...n, duration_seconds: realDuration } : n
                  )
                );

                await window.vaultAPI.notes.update({
                  id: note.id,
                  duration_seconds: realDuration,
                });
              }
            } catch (resolveErr) {
              console.error(`Failed to resolve duration for note ${note.id}:`, resolveErr);
            }
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [isUsed, fetchKey]);

  return { notes, loading, error, refetch };
}
