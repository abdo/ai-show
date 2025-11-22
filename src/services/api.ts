import axios from "axios";

const API_URL = "https://getshow-ejinsneowq-uc.a.run.app";

export interface ShowRequest {
  userInput: string;
  userName?: string;
  mode?: "conversation" | "story";
}

export interface Character {
  id: string;
  name: string;
  gender: "male" | "female";
  role: string;
  image: string;
  borderColor: string;
  gradient: string;
  voiceId: string;
}

export interface DialogueLine {
  characterId: string;
  text: string;
}

export interface StoryData {
  characters: Character[];
  dialogue: DialogueLine[];
}

export interface ShowResponse {
  story: StoryData;
  audioMap: Record<number, string>;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export const api = {
  getShow: async (data: ShowRequest): Promise<ShowResponse> => {
    try {
      const response = await axios.post<ShowResponse>(API_URL, data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        const apiError = error.response.data.error as ApiError;
        throw new Error(apiError.message || "An unknown error occurred");
      }
      throw error;
    }
  },
};
