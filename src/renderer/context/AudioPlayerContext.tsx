import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import type { NoteWithInstruments } from '../hooks/useNotes';

export interface AudioPlayerContextValue {
  currentNote: NoteWithInstruments | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  play: (note: NoteWithInstruments) => void;
  pause: () => void;
  togglePlay: (note?: NoteWithInstruments) => void;
  seek: (timeSeconds: number) => void;
  error: string | null;
}

const AudioPlayerContext = createContext<AudioPlayerContextValue | undefined>(undefined);

function isEditableTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
    return true;
  }
  if (target.isContentEditable) {
    return true;
  }
  if (target.getAttribute('role') === 'textbox') {
    return true;
  }
  if (target.closest('input, textarea, select, [contenteditable="true"], [role="textbox"]')) {
    return true;
  }
  return false;
}

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentNote, setCurrentNote] = useState<NoteWithInstruments | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentNoteRef = useRef<NoteWithInstruments | null>(null);
  currentNoteRef.current = currentNote;

  const isPlayingRef = useRef<boolean>(false);
  isPlayingRef.current = isPlaying;

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);

        const current = currentNoteRef.current;
        if (current && (!current.duration_seconds || current.duration_seconds <= 0)) {
          const resolvedDuration = audio.duration;
          current.duration_seconds = resolvedDuration;
          setCurrentNote({ ...current, duration_seconds: resolvedDuration });

          if (typeof window !== 'undefined' && window.vaultAPI?.notes?.update) {
            window.vaultAPI.notes
              .update({ id: current.id, duration_seconds: resolvedDuration })
              .catch((err) => {
                console.error('Failed to update note duration in database:', err);
              });
          }
        }
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
      setError(null);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      audio.currentTime = 0;
    };

    const handleError = () => {
      setIsPlaying(false);
      setError('Failed to play audio');
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('durationchange', handleLoadedMetadata);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('durationchange', handleLoadedMetadata);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.src = '';
    };
  }, []);

  const play = useCallback((note: NoteWithInstruments) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (currentNoteRef.current?.id === note.id) {
      audio.play().catch((err) => {
        console.error('Audio play error:', err);
        setError('Playback failed');
      });
      return;
    }

    setCurrentNote(note);
    setCurrentTime(0);
    setDuration(note.duration_seconds || 0);
    setError(null);

    const src = `vault-audio://stream/${note.file_path}`;
    audio.src = src;
    audio.currentTime = 0;
    audio.play().catch((err) => {
      console.error('Audio play error:', err);
      setError('Playback failed');
    });
  }, []);

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
  }, []);

  const togglePlay = useCallback(
    (note?: NoteWithInstruments) => {
      const targetNote = note || currentNoteRef.current;
      if (!targetNote) return;

      if (currentNoteRef.current?.id === targetNote.id) {
        if (isPlayingRef.current) {
          pause();
        } else {
          play(targetNote);
        }
      } else {
        play(targetNote);
      }
    },
    [play, pause]
  );

  const seek = useCallback(
    (timeSeconds: number) => {
      const audio = audioRef.current;
      if (!audio) return;
      const noteDuration = currentNoteRef.current?.duration_seconds ?? 0;
      const audioDuration =
        Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0;
      const maxDuration = duration || audioDuration || noteDuration;
      const targetTime =
        maxDuration > 0
          ? Math.max(0, Math.min(timeSeconds, maxDuration))
          : Math.max(0, timeSeconds);
      audio.currentTime = targetTime;
      setCurrentTime(targetTime);
    },
    [duration]
  );

  // Global spacebar shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        if (isEditableTarget(e.target)) {
          return;
        }
        e.preventDefault();
        togglePlay();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [togglePlay]);

  const value: AudioPlayerContextValue = {
    currentNote,
    isPlaying,
    currentTime,
    duration,
    play,
    pause,
    togglePlay,
    seek,
    error,
  };

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
    </AudioPlayerContext.Provider>
  );
}

const defaultContextValue: AudioPlayerContextValue = {
  currentNote: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  play: () => {},
  pause: () => {},
  togglePlay: () => {},
  seek: () => {},
  error: null,
};

export function useAudioPlayer(): AudioPlayerContextValue {
  const context = useContext(AudioPlayerContext);
  return context || defaultContextValue;
}
