/**
 * Demo/Mock Data
 * Fallback story data for development and testing
 */

import type { StoryData } from "../hooks/usePerspectives";

export const demoStory: StoryData = {
  characters: [
    {
      id: "maya",
      name: "Maya Chen",
      gender: "female",
      role: "emotional",
      image: "https://i.pravatar.cc/300?img=45", // Female from pravatarImgIdsForFemales
      borderColor: "#8B5CF6",
      gradient: "linear-gradient(145deg, #8B5CF6, #000)",
      voiceId: "nova", // Female voice
    },
    {
      id: "victor",
      name: "Victor Reyes",
      gender: "male",
      role: "analytical",
      image: "https://i.pravatar.cc/300?img=12", // Male from pravatarImgIdsForMales
      borderColor: "#EF4444",
      gradient: "linear-gradient(210deg, #EF4444, #000)",
      voiceId: "onyx", // Male voice
    },
    {
      id: "sara",
      name: "Sara Mitchell",
      gender: "female",
      role: "calm",
      image: "https://i.pravatar.cc/300?img=32", // Female from pravatarImgIdsForFemales
      borderColor: "#10B981",
      gradient: "linear-gradient(165deg, #10B981, #000)",
      voiceId: "shimmer", // Female voice
    },
  ],
  dialogue: [
    {
      characterId: "maya",
      text: "You know what I can't stand? People who say 'that's just how it is.' Like we're powerless.",
    },
    {
      characterId: "victor",
      text: "[leans back] And I can't stand people who think passion alone changes systems built over decades.",
    },
    {
      characterId: "sara",
      text: "[quietly] Maybe it's not about one or the other. Maybe it's both.",
    },
    {
      characterId: "maya",
      text: "So what, we just... accept it? Keep our heads down?",
    },
    {
      characterId: "victor",
      text: "I didn't say that. I said be smart. You can't burn bridges you haven't even built yet.",
    },
    {
      characterId: "sara",
      text: "My grandmother used to say: the river doesn't fight the rock. It just keeps moving.",
    },
    {
      characterId: "maya",
      text: "[softens] That's beautiful, but... I'm tired of moving around things.",
    },
    {
      characterId: "victor",
      text: "Then move through them. But know what you're up against.",
    },
  ],
};

