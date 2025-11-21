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
        // Try to use cached show data
        const cachedShow = localStorage.getItem("mock_show");
        if (cachedShow) {
          try {
            const parsedShow = JSON.parse(cachedShow);
            setState({
              story: parsedShow.story,
              audioMap: parsedShow.audioMap,
              isLoading: false,
              error: null,
            });
            isLoadingRef.current = false;
            console.log("[Mock Mode] Using cached show data from localStorage");
            return;
          } catch (parseError) {
            console.warn("[Mock Mode] Failed to parse cached data, fetching fresh data", parseError);
          }
        }
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

      // Cache the response if in mock mode
      if (isMock) {
        try {
          localStorage.setItem("mock_show", JSON.stringify(response));
          console.log("[Mock Mode] Cached show data to localStorage");
        } catch (cacheError) {
          console.warn("[Mock Mode] Failed to cache show data", cacheError);
        }
      }

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
