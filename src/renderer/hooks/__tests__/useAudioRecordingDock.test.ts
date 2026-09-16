import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAudioRecordingDock } from '../useAudioRecordingDock';
import type { AudioRecorder, RecordingResult } from '../../audio/audio-recorder';

vi.mock('../../context/AudioPlayerContext', () => ({
  useAudioPlayer: () => ({
    outputVolume: 0.8,
    setOutputVolume: vi.fn(),
    stopPlayback: vi.fn(),
    getOutputLevels: () => ({ rms: 0, peak: 0, isClipping: false }),
  }),
}));

describe('useAudioRecordingDock (US1, US4)', () => {
  let mockRecorder: AudioRecorder;
  let mockRecordingResult: RecordingResult;

  beforeEach(() => {
    mockRecordingResult = {
      arrayBuffer: new ArrayBuffer(1024),
      durationSeconds: 3.5,
    };

    mockRecorder = {
      getState: vi.fn().mockReturnValue('idle'),
      getInputGain: vi.fn().mockReturnValue(1.0),
      setInputGain: vi.fn(),
      startRecording: vi.fn().mockResolvedValue(undefined),
      stopRecording: vi.fn().mockResolvedValue(mockRecordingResult),
      pauseRecording: vi.fn(),
      resumeRecording: vi.fn(),
      setMonitoring: vi.fn().mockResolvedValue(undefined),
      isMonitoringEnabled: vi.fn().mockReturnValue(false),
      getMeterLevels: vi.fn().mockReturnValue({
        preGainRms: 0.2,
        preGainPeak: 0.4,
        postGainRms: 0.2,
        postGainPeak: 0.4,
        isClipping: false,
      }),
    } as unknown as AudioRecorder;

    window.vaultAPI = {
      notes: {
        create: vi.fn().mockResolvedValue({ success: true, data: { id: 10, title: 'idea-10' } }),
      },
    } as unknown as typeof window.vaultAPI;
  });

  it('initializes in idle state with 0 elapsed seconds', () => {
    const { result } = renderHook(() =>
      useAudioRecordingDock({ recorderInstance: mockRecorder })
    );

    expect(result.current.state).toBe('idle');
    expect(result.current.elapsedSeconds).toBe(0);
    expect(result.current.formattedTime).toBe('0:00');
    expect(result.current.isPromptingMetadata).toBe(false);
  });

  it('starts recording, transitions to recording state, and stops recording to prompting state', async () => {
    const { result } = renderHook(() =>
      useAudioRecordingDock({ recorderInstance: mockRecorder })
    );

    await act(async () => {
      await result.current.startRecording();
    });

    expect(mockRecorder.startRecording).toHaveBeenCalled();
    expect(result.current.state).toBe('recording');

    await act(async () => {
      await result.current.stopRecording();
    });

    expect(mockRecorder.stopRecording).toHaveBeenCalled();
    expect(result.current.state).toBe('prompting');
    expect(result.current.isPromptingMetadata).toBe(true);
    expect(result.current.recordedDuration).toBe(3.5);
  });

  it('saves idea via vaultAPI and invokes onNoteSaved callback', async () => {
    const onNoteSaved = vi.fn();
    const { result } = renderHook(() =>
      useAudioRecordingDock({ recorderInstance: mockRecorder, onNoteSaved })
    );

    await act(async () => {
      await result.current.startRecording();
    });
    await act(async () => {
      await result.current.stopRecording();
    });

    await act(async () => {
      await result.current.saveIdea({
        title: 'Fresh Take',
        bpm: 120,
        musical_key: 'A Minor',
      });
    });

    expect(window.vaultAPI.notes.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Fresh Take',
        bpm: 120,
        musical_key: 'A Minor',
        format: 'wav',
        duration_seconds: 3.5,
      })
    );
    expect(onNoteSaved).toHaveBeenCalledTimes(1);
    expect(result.current.state).toBe('idle');
  });

  it('discards idea cleanly without saving', async () => {
    const onNoteSaved = vi.fn();
    const { result } = renderHook(() =>
      useAudioRecordingDock({ recorderInstance: mockRecorder, onNoteSaved })
    );

    await act(async () => {
      await result.current.startRecording();
    });
    await act(async () => {
      await result.current.stopRecording();
    });

    expect(result.current.state).toBe('prompting');

    act(() => {
      result.current.discardIdea();
    });

    expect(result.current.state).toBe('idle');
    expect(window.vaultAPI.notes.create).not.toHaveBeenCalled();
    expect(onNoteSaved).not.toHaveBeenCalled();
  });

  it('toggles self-monitoring and delegates to audio recorder', async () => {
    const { result } = renderHook(() =>
      useAudioRecordingDock({ recorderInstance: mockRecorder })
    );

    expect(result.current.isMonitoring).toBe(false);

    await act(async () => {
      await result.current.toggleMonitoring();
    });

    expect(result.current.isMonitoring).toBe(true);
    expect(mockRecorder.setMonitoring).toHaveBeenCalledWith(
      true,
      undefined,
      'stereo',
      undefined
    );

    await act(async () => {
      await result.current.toggleMonitoring();
    });

    expect(result.current.isMonitoring).toBe(false);
    expect(mockRecorder.setMonitoring).toHaveBeenCalledWith(
      false,
      undefined,
      'stereo',
      undefined
    );
  });
});
