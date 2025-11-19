import { useCallback, useRef, useState } from "react";
import { openAiTTSApiKey } from "../keys.ignore";
import type { Character, DialogueLine } from "./usePerspectives";
import { cleanTextForSpeech } from "../lib/textCleaner";

type VoiceStatus = "idle" | "generating" | "ready" | "error";

type DialogueAudio = {
  dialogueIndex: number;
  characterId: string;
  status: VoiceStatus;
  audioSrc?: string;
  error?: string;
};

type AudioMap = Record<number, DialogueAudio>;

// Standardized character roles with specific voice configurations
// Note: Voice is determined by character gender, not role
type VoiceConfig = {
  instructions: string;
};

export type CharacterRole =
  | "empathetic"
  | "analytical"
  | "provocateur"
  | "emotional"
  | "calm"
  | "assertive"
  | "skeptical"
  | "optimistic"
  | "cynical"
  | "nurturing"
  | "intense"
  | "playful"
  | "serious"
  | "wise"
  | "rebellious"
  | "mediator"
  | "challenger"
  | "supporter"
  | "observer"
  | "wildcard";

// Export all available roles as an array for use in prompts
export const availableRoles: CharacterRole[] = [
  "empathetic",
  "analytical",
  "provocateur",
  "emotional",
  "calm",
  "assertive",
  "skeptical",
  "optimistic",
  "cynical",
  "nurturing",
  "intense",
  "playful",
  "serious",
  "wise",
  "rebellious",
  "mediator",
  "challenger",
  "supporter",
  "observer",
  "wildcard",
];

// Role descriptions for Groq prompt (human-readable explanations)
export const roleDescriptions: Record<CharacterRole, string> = {
  empathetic:
    "warm, understanding, compassionate with slower thoughtful speech",
  analytical: "logical, measured, precise with clear methodical thinking",
  provocateur: "bold, challenging, stirring with sharp faster speech",
  emotional: "raw, expressive, passionate with intense heartfelt delivery",
  calm: "peaceful, soothing, tranquil with slow steady pace",
  assertive: "confident, direct, commanding with slightly fast delivery",
  skeptical: "questioning, doubtful, critical with cautious measured tone",
  optimistic: "hopeful, upbeat, positive with bright enthusiastic energy",
  cynical: "pessimistic, sarcastic with dark dry humor delivery",
  nurturing: "caring, gentle, supportive with slow warm pace",
  intense: "powerful, fierce, focused with fast urgent speech",
  playful: "lighthearted, fun, teasing with quick lively banter",
  serious: "grave, deliberate, solemn with slow weighted pace",
  wise: "thoughtful, measured, insightful with calm sage-like delivery",
  rebellious: "defiant, quick, challenging with bold provocative energy",
  mediator: "balanced, neutral, diplomatic with calm peacemaker tone",
  challenger: "confrontational, direct, pushing with sharp assertive speech",
  supporter: "encouraging, motivating, uplifting with warm cheerleader energy",
  observer: "detached, watching, analytical with slow distant pace",
  wildcard: "unpredictable, spontaneous, erratic with constantly varying pace",
};

// Voice instructions for each standardized role (for gpt-4o-mini-tts)
// Voice selection is gender-based (set in usePerspectives), instructions are role-based
// Instructions are dynamically derived from roleDescriptions to avoid duplication
export const roleVoiceConfigs: Record<CharacterRole, VoiceConfig> =
  Object.fromEntries(
    availableRoles.map((role) => [
      role,
      { instructions: roleDescriptions[role] },
    ])
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
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const unlockedRef = useRef(false);

  const unlockAudio = useCallback(() => {
    unlockedRef.current = true;
  }, []);

  const generateAllVoices = useCallback(
    async (dialogue: DialogueLine[], characters: Character[]) => {
      if (!dialogue.length || !characters.length) return;

      setIsGenerating(true);
      setAudioMap({});

      // Build a character map for quick lookup
      const charMap = new Map(characters.map((c) => [c.id, c]));

      await Promise.all(
        dialogue.map(async (line, index) => {
          const character = charMap.get(line.characterId);
          if (!character) {
            console.warn(`Character ${line.characterId} not found`);
            return;
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
              return;
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

            setAudioMap((prev) => ({
              ...prev,
              [index]: {
                dialogueIndex: index,
                characterId: line.characterId,
                status: "ready",
                audioSrc,
              },
            }));
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
          }
        })
      );

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
        currentAudioRef.current = audioElement;
        setCurrentDialogueIndex(index);

        audioElement.onended = () => {
          setCurrentDialogueIndex(-1);
          onFinished?.();
        };

        // Add a small delay for the first audio to prevent cutting off the beginning
        const playDelay = isFirstAudio ? 500 : 0;

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
            // Small delay between lines
            setTimeout(playNext, 500);
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
  }, []);

  return {
    audioMap,
    isGenerating,
    currentDialogueIndex,
    generateAllVoices,
    playDialogue,
    playAllDialogue,
    stopAudio,
    unlockAudio,
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
