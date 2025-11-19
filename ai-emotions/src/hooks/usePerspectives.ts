import { useCallback, useState } from "react";
import axios from "axios";
import { groqApiKey } from "../keys.ignore";
import {
  pravatarImgIdsForMales,
  pravatarImgIdsForFemales,
} from "../lib/avatarConstants";
import { maleVoices, femaleVoices } from "../constants/theatreCharacters";
import { storyGenerationPrompt } from "../constants/prompts";
import { demoStory } from "../constants/demoData";

export type Character = {
  id: string;
  name: string;
  gender: "male" | "female";
  role: string;
  image: string;
  borderColor: string;
  gradient: string;
  voiceId: string;
};

export type DialogueLine = {
  characterId: string;
  text: string;
};

export type StoryData = {
  characters: Character[];
  dialogue: DialogueLine[];
};

type PerspectivesState = {
  story: StoryData | null;
  isLoading: boolean;
  error: string | null;
};

// Helper to get random avatar ID for gender
const getRandomAvatarId = (
  gender: "male" | "female",
  usedIds: Set<number>
): number => {
  const pool =
    gender === "male" ? pravatarImgIdsForMales : pravatarImgIdsForFemales;
  const available = pool.filter((id) => !usedIds.has(id));
  if (available.length === 0) {
    // If all used, pick randomly from pool
    return pool[Math.floor(Math.random() * pool.length)];
  }
  return available[Math.floor(Math.random() * available.length)];
};

// Helper to get random voice for gender, avoiding repetition when possible
const getRandomVoice = (
  gender: "male" | "female",
  usedVoices: Set<string>
): string => {
  const pool = gender === "male" ? maleVoices : femaleVoices;
  const available = pool.filter((voice) => !usedVoices.has(voice));

  // If we still have unused voices, pick from them
  // Otherwise, pick from the entire pool
  const selectionPool = available.length > 0 ? available : pool;

  return selectionPool[Math.floor(Math.random() * selectionPool.length)];
};

const extractJson = (raw: string) => {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("No JSON found in response");
  }
  return cleaned.slice(start, end + 1);
};

export function usePerspectives() {
  const [state, setState] = useState<PerspectivesState>({
    story: null,
    isLoading: false,
    error: null,
  });

  const fetchStory = useCallback(async (userInput: string) => {
    if (!userInput.trim()) return;

    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      // Check for mock mode
      const isMock = localStorage.getItem("mock") === "true";
      if (isMock) {
        const cachedStory = localStorage.getItem("mock_story");
        if (cachedStory) {
          console.log("Using cached mock story");
          const story = JSON.parse(cachedStory) as StoryData;
          // Add small artificial delay to simulate loading
          await new Promise((resolve) => setTimeout(resolve, 1000));
          setState({ story, isLoading: false, error: null });
          return;
        }
      }

      const response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama-3.3-70b-versatile",
          temperature: 0.9,
          top_p: 0.95,
          messages: [
            {
              role: "system",
              content: storyGenerationPrompt.replace(
                "[will be inserted]",
                userInput.trim()
              ),
            },
            {
              role: "user",
              content: `Create the conversation about: "${userInput.trim()}"`,
            },
          ],
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${groqApiKey}`,
          },
        }
      );

      const answer = response.data?.choices?.[0]?.message?.content ?? "";
      const jsonString = extractJson(answer);
      const parsed = JSON.parse(jsonString) as StoryData;

      if (
        !parsed.characters ||
        !Array.isArray(parsed.characters) ||
        parsed.characters.length === 0 ||
        !parsed.dialogue ||
        !Array.isArray(parsed.dialogue) ||
        parsed.dialogue.length === 0
      ) {
        throw new Error("Invalid story structure");
      }

      // Track used avatar IDs and voices to ensure uniqueness
      const usedAvatarIds = new Set<number>();
      const usedVoices = new Set<string>();

      // Ensure all characters have required fields
      const characters = parsed.characters.slice(0, 6).map((char, index) => {
        const gender = char.gender || (index % 2 === 0 ? "male" : "female");
        const avatarId = getRandomAvatarId(gender, usedAvatarIds);
        usedAvatarIds.add(avatarId);

        const voiceId = getRandomVoice(gender, usedVoices);
        usedVoices.add(voiceId);

        return {
          id: char.id || `character-${index}`,
          name: char.name || `Character ${index + 1}`,
          gender: gender,
          role: char.role || "Participant",
          image: `https://i.pravatar.cc/300?img=${avatarId}`,
          borderColor: char.borderColor || "#4F46E5",
          gradient: char.gradient || "linear-gradient(145deg, #4F46E5, #000)",
          voiceId: voiceId,
        };
      });

      const story: StoryData = {
        characters,
        dialogue: parsed.dialogue,
      };

      // Cache the story for mock mode
      try {
        localStorage.setItem("mock_story", JSON.stringify(story));
      } catch (e) {
        console.warn("Failed to cache story to localStorage", e);
      }

      setState({ story, isLoading: false, error: null });
    } catch (error) {
      console.error("usePerspectives error", error);
      setState({
        story: demoStory,
        isLoading: false,
        error: "Couldn't generate a fresh story. Showing a demo instead.",
      });
    }
  }, []);

  return {
    ...state,
    fetchStory,
  };
}
