import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import type { NoteWithInstruments } from '../hooks/useNotes';
import {
  getStoredOutputVolume,
  setStoredOutputVolume,
  getSelectedOutputDeviceId,
} from '../audio/device-manager';
import type { MeterSignalLevels } from '../types/recording-dock';
import { calculateAudioLevels } from '../audio/meter-service';

export interface AudioPlayerContextValue {
  currentNote: NoteWithInstruments | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  outputVolume: number;
  setOutputVolume: (volume: number) => void;
  play: (note: NoteWithInstruments) => void;
  pause: () => void;
  stopPlayback: () => void;
  togglePlay: (note?: NoteWithInstruments) => void;
  seek: (timeSeconds: number) => void;
  getOutputLevels: () => MeterSignalLevels;
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
  const [outputVolume, setOutputVolumeState] = useState<number>(() => getStoredOutputVolume());

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentNoteRef = useRef<NoteWithInstruments | null>(null);
  currentNoteRef.current = currentNote;

  const isPlayingRef = useRef<boolean>(false);
  isPlayingRef.current = isPlaying;

  const outputVolumeRef = useRef<number>(outputVolume);
  outputVolumeRef.current = outputVolume;

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audio.volume = Math.min(1.0, outputVolumeRef.current);
    audioRef.current = audio;

    const sinkId = getSelectedOutputDeviceId();
    if (
      sinkId &&
      typeof (audio as unknown as { setSinkId?: (id: string) => Promise<void> }).setSinkId ===
        'function'
    ) {
      (audio as unknown as { setSinkId: (id: string) => Promise<void> })
        .setSinkId(sinkId)
        .catch(() => {});
    }

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

    const setupWebAudioAnalyser = () => {
      if (analyserRef.current || !audio) return;
      try {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextClass) return;

        const ctx = new AudioContextClass();
        if (typeof ctx.createMediaElementSource !== 'function') return;

        const source = ctx.createMediaElementSource(audio);
        const gainNode = ctx.createGain();
        gainNode.gain.value = outputVolumeRef.current;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        source.connect(gainNode);
        gainNode.connect(analyser);
        analyser.connect(ctx.destination);

        // When routed through Web Audio, keep audio.volume at 1.0 so gainNode handles attenuation & boost
        audio.volume = 1.0;

        audioContextRef.current = ctx;
        sourceNodeRef.current = source;
        gainNodeRef.current = gainNode;
        analyserRef.current = analyser;
      } catch {
        // Fallback for environments where MediaElementSource is unavailable
      }
    };

    const handlePlay = () => {
      setupWebAudioAnalyser();
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().catch(() => {});
      }
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
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
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

  const setOutputVolume = useCallback((volume: number) => {
    const clamped = Math.max(0.0, Math.min(2.0, volume));
    setOutputVolumeState(clamped);
    outputVolumeRef.current = clamped;
    setStoredOutputVolume(clamped);
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = clamped;
      if (audioRef.current) {
        audioRef.current.volume = 1.0;
      }
    } else if (audioRef.current) {
      audioRef.current.volume = Math.min(1.0, clamped);
    }
  }, []);

  const stopPlayback = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);

  const getOutputLevels = useCallback((): MeterSignalLevels => {
    if (!isPlayingRef.current) {
      return { rms: 0, peak: 0, isClipping: false };
    }
    const analyser = analyserRef.current;
    if (analyser) {
      try {
        const buffer = new Float32Array(analyser.fftSize);
        analyser.getFloatTimeDomainData(buffer);
        return calculateAudioLevels(buffer);
      } catch {
        // fallback
      }
    }
    const vol = audioRef.current?.volume ?? outputVolumeRef.current;
    return {
      rms: Math.min(1.0, 0.45 * vol),
      peak: Math.min(1.0, 0.65 * vol),
      isClipping: vol >= 0.99 && Math.random() < 0.05,
    };
  }, []);

  const value: AudioPlayerContextValue = {
    currentNote,
    isPlaying,
    currentTime,
    duration,
    outputVolume,
    setOutputVolume,
    play,
    pause,
    stopPlayback,
    togglePlay,
    seek,
    getOutputLevels,
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
  outputVolume: 1.0,
  setOutputVolume: () => {},
  play: () => {},
  pause: () => {},
  stopPlayback: () => {},
  togglePlay: () => {},
  seek: () => {},
  getOutputLevels: () => ({ rms: 0, peak: 0, isClipping: false }),
  error: null,
};

export function useAudioPlayer(): AudioPlayerContextValue {
  const context = useContext(AudioPlayerContext);
  return context || defaultContextValue;
}
