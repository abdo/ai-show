import { useState, useCallback, useRef } from 'react';

// Convert Int16Array to Float32Array for Web Audio API
function int16ToFloat32(int16Array: Int16Array): Float32Array {
  const float32Array = new Float32Array(int16Array.length);
  for (let i = 0; i < int16Array.length; i++) {
    float32Array[i] = int16Array[i] / (int16Array[i] < 0 ? 0x8000 : 0x7FFF);
  }
  return float32Array;
}

export function useAudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const audioChunksRef = useRef<ArrayBuffer[]>([]);

  const playAudio = useCallback(async (base64Audio: string) => {
    try {
      // Decode base64 to ArrayBuffer
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Skip if data is too small to be valid audio
      if (bytes.length < 2) {
        console.warn('Audio chunk too small, skipping');
        return;
      }

      // Store the chunk
      audioChunksRef.current.push(bytes.buffer);

      // Create audio context if needed
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext({ sampleRate: 24000 });
        nextStartTimeRef.current = audioContextRef.current.currentTime;
      }

      const audioContext = audioContextRef.current;

      // Convert to Int16Array (linear16) - handle odd lengths by truncating
      const int16Length = Math.floor(bytes.length / 2);
      const int16Array = new Int16Array(bytes.buffer, 0, int16Length);

      // Convert to Float32Array
      const float32Array = int16ToFloat32(int16Array);

      // Create audio buffer
      const audioBuffer = audioContext.createBuffer(
        1, // mono
        float32Array.length,
        24000 // sample rate
      );

      // Fill the buffer
      audioBuffer.getChannelData(0).set(float32Array);

      // Create source and schedule it
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);

      // Calculate when this chunk should start
      const currentTime = audioContext.currentTime;
      const startTime = Math.max(currentTime, nextStartTimeRef.current);

      // Update next start time
      nextStartTimeRef.current = startTime + audioBuffer.duration;

      // Start playback
      setIsPlaying(true);
      source.start(startTime);

      // When this chunk ends, check if it's the last one
      source.onended = () => {
        if (audioContext.currentTime >= nextStartTimeRef.current - 0.1) {
          setIsPlaying(false);
          audioChunksRef.current = [];
        }
      };

    } catch (err) {
      console.error('Failed to play audio:', err);
      setIsPlaying(false);
    }
  }, []);

  const stop = useCallback(() => {
    if (audioContextRef.current) {
      // Close and recreate on next play
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    nextStartTimeRef.current = 0;
    audioChunksRef.current = [];
    setIsPlaying(false);
  }, []);

  return {
    playAudio,
    stop,
    isPlaying
  };
}
