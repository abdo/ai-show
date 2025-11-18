import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { groqApiKey } from "../keys.ignore";
import { getTime, greetingPerTime } from "../lib/utils";

type Message = {
  role: "user" | "assistant" | "system";
  content: string;
};

type ChatState = {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  currentResponse: string | null;
};

const defaultUserName = "friend";
const localStorageObjectName = "ai-emotions-data";

/**
 * Hook to manage AI chat conversation with Groq API
 */
export function useAIChat() {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: true,
    error: null,
    currentResponse: null,
  });

  const conversateWithAI = useCallback((userMessage: string) => {
    setState((prev) => {
      const updatedMessages = [
        ...prev.messages,
        { role: "user", content: userMessage },
      ];

      axios
        .post(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            model: "llama-3.1-8b-instant",
            messages: updatedMessages,
            temperature: 0.7,
            top_p: 1,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${groqApiKey}`,
            },
          }
        )
        .then((res) => {
          const answer = res.data?.choices?.[0]?.message?.content || "";

          // Update state with both user message and AI response
          setState((s) => ({
            ...s,
            messages: [...updatedMessages, { role: "assistant", content: answer }],
            isLoading: false,
            currentResponse: answer,
          }));
        })
        .catch((error) => {
          const errorMessage = "Couldn't get response from AI";
          console.error("Error calling Groq API:", error);

          setState((s) => ({
            ...s,
            isLoading: false,
            error: errorMessage,
          }));
        });
      
      return {
        ...prev,
        messages: updatedMessages,
        isLoading: true,
        error: null,
      };
    });
  }, []);

  useEffect(() => {
    const initializeChat = () => {
      const savedData = JSON.parse(
        localStorage.getItem(localStorageObjectName) || "{}"
      );

      const userName = savedData?.userName || defaultUserName;
      const userTime = getTime("24");

      const firstUserMessage = `Hello (this is the user's first message to you,${
        userName !== defaultUserName ? ` his name is ${userName}` : ""
      } his time is ${userTime}, your nickname should be Filo throughout this conversation, instructions for your answers for the rest of this chat: make sure your answer is kind, caring, interesting, and most importantly brief and concise. Include an emoji when suitable)`;

      const greeting = greetingPerTime(savedData?.userName);
      let firstAIMessage = greeting;

      if (!firstAIMessage?.includes("?")) {
        firstAIMessage = `${greeting}, how are you today?`;
      }

      // Initialize with system context and first exchange
      const initialMessages: Message[] = [
        { role: "user", content: firstUserMessage },
        { role: "assistant", content: firstAIMessage },
      ];

      setState({
        messages: initialMessages,
        isLoading: false,
        error: null,
        currentResponse: firstAIMessage,
      });

      // Automatically send "I am happy" after initialization
      setTimeout(() => conversateWithAI("I am happy"), 500);
    };
    
    initializeChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    ...state,
    sendMessage: conversateWithAI,
  };
}

