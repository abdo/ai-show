import { useCallback, useRef, useState } from "react";
import { openAiTTSApiKey } from "../keys.ignore";
import type { Character, DialogueLine } from "./usePerspectives";
import { cleanTextForSpeech } from "../lib/textCleaner";
import {
  type CharacterRole,
  availableRoles,
  roleDescriptions,
} from "../constants/theatreCharacters";

type VoiceStatus = "idle" | "generating" | "ready" | "error";

type DialogueAudio = {
  dialogueIndex: number;
  characterId: string;
  status: VoiceStatus;
  audioSrc?: string;
  error?: string;
};

type AudioMap = Record<number, DialogueAudio>;

type VoiceConfig = {
  instructions: string;
};

// Voice instructions for each standardized role (for gpt-4o-mini-tts)
// Voice selection is gender-based (set in usePerspectives), instructions are role-based
// Instructions are dynamically derived from roleDescriptions to avoid duplication
const roleVoiceConfigs: Record<CharacterRole, VoiceConfig> = Object.fromEntries(
  availableRoles.map((role) => [role, { instructions: roleDescriptions[role] }])
) as Record<CharacterRole, VoiceConfig>;

// Extract standardized role from character's role text
const extractRole = (roleText: string): CharacterRole => {
  const normalized = roleText.toLowerCase();

  // Match keywords to standardized roles
  if (
    normalized.includes("empathetic") ||
    normalized.includes("empathy") ||
    normalized.includes("bridge")
  )
    return "empathetic";
  if (
    normalized.includes("analytical") ||
    normalized.includes("analyzer") ||
    normalized.includes("rational")
  )
    return "analytical";
  if (
    normalized.includes("provocateur") ||
    normalized.includes("challenge") ||
    normalized.includes("provocative")
  )
    return "provocateur";
  if (
    normalized.includes("emotional") ||
    normalized.includes("raw") ||
    normalized.includes("passionate")
  )
    return "emotional";
  if (normalized.includes("calm") || normalized.includes("peaceful"))
    return "calm";
  if (
    normalized.includes("assertive") ||
    normalized.includes("confident") ||
    normalized.includes("bold")
  )
    return "assertive";
  if (
    normalized.includes("skeptical") ||
    normalized.includes("doubtful") ||
    normalized.includes("questioning")
  )
    return "skeptical";
  if (
    normalized.includes("optimistic") ||
    normalized.includes("hopeful") ||
    normalized.includes("positive")
  )
    return "optimistic";
  if (
    normalized.includes("cynical") ||
    normalized.includes("pessimistic") ||
    normalized.includes("jaded")
  )
    return "cynical";
  if (
    normalized.includes("nurturing") ||
    normalized.includes("caring") ||
    normalized.includes("supportive")
  )
    return "nurturing";
  if (
    normalized.includes("intense") ||
    normalized.includes("fierce") ||
    normalized.includes("powerful")
  )
    return "intense";
  if (
    normalized.includes("playful") ||
    normalized.includes("lighthearted") ||
    normalized.includes("fun")
  )
    return "playful";
  if (
    normalized.includes("serious") ||
    normalized.includes("grave") ||
    normalized.includes("solemn")
  )
    return "serious";
  if (normalized.includes("wise") || normalized.includes("sage")) return "wise";
  if (
    normalized.includes("rebellious") ||
    normalized.includes("rebel") ||
    normalized.includes("defiant")
  )
    return "rebellious";
  if (
    normalized.includes("mediator") ||
    normalized.includes("peacemaker") ||
    normalized.includes("neutral")
  )
    return "mediator";
  if (
    normalized.includes("challenger") ||
    normalized.includes("confrontational")
  )
    return "challenger";
  if (normalized.includes("supporter") || normalized.includes("cheerleader"))
    return "supporter";
  if (
    normalized.includes("observer") ||
    normalized.includes("watcher") ||
    normalized.includes("detached")
  )
    return "observer";
  if (
    normalized.includes("wildcard") ||
    normalized.includes("wild card") ||
    normalized.includes("unpredictable")
  )
    return "wildcard";

  // Default fallback
  return "mediator";
};

export function usePersonaVoices() {
  const [audioMap, setAudioMap] = useState<AudioMap>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentDialogueIndex, setCurrentDialogueIndex] = useState<number>(-1);
  const [volume, setVolume] = useState<number>(100);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const unlockedRef = useRef(false);

  const unlockAudio = useCallback(() => {
    unlockedRef.current = true;
  }, []);

  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume);
    // Update current audio if playing
    if (currentAudioRef.current) {
      currentAudioRef.current.volume = newVolume / 100;
    }
  }, []);

  const generateAllVoices = useCallback(
    async (dialogue: DialogueLine[], characters: Character[]) => {
      if (!dialogue.length || !characters.length) return;

      setIsGenerating(true);
      setAudioMap({});

      // Check for mock mode
      const isMock = localStorage.getItem("mock") === "true";
      if (isMock) {
        const cachedVoices = localStorage.getItem("mock_voices");
        if (cachedVoices) {
          console.log("Using cached mock voices");
          try {
            const parsedVoices = JSON.parse(cachedVoices) as AudioMap;
            // Add small artificial delay
            await new Promise((resolve) => setTimeout(resolve, 1000));
            setAudioMap(parsedVoices);
            setIsGenerating(false);
            return;
          } catch (e) {
            console.warn("Failed to parse cached voices", e);
          }
        }
      }

      // Build a character map for quick lookup
      const charMap = new Map(characters.map((c) => [c.id, c]));

      const results = await Promise.all(
        dialogue.map(async (line, index) => {
          const character = charMap.get(line.characterId);
          if (!character) {
            console.warn(`Character ${line.characterId} not found`);
            return undefined;
          }

          try {
            // Clean the text before sending to TTS
            const cleanedText = cleanTextForSpeech(line.text);

            // Get role-based configuration for instructions
            const characterRole = extractRole(character.role);
            const roleConfig = roleVoiceConfigs[characterRole];

            // Use the character's assigned voiceId (gender-appropriate from usePerspectives)
            const voiceId = character.voiceId;

            if (!voiceId) {
              console.error(
                `[Voice ${index}] ${character.name} is missing voiceId!`
              );
              return undefined;
            }

            console.log(
              `[Voice ${index}] ${character.name} (${character.gender}, ${characterRole}): voice=${voiceId}, model=gpt-4o-mini-tts`
            );
            console.log(
              `  Instructions: ${roleConfig.instructions.substring(0, 80)}...`
            );

            const response = await fetch(
              "https://api.openai.com/v1/audio/speech",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${openAiTTSApiKey}`,
                },
                body: JSON.stringify({
                  model: "gpt-4o-mini-tts",
                  voice: voiceId,
                  speed: 1.1,
                  input: cleanedText,
                  instructions: roleConfig.instructions,
                }),
              }
            );

            if (!response.ok) {
              const errorText = await response.text();
              console.error(
                `[Voice ${index}] OpenAI API Error ${response.status}:`,
                errorText
              );
              throw new Error(`OpenAI TTS ${response.status}: ${errorText}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const audioSrc = arrayBufferToDataUri(arrayBuffer);

            const audioItem: DialogueAudio = {
              dialogueIndex: index,
              characterId: line.characterId,
              status: "ready",
              audioSrc,
            };

            setAudioMap((prev) => ({
              ...prev,
              [index]: audioItem,
            }));

            return audioItem;
          } catch (error) {
            console.error(`Voice generation error for line ${index}`, error);
            setAudioMap((prev) => ({
              ...prev,
              [index]: {
                dialogueIndex: index,
                characterId: line.characterId,
                status: "error",
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to generate voice",
              },
            }));
            return undefined;
          }
        })
      );

      // Cache the voices if we have a full set (or at least some)
      const newAudioMap: AudioMap = {};
      let hasData = false;
      results.forEach((result) => {
        if (result) {
          newAudioMap[result.dialogueIndex] = result;
          hasData = true;
        }
      });

      if (hasData) {
        try {
          localStorage.setItem("mock_voices", JSON.stringify(newAudioMap));
        } catch (e) {
          console.warn(
            "Failed to cache voices to localStorage (quota likely exceeded)",
            e
          );
        }
      }

      setIsGenerating(false);
    },
    []
  );

  const playDialogue = useCallback(
    (index: number, onFinished?: () => void, isFirstAudio: boolean = false) => {
      if (!unlockedRef.current) return;
      const audio = audioMap[index];
      if (!audio || audio.status !== "ready" || !audio.audioSrc) {
        // If audio not ready, skip to next
        onFinished?.();
        return;
      }

      try {
        currentAudioRef.current?.pause();
        const audioElement = new Audio(audio.audioSrc);
        audioElement.volume = volume / 100;
        currentAudioRef.current = audioElement;
        setCurrentDialogueIndex(index);

        audioElement.onended = () => {
          setCurrentDialogueIndex(-1);
          onFinished?.();
        };

        // Add a small delay for the first audio to prevent cutting off the beginning
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
    [audioMap, volume]
  );

  const playAllDialogue = useCallback(
    (totalLines: number) => {
      let currentIndex = 0;

      const playNext = () => {
        if (currentIndex >= totalLines) {
          setCurrentDialogueIndex(-1);
          return;
        }
        const isFirst = currentIndex === 0;
        playDialogue(
          currentIndex,
          () => {
            currentIndex++;
            // Minimal delay between lines for natural flow
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
    if (isPaused) {
      resumeAudio();
    } else {
      pauseAudio();
    }
  }, [isPaused, pauseAudio, resumeAudio]);

  const downloadConversation = useCallback(async () => {
    try {
      // Get all audio sources in order
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

      // Create audio context
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();

      // Decode all audio data
      const audioBuffers = await Promise.all(
        audioSources.map(async (src) => {
          // Convert data URI to array buffer
          const base64 = src.split(",")[1];
          const binaryString = window.atob(base64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          return await audioContext.decodeAudioData(bytes.buffer);
        })
      );

      // Calculate total length (including 0.5s gaps between clips)
      const gapDuration = 0.5; // 500ms gap between dialogue lines
      const totalLength = audioBuffers.reduce(
        (sum, buffer) => sum + buffer.duration + gapDuration,
        0
      );

      // Determine if we need mono or stereo output
      const isAnyBufferStereo = audioBuffers.some(
        (b) => b.numberOfChannels > 1
      );
      const outputChannels = isAnyBufferStereo ? 2 : 1;

      // Create a new buffer for the combined audio
      const combinedBuffer = audioContext.createBuffer(
        outputChannels,
        Math.ceil(totalLength * audioContext.sampleRate),
        audioContext.sampleRate
      );

      // Copy all audio buffers into the combined buffer
      let offset = 0;
      audioBuffers.forEach((buffer) => {
        if (buffer.numberOfChannels === 1) {
          // Mono source: copy to all output channels
          const channelData = buffer.getChannelData(0);
          for (let channel = 0; channel < outputChannels; channel++) {
            combinedBuffer.getChannelData(channel).set(channelData, offset);
          }
        } else {
          // Stereo source: copy each channel
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

      // Convert to WAV
      const wavBlob = audioBufferToWav(combinedBuffer);

      // Create download link
      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `conversation-${Date.now()}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log("Conversation downloaded successfully");
    } catch (error) {
      console.error("Failed to download conversation", error);
    }
  }, [audioMap]);

  return {
    audioMap,
    isGenerating,
    currentDialogueIndex,
    volume,
    isPaused,
    handleVolumeChange,
    generateAllVoices,
    playDialogue,
    playAllDialogue,
    stopAudio,
    togglePause,
    unlockAudio,
    downloadConversation,
  };
}

const arrayBufferToDataUri = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  const base64 = window.btoa(binary);
  return `data:audio/mp3;base64,${base64}`;
};

// Convert AudioBuffer to WAV format
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

  // Write WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, format, true);
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true); // byte rate
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, "data");
  view.setUint32(40, dataLength, true);

  // Write audio data
  let offset = 44;
  for (let i = 0; i < data.length; i++) {
    const sample = Math.max(-1, Math.min(1, data[i]));
    const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    view.setInt16(offset, intSample, true);
    offset += 2;
  }

  return new Blob([wav], { type: "audio/wav" });
};
