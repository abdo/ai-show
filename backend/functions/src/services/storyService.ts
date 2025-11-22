import axios from "axios";
import { AppError } from "../utils/AppError";
import { config } from "../config";
import { storyGenerationPrompt } from "../constants/prompts";
import { pravatarImgIdsForMales, pravatarImgIdsForFemales } from "../constants/avatarConstants";
import { maleVoices, femaleVoices } from "../constants/theatreCharacters";
import { StoryData, Character } from "../types";

export class StoryService {
  private static getRandomItem<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  private static getRandomAvatarId(
    gender: "male" | "female",
    usedIds: Set<string>
  ): number {
    const pool = gender === "male" ? pravatarImgIdsForMales : pravatarImgIdsForFemales;
    const available = pool.filter((id) => !usedIds.has(id.toString()));

    if (available.length === 0) {
      // If all used, pick randomly from pool
      const id = this.getRandomItem(pool);
      usedIds.add(id.toString());
      return id;
    }

    const id = this.getRandomItem(available);
    usedIds.add(id.toString());
    return id;
  }

  private static getRandomVoice(
    gender: "male" | "female",
    usedVoices: Set<string>
  ): string {
    const pool = gender === "male" ? maleVoices : femaleVoices;
    const available = pool.filter((voice) => !usedVoices.has(voice));

    // If we still have unused voices, pick from them
    // Otherwise, pick from the entire pool
    const selectionPool = available.length > 0 ? available : pool;
    const voice = this.getRandomItem(selectionPool);

    usedVoices.add(voice);
    return voice;
  }

  private static assignAvatarsAndColors(characters: Character[]): Character[] {
    const usedAvatarIds = new Set<string>();
    const usedVoices = new Set<string>();

    return characters.map((char, index) => {
      // Ensure gender is set (fallback to alternating if missing)
      const gender = char.gender || (index % 2 === 0 ? "male" : "female");

      // Assign Image
      const imageId = this.getRandomAvatarId(gender, usedAvatarIds);
      const image = `https://i.pravatar.cc/300?img=${imageId}`;

      // Assign Voice
      const voiceId = char.voiceId || this.getRandomVoice(gender, usedVoices);

      // Assign Colors (if not provided by LLM)
      let borderColor = char.borderColor;
      let gradient = char.gradient;

      if (!borderColor) {
        // Generate a random vibrant color
        const hue = Math.floor(Math.random() * 360);
        borderColor = `hsl(${hue}, 70%, 50%)`;
        gradient = `linear-gradient(135deg, ${borderColor}, #000000)`;
      }

      return {
        ...char,
        gender, // Ensure gender is preserved/set
        image,
        voiceId,
        borderColor,
        gradient,
      };
    });
  }

  static async generateStory(
    userInput: string,
    userName?: string,
    mode: "conversation" | "story" = "conversation"
  ): Promise<StoryData> {
    if (!config.groqApiKey) {
      throw new AppError(500, "MISSING_API_KEY", "Groq API Key is missing");
    }

    const prompt = storyGenerationPrompt(mode).replace(
      "[will be inserted]",
      userInput
    ).replace(/\[USER_NAME\]/g, userName || "the user");

    try {
      const response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          messages: [
            {
              role: "system",
              content: prompt,
            },
          ],
          model: "llama-3.3-70b-versatile",
          temperature: 0.9,
          top_p: 0.95,
          max_tokens: 4000,
          response_format: { type: "json_object" },
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.groqApiKey}`,
          },
        }
      );

      const content = response.data.choices[0]?.message?.content;
      if (!content) {
        throw new AppError(502, "INVALID_LLM_RESPONSE", "No content received from story generation service");
      }

      const storyData = JSON.parse(content) as StoryData;

      // Enrich characters with avatars, voices, and colors
      storyData.characters = this.assignAvatarsAndColors(storyData.characters);

      return storyData;
    } catch (error) {
      if (error instanceof AppError) throw error;

      console.error("Error generating story:", error);
      throw new AppError(502, "STORY_GENERATION_ERROR", "Failed to generate story content", error);
    }
  }
}
