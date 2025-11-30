import { useState, useCallback, useRef } from 'react';

// Convert Float32Array to Int16Array (linear16 format)
function float32ToInt16(float32Array: Float32Array): Int16Array {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return int16Array;
}

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const onAudioDataRef = useRef<((data: ArrayBuffer) => void) | null>(null);

  const startRecording = useCallback(async (onAudioData: (data: ArrayBuffer) => void) => {
    try {
      onAudioDataRef.current = onAudioData;

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 48000
        }
      });
      streamRef.current = stream;

      // Create audio context at 48kHz
      const audioContext = new AudioContext({ sampleRate: 48000 });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);

      // Create processor (4096 buffer size)
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e: AudioProcessingEvent) => {
        if (!onAudioDataRef.current) return;

        const inputData = e.inputBuffer.getChannelData(0);

        // Convert Float32 to Int16 (linear16)
        const int16Data = float32ToInt16(inputData);

        // Send as ArrayBuffer
        onAudioDataRef.current(int16Data.buffer as ArrayBuffer);
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      setIsRecording(true);
      setError(null);
      console.log('🎤 Recording started');

    } catch (err) {
      console.error('Failed to start recording:', err);
      setError(err instanceof Error ? err.message : 'Microphone access denied');
    }
  }, []);

  const stopRecording = useCallback(() => {
    // Check if we have resources to clean up
    const hasResources = streamRef.current || processorRef.current || audioContextRef.current;

    // Stop all tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Disconnect processor
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    onAudioDataRef.current = null;
    setIsRecording(false);

    // Only log if we actually cleaned up resources
    if (hasResources) {
      console.log('🛑 Recording stopped');
    }
  }, []);

  return {
    startRecording,
    stopRecording,
    isRecording,
    error
  };
}
