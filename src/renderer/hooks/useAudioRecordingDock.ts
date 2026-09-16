import { useState, useRef, useEffect, useCallback } from 'react';
import { AudioRecorder, type RecordingResult } from '../audio/audio-recorder';
import {
  getAudioInputDevices,
  getAudioOutputDevices,
  getSelectedDeviceId,
  setSelectedDeviceId,
  getSelectedOutputDeviceId,
  setSelectedOutputDeviceId,
  getChannelMode,
  setChannelMode,
  getStoredInputGain,
  setStoredInputGain,
  subscribeToDeviceChanges,
} from '../audio/device-manager';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import type {
  DockRecordingState,
  AudioHardwareSettings,
  MeterSignalLevels,
  PostRecordingIdeaInput,
  AudioDeviceOption,
} from '../types/recording-dock';
import { formatDuration } from '../lib/format';

export interface UseAudioRecordingDockOptions {
  onNoteSaved?: () => void;
  recorderInstance?: AudioRecorder; // for testing injection
}

export function useAudioRecordingDock(options: UseAudioRecordingDockOptions = {}) {
  const { onNoteSaved, recorderInstance } = options;
  const { stopPlayback, outputVolume, setOutputVolume, getOutputLevels } = useAudioPlayer();

  const [state, setState] = useState<DockRecordingState>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [inputLevels, setInputLevels] = useState<MeterSignalLevels>({
    rms: 0,
    peak: 0,
    isClipping: false,
  });
  const [outputLevels, setOutputLevels] = useState<MeterSignalLevels>({
    rms: 0,
    peak: 0,
    isClipping: false,
  });

  const [inputGain, setInputGainState] = useState<number>(() => getStoredInputGain());
  const [isMonitoring, setIsMonitoring] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [availableInputs, setAvailableInputs] = useState<AudioDeviceOption[]>([]);
  const [availableOutputs, setAvailableOutputs] = useState<AudioDeviceOption[]>([]);
  const [recordedResult, setRecordedResult] = useState<RecordingResult | null>(null);

  const [hardwareSettings, setHardwareSettings] = useState<AudioHardwareSettings>(() => ({
    inputDeviceId: getSelectedDeviceId() || 'default',
    outputDeviceId: getSelectedOutputDeviceId() || 'default',
    channelMode: getChannelMode(),
    inputGain: getStoredInputGain(),
    outputVolume,
  }));

  const recorderRef = useRef<AudioRecorder | null>(recorderInstance || null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Initialize recorder and sync gain
  const getOrCreateRecorder = useCallback((): AudioRecorder => {
    if (!recorderRef.current) {
      recorderRef.current = new AudioRecorder();
    }
    recorderRef.current.setInputGain(inputGain);
    return recorderRef.current;
  }, [inputGain]);

  // Load hardware devices
  const refreshDevices = useCallback(async () => {
    try {
      const [inputs, outputs] = await Promise.all([
        getAudioInputDevices(),
        getAudioOutputDevices(),
      ]);
      const mappedInputs: AudioDeviceOption[] = inputs.map((d) => ({
        ...d,
        kind: 'audioinput',
      }));
      setAvailableInputs(mappedInputs);
      setAvailableOutputs(outputs);
    } catch {
      // Fallback
    }
  }, []);

  useEffect(() => {
    refreshDevices();
    const unsubscribe = subscribeToDeviceChanges({
      onDevicesChanged: () => {
        refreshDevices();
      },
    });
    return () => {
      unsubscribe();
    };
  }, [refreshDevices]);

  // Handle input gain change
  const setInputGain = useCallback((gain: number) => {
    const clamped = Math.max(0.0, Math.min(2.0, gain));
    setInputGainState(clamped);
    setStoredInputGain(clamped);
    if (recorderRef.current) {
      recorderRef.current.setInputGain(clamped);
    }
  }, []);

  // Update hardware settings
  const updateHardwareSettings = useCallback((updates: Partial<AudioHardwareSettings>) => {
    setHardwareSettings((prev) => {
      const next = { ...prev, ...updates };
      if (updates.inputDeviceId !== undefined) {
        setSelectedDeviceId(updates.inputDeviceId);
      }
      if (updates.outputDeviceId !== undefined) {
        setSelectedOutputDeviceId(updates.outputDeviceId);
      }
      if (updates.channelMode !== undefined) {
        setChannelMode(updates.channelMode);
      }
      if (updates.inputGain !== undefined) {
        setInputGain(updates.inputGain);
      }
      if (updates.outputVolume !== undefined) {
        setOutputVolume(updates.outputVolume);
      }
      if (
        (updates.inputDeviceId !== undefined ||
          updates.outputDeviceId !== undefined ||
          updates.channelMode !== undefined) &&
        isMonitoring &&
        recorderRef.current &&
        typeof recorderRef.current.setMonitoring === 'function'
      ) {
        const inp = updates.inputDeviceId ?? prev.inputDeviceId;
        const out = updates.outputDeviceId ?? prev.outputDeviceId;
        const ch = updates.channelMode ?? prev.channelMode;
        recorderRef.current
          .setMonitoring(
            true,
            inp !== 'default' ? inp : undefined,
            ch,
            out !== 'default' ? out : undefined
          )
          .catch(() => {});
      }
      return next;
    });
  }, [isMonitoring, setInputGain, setOutputVolume]);

  // Toggle self-monitoring
  const toggleMonitoring = useCallback(async () => {
    const next = !isMonitoring;
    setIsMonitoring(next);
    const recorder = getOrCreateRecorder();
    const deviceId =
      hardwareSettings.inputDeviceId !== 'default'
        ? hardwareSettings.inputDeviceId
        : undefined;
    const outputDeviceId =
      hardwareSettings.outputDeviceId !== 'default'
        ? hardwareSettings.outputDeviceId
        : undefined;

    if (typeof recorder.setMonitoring === 'function') {
      await recorder.setMonitoring(
        next,
        deviceId,
        hardwareSettings.channelMode,
        outputDeviceId
      );
    }
  }, [isMonitoring, getOrCreateRecorder, hardwareSettings]);

  // Clean up monitoring on unmount
  useEffect(() => {
    return () => {
      if (recorderRef.current && typeof recorderRef.current.setMonitoring === 'function') {
        recorderRef.current.setMonitoring(false).catch(() => {});
      }
    };
  }, []);

  // Real-time metering and timer loop
  useEffect(() => {
    let active = true;

    const DECAY = 0.82;
    let smoothInRms = 0;
    let smoothInPeak = 0;
    let smoothOutRms = 0;
    let smoothOutPeak = 0;
    let lastRenderedIn = { rms: 0, peak: 0, isClipping: false };
    let lastRenderedOut = { rms: 0, peak: 0, isClipping: false };

    const tick = () => {
      if (!active) return;

      // Sample input meter
      if (recorderRef.current && (state === 'recording' || state === 'idle')) {
        const rawIn = recorderRef.current.getMeterLevels();

        // Instant attack, smooth exponential decay
        smoothInRms =
          rawIn.postGainRms >= smoothInRms
            ? rawIn.postGainRms
            : Math.max(0, smoothInRms * DECAY);
        if (smoothInRms < 0.001) smoothInRms = 0;

        smoothInPeak =
          rawIn.postGainPeak >= smoothInPeak
            ? rawIn.postGainPeak
            : Math.max(0, smoothInPeak * DECAY);
        if (smoothInPeak < 0.001) smoothInPeak = 0;

        const nextIn = {
          rms: smoothInRms,
          peak: smoothInPeak,
          isClipping: rawIn.isClipping,
        };

        if (
          Math.abs(nextIn.rms - lastRenderedIn.rms) > 0.003 ||
          Math.abs(nextIn.peak - lastRenderedIn.peak) > 0.003 ||
          nextIn.isClipping !== lastRenderedIn.isClipping
        ) {
          lastRenderedIn = nextIn;
          setInputLevels(nextIn);
        }
      } else {
        if (lastRenderedIn.rms > 0 || lastRenderedIn.peak > 0) {
          lastRenderedIn = { rms: 0, peak: 0, isClipping: false };
          setInputLevels(lastRenderedIn);
        }
      }

      // Sample output meter
      const rawOut = getOutputLevels();
      smoothOutRms =
        rawOut.rms >= smoothOutRms
          ? rawOut.rms
          : Math.max(0, smoothOutRms * DECAY);
      if (smoothOutRms < 0.001) smoothOutRms = 0;

      smoothOutPeak =
        rawOut.peak >= smoothOutPeak
          ? rawOut.peak
          : Math.max(0, smoothOutPeak * DECAY);
      if (smoothOutPeak < 0.001) smoothOutPeak = 0;

      const nextOut = {
        rms: smoothOutRms,
        peak: smoothOutPeak,
        isClipping: rawOut.isClipping,
      };

      if (
        Math.abs(nextOut.rms - lastRenderedOut.rms) > 0.003 ||
        Math.abs(nextOut.peak - lastRenderedOut.peak) > 0.003 ||
        nextOut.isClipping !== lastRenderedOut.isClipping
      ) {
        lastRenderedOut = nextOut;
        setOutputLevels(nextOut);
      }

      rafIdRef.current = requestAnimationFrame(tick);
    };

    rafIdRef.current = requestAnimationFrame(tick);

    return () => {
      active = false;
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [state, getOutputLevels]);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      setError(null);
      stopPlayback(); // Stop any playing audio to avoid feedback

      const recorder = getOrCreateRecorder();
      const deviceId =
        hardwareSettings.inputDeviceId !== 'default'
          ? hardwareSettings.inputDeviceId
          : undefined;

      await recorder.startRecording(deviceId, hardwareSettings.channelMode);
      setState('recording');
      setElapsedSeconds(0);
      startTimeRef.current = Date.now();

      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to start recording';
      setError(msg);
      setState('idle');
    }
  }, [getOrCreateRecorder, hardwareSettings.inputDeviceId, stopPlayback]);

  // Stop recording
  const stopRecording = useCallback(async () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (!recorderRef.current || state !== 'recording') {
      return;
    }

    setState('processing');
    try {
      const result = await recorderRef.current.stopRecording();
      setRecordedResult(result);
      setState('prompting');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to process recording';
      setError(msg);
      setState('idle');
    }
  }, [state]);

  // Save idea
  const saveIdea = useCallback(
    async (metadata: PostRecordingIdeaInput) => {
      if (!recordedResult) return;

      try {
        setError(null);
        if (typeof window !== 'undefined' && window.vaultAPI?.notes?.create) {
          const parsedInstruments = metadata.instruments
            ? metadata.instruments
                .split(',')
                .map((i) => i.trim())
                .filter((i) => i.length > 0)
            : undefined;

          const res = await window.vaultAPI.notes.create({
            title: metadata.title.trim().length > 0 ? metadata.title.trim() : undefined,
            audio_buffer: recordedResult.arrayBuffer,
            format: 'wav',
            duration_seconds: recordedResult.durationSeconds,
            bpm: metadata.bpm ?? null,
            musical_key: metadata.musical_key || null,
            authors: metadata.authors || null,
            song_section: metadata.song_section || null,
            notes: metadata.notes || null,
            instrument_names: parsedInstruments,
          });

          if (!res.success) {
            throw new Error(res.error);
          }
        }

        if (onNoteSaved) {
          onNoteSaved();
        }

        setRecordedResult(null);
        setState('idle');
        setElapsedSeconds(0);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to save idea';
        setError(msg);
      }
    },
    [recordedResult, onNoteSaved]
  );

  // Discard idea
  const discardIdea = useCallback(() => {
    setRecordedResult(null);
    setState('idle');
    setElapsedSeconds(0);
  }, []);

  return {
    state,
    elapsedSeconds,
    formattedTime: formatDuration(elapsedSeconds),
    error,
    startRecording,
    stopRecording,
    inputGain,
    setInputGain,
    outputVolume,
    setOutputVolume,
    inputLevels,
    outputLevels,
    isPromptingMetadata: state === 'prompting',
    recordedDuration: recordedResult?.durationSeconds ?? 0,
    saveIdea,
    discardIdea,
    isSettingsOpen,
    openSettings: () => setIsSettingsOpen(true),
    closeSettings: () => setIsSettingsOpen(false),
    hardwareSettings,
    updateHardwareSettings,
    availableInputs,
    availableOutputs,
    isMonitoring,
    toggleMonitoring,
  };
}
