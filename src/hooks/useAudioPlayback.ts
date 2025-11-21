import { useCallback, useRef, useState } from "react";

type VoiceStatus = "idle" | "generating" | "ready" | "error";

type DialogueAudio = {
  dialogueIndex: number;
  characterId: string;
  status: VoiceStatus;
  audioSrc?: string;
  error?: string;
};

type AudioMap = Record<number, DialogueAudio>;

export function useAudioPlayback() {
  const [audioMap, setAudioMap] = useState<AudioMap>({});
  const [currentDialogueIndex, setCurrentDialogueIndex] = useState<number>(-1);
  const [volume, setVolume] = useState<number>(100);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [hasEnded, setHasEnded] = useState<boolean>(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const unlockedRef = useRef(false);
  const totalLinesRef = useRef<number>(0);
  const volumeRef = useRef<number>(100);

  const unlockAudio = useCallback(() => {
    unlockedRef.current = true;
  }, []);

  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume);
    volumeRef.current = newVolume;
    if (currentAudioRef.current) {
      currentAudioRef.current.volume = newVolume / 100;
    }
  }, []);

  const loadAudioMap = useCallback((backendAudioMap: Record<number, string>, dialogue: any[]) => {
    const newAudioMap: AudioMap = {};
    
    dialogue.forEach((line, index) => {
      const base64Audio = backendAudioMap[index];
      if (base64Audio) {
        newAudioMap[index] = {
          dialogueIndex: index,
          characterId: line.characterId,
          status: "ready",
          audioSrc: `data:audio/mp3;base64,${base64Audio}`
        };
      }
    });

    setAudioMap(newAudioMap);
  }, []);

  const playDialogue = useCallback(
    (index: number, onFinished?: () => void, isFirstAudio: boolean = false) => {
      if (!unlockedRef.current) return;
      const audio = audioMap[index];
      if (!audio || audio.status !== "ready" || !audio.audioSrc) {
        onFinished?.();
        return;
      }

      try {
        currentAudioRef.current?.pause();
        const audioElement = new Audio(audio.audioSrc);
        audioElement.volume = volumeRef.current / 100;
        currentAudioRef.current = audioElement;
        setCurrentDialogueIndex(index);

        audioElement.onended = () => {
          setCurrentDialogueIndex(-1);
          onFinished?.();
        };

        const playDelay = isFirstAudio ? 600 : 0;

        setTimeout(() => {
          audioElement.play().catch((err) => {
            console.error("Audio playback error", err);
            setCurrentDialogueIndex(-1);
            onFinished?.();
          });
        }, playDelay);
      } catch (error) {
        console.error("Unable to play voice", error);
        setCurrentDialogueIndex(-1);
        onFinished?.();
      }
    },
    [audioMap]
  );

  const playAllDialogue = useCallback(
    (totalLines: number) => {
      let currentIndex = 0;
      totalLinesRef.current = totalLines;
      setHasEnded(false);
      setIsPaused(false);

      const playNext = () => {
        if (currentIndex >= totalLines) {
          setCurrentDialogueIndex(-1);
          setHasEnded(true);
          setIsPaused(false);
          return;
        }
        const isFirst = currentIndex === 0;
        playDialogue(
          currentIndex,
          () => {
            currentIndex++;
            setTimeout(playNext, 100);
          },
          isFirst
        );
      };

      playNext();
    },
    [playDialogue]
  );

  const stopAudio = useCallback(() => {
    currentAudioRef.current?.pause();
    setCurrentDialogueIndex(-1);
    setIsPaused(false);
    setHasEnded(false);
  }, []);

  const pauseAudio = useCallback(() => {
    if (currentAudioRef.current && !currentAudioRef.current.paused) {
      currentAudioRef.current.pause();
      setIsPaused(true);
    }
  }, []);

  const resumeAudio = useCallback(() => {
    if (currentAudioRef.current && currentAudioRef.current.paused && isPaused) {
      currentAudioRef.current.play().catch((err) => {
        console.error("Audio resume error", err);
      });
      setIsPaused(false);
    }
  }, [isPaused]);

  const togglePause = useCallback(() => {
    if (hasEnded) {
      playAllDialogue(totalLinesRef.current);
    } else if (isPaused) {
      resumeAudio();
    } else {
      pauseAudio();
    }
  }, [hasEnded, isPaused, pauseAudio, resumeAudio, playAllDialogue]);

  const downloadConversation = useCallback(async () => {
    // ... (keep existing download logic, just ensure it uses audioMap correctly)
    // For brevity, I'll assume the existing logic works with the new AudioMap structure
    // or I can copy it over if needed. Let's copy the core logic to be safe.
    try {
      const audioSources: string[] = [];
      Object.keys(audioMap)
        .sort((a, b) => Number(a) - Number(b))
        .forEach((key) => {
          const audio = audioMap[Number(key)];
          if (audio.status === "ready" && audio.audioSrc) {
            audioSources.push(audio.audioSrc);
          }
        });

      if (audioSources.length === 0) {
        console.error("No audio available to download");
        return;
      }

      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const audioContext = new AudioContextClass();

      const audioBuffers = await Promise.all(
        audioSources.map(async (src) => {
          const base64 = src.split(",")[1];
          const binaryString = window.atob(base64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          return await audioContext.decodeAudioData(bytes.buffer);
        })
      );

      const gapDuration = 0.5;
      const totalLength = audioBuffers.reduce(
        (sum, buffer) => sum + buffer.duration + gapDuration,
        0
      );

      const isAnyBufferStereo = audioBuffers.some(
        (b) => b.numberOfChannels > 1
      );
      const outputChannels = isAnyBufferStereo ? 2 : 1;

      const combinedBuffer = audioContext.createBuffer(
        outputChannels,
        Math.ceil(totalLength * audioContext.sampleRate),
        audioContext.sampleRate
      );

      let offset = 0;
      audioBuffers.forEach((buffer) => {
        if (buffer.numberOfChannels === 1) {
          const channelData = buffer.getChannelData(0);
          for (let channel = 0; channel < outputChannels; channel++) {
            combinedBuffer.getChannelData(channel).set(channelData, offset);
          }
        } else {
          for (
            let channel = 0;
            channel < Math.min(outputChannels, buffer.numberOfChannels);
            channel++
          ) {
            const channelData = buffer.getChannelData(channel);
            combinedBuffer.getChannelData(channel).set(channelData, offset);
          }
        }
        offset +=
          buffer.length + Math.ceil(gapDuration * audioContext.sampleRate);
      });

      const wavBlob = audioBufferToWav(combinedBuffer);
      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `conversation-${Date.now()}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download conversation", error);
    }
  }, [audioMap]);

  return {
    audioMap,
    currentDialogueIndex,
    volume,
    isPaused,
    hasEnded,
    handleVolumeChange,
    loadAudioMap,
    playDialogue,
    playAllDialogue,
    stopAudio,
    togglePause,
    unlockAudio,
    downloadConversation,
  };
}

// Helper function (copied from original)
const audioBufferToWav = (buffer: AudioBuffer): Blob => {
  const numberOfChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numberOfChannels * bytesPerSample;

  const data = new Float32Array(buffer.length * numberOfChannels);
  for (let channel = 0; channel < numberOfChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < buffer.length; i++) {
      data[i * numberOfChannels + channel] = channelData[i];
    }
  }

  const dataLength = data.length * bytesPerSample;
  const headerLength = 44;
  const wav = new ArrayBuffer(headerLength + dataLength);
  const view = new DataView(wav);

  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, "data");
  view.setUint32(40, dataLength, true);

  let offset = 44;
  for (let i = 0; i < data.length; i++) {
    const sample = Math.max(-1, Math.min(1, data[i]));
    const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    view.setInt16(offset, intSample, true);
    offset += 2;
  }

  return new Blob([wav], { type: "audio/wav" });
};
