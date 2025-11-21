import { useCallback, useState, useRef } from "react";
import { api, type StoryData } from "../services/api";
import { demoStory } from "../constants/demoData";

type ShowState = {
  story: StoryData | null;
  audioMap: Record<number, string> | null;
  isLoading: boolean;
  error: string | null;
};

export function useShow() {
  const [state, setState] = useState<ShowState>({
    story: null,
    audioMap: null,
    isLoading: false,
    error: null,
  });

  const isLoadingRef = useRef(false);

  const fetchShow = useCallback(async (
    userInput: string, 
    userName?: string,
    mode: 'conversation' | 'story' = 'conversation'
  ) => {
    if (!userInput.trim()) return;

    // Prevent duplicate calls
    if (isLoadingRef.current) {
      return;
    }

    isLoadingRef.current = true;
    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      // Check for mock mode
      const isMock = localStorage.getItem("mock") === "true";
      if (isMock) {
        // Mock implementation could go here if needed, but for now let's focus on the real API
        // or fallback to demo story if API fails
      }

      const response = await api.getShow({
        userInput,
        userName,
        mode
      });

      setState({
        story: response.story,
        audioMap: response.audioMap,
        isLoading: false,
        error: null,
      });
      
      isLoadingRef.current = false;
    } catch (error) {
      console.error("useShow error", error);
      setState({
        story: demoStory, // Fallback to demo story
        audioMap: null,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to generate show",
      });
      isLoadingRef.current = false;
    }
  }, []);

  return {
    ...state,
    fetchShow,
  };
}
