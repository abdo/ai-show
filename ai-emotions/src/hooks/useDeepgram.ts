import { useState, useCallback } from "react";
import { deepgramApiKey } from "../keys.ignore";

type VoiceState = {
  isPlaying: boolean;
  isGenerating: boolean;
  error: string | null;
  audioSrc: string | null;
};

// Helper to convert ArrayBuffer to Base64
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

/**
 * Hook to generate and play speech using Deepgram
 */
export function useDeepgram() {
  const [state, setState] = useState<VoiceState>({
    isPlaying: false,
    isGenerating: false,
    error: null,
    audioSrc: null,
  });

  const generateAudio = useCallback(async (text: string): Promise<void> => {
    setState((s) => ({
      ...s,
      isGenerating: true,
      error: null,
      audioSrc: null,
    }));

    try {
      const response = await fetch(
        "https://api.deepgram.com/v1/speak?model=aura-2-thalia-en",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${deepgramApiKey}`,
          },
          body: JSON.stringify({ text }),
        }
      );

      if (!response.ok) {
        let errorDetails = `API Error: ${response.status} ${response.statusText}`;
        try {
          const errorBody = await response.json();
          errorDetails =
            errorBody.reason || errorBody.error || JSON.stringify(errorBody);
        } catch {
          // The body was not JSON or could not be parsed
        }
        throw new Error(errorDetails);
      }

      const arrayBuffer = await response.arrayBuffer();
      const base64Audio = arrayBufferToBase64(arrayBuffer);
      const audioSrc = `data:audio/mp3;base64,${base64Audio}`;

      setState((s) => ({ ...s, isGenerating: false, audioSrc }));
    } catch (error) {
      let errorMessage = "Failed to generate speech.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      console.error("Error generating Deepgram audio:", error);
      setState((s) => ({ ...s, isGenerating: false, error: errorMessage }));
    }
  }, []);

  const playAudio = useCallback(() => {
    if (!state.audioSrc || state.isPlaying) return;

    const audio = new Audio(state.audioSrc);
    setState((s) => ({ ...s, isPlaying: true }));

    audio.onended = () => {
      setState((s) => ({ ...s, isPlaying: false }));
    };

    audio.onerror = () => {
      console.error("Audio element error: Could not play the audio file.");
      setState((s) => ({
        ...s,
        isPlaying: false,
        error: "An error occurred during audio playback.",
      }));
    };

    audio.play();
  }, [state.audioSrc, state.isPlaying]);

  return {
    ...state,
    generateAudio,
    playAudio,
  };
}
