import { useCallback, useState } from "react";
import axios from "axios";
import { groqApiKey } from "../keys.ignore";
import {
  pravatarImgIdsForMales,
  pravatarImgIdsForFemales,
} from "../lib/avatarConstants";
import { availableRoles, roleDescriptions } from "./usePersonaVoices";

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

// OpenAI voices by gender
const maleVoices = ["onyx", "ash", "echo"];
const femaleVoices = ["alloy", "nova", "shimmer", "sage", "coral"];

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

const demoStory: StoryData = {
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

const conversationDynamics = [
  "Bold opening statement that immediately hooks attention",
  "Direct challenge or provocative question from another character",
  "Personal story or anecdote that adds depth and authenticity",
  "Sharp disagreement that reveals conflicting values",
  "Vulnerable admission that shifts the energy in the room",
  "Heated exchange where two characters clash intensely",
  "Unexpected wisdom from the character who's been quiet",
  "Moment of genuine connection despite opposing views",
  "Someone voices what everyone's thinking but afraid to say",
  "Callback to an earlier point that recontextualizes it",
  "Philosophical pivot that elevates the conversation",
  "Uncomfortable truth that creates awkward silence or reaction",
  "Personal stake reveal - why this REALLY matters to them",
  "Power dynamic shift - someone takes control of the conversation",
  "Emotional peak: anger, tears, laughter, or breakthrough",
  "Meta-moment: someone comments on the conversation itself",
  "Subtle alliance forming between unlikely characters",
  "Reflective pause where someone processes what was said",
  "Plot twist or new information that changes everything",
  "Final statement that reframes the entire discussion",
];

const systemPrompt = `You are a master screenwriter creating a gripping, emotionally charged conversation between 3-5 distinct characters.

**USER'S SITUATION:** [will be inserted]

**YOUR MISSION:**
Craft a conversation of 14-18 exchanges that feels like the most memorable scene from an award-winning film. This should be the kind of dialogue people quote, discuss, and remember.

**CHARACTER DEPTH:**
Create characters with:
- Distinct communication styles (verbose vs. terse, formal vs. casual, poetic vs. blunt)
- Different life experiences that inform their perspectives
- Hidden motivations or personal stakes in this discussion
- Flaws and contradictions that make them human
- Varying levels of social awareness and emotional intelligence

**IMPORTANT: STANDARDIZED ROLES**
Each character MUST have a "role" field that uses ONE of these exact values (this affects their voice characteristics):
${availableRoles
  .map((role) => `- "${role}" - ${roleDescriptions[role]}`)
  .join("\n")}

Choose roles that create interesting dynamics and contrast. Each character should embody their role in speech patterns and perspective.

**CONVERSATION ARCHITECTURE:**
Build the scene using these dynamics (don't use all, select 14-18 that fit):
${conversationDynamics.map((line, i) => `${i + 1}. ${line}`).join("\n")}

**STRUCTURAL REQUIREMENTS:**

*Act 1 (Opening 4-5 lines):*
- Hook immediately with tension, stakes, or intrigue
- Establish each character's position and communication style
- Create an "uh oh" or "oh damn" moment early

*Act 2 (Middle 6-8 lines):*
- Escalate conflict and emotional intensity
- Include at least ONE moment that gives chills
- Let characters interrupt, talk over each other, react viscerally
- Reveal hidden layers: personal stories, stakes, motivations
- Create unexpected alliances or betrayals

*Act 3 (Final 4-5 lines):*
- Reach an emotional climax or breakthrough
- Don't wrap everything up neatly - life is messy
- End with transformation, lingering question, or paradigm shift
- Leave the audience thinking

**DIALOGUE CRAFT:**

Make it sound REAL:
- Use contractions, fragments, run-ons, interruptions
- Include verbal tics: "you know," "I mean," "like," "look"
- Show emotion through punctuation: ellipses for trailing off, dashes for cut-offs
- Natural cadence: short + long sentences, vary rhythm
- Regional or generational speech patterns (subtle, not stereotypical)

Stage directions [in brackets]:
- Physical actions that reveal emotion: [lights cigarette], [avoids eye contact]
- Tonal shifts: [voice breaking], [laughing bitterly], [whispering intensely]
- Reactions: [visibly hurt], [stunned silence], [nodding slowly]
- Use sparingly but powerfully

Each line must:
- Either raise stakes, reveal character depth, or shift perspective
- Sound like something a real person would actually say
- Move the conversation forward (no wheel-spinning)

**ABSOLUTELY FORBIDDEN:**
- Therapist-speak or self-help clichés
- Anyone saying "I hear you" or "valid point" 
- Characters perfectly articulating complex feelings (people fumble!)
- Tidy resolutions where everyone learns and grows
- Exposition disguised as dialogue
- All characters becoming best friends by the end
- Safe, sanitized conflict

**VOICE & TONE:**
This should feel like:
- Midnight conversations that keep you up thinking
- Arguments that reveal uncomfortable truths
- Moments of connection that surprise everyone
- The scene in the movie where you lean forward
- Real people struggling to communicate hard things

**TECHNICAL SPECIFICATIONS:**

Output ONLY this JSON (no markdown, no explanations):
{
  "characters": [
    {
      "id": "lowercase-kebab-case",
      "name": "Full Name (realistic, culturally appropriate)",
      "gender": "male OR female (choose based on the character)",
      "role": "MUST be ONE of the 20 standardized roles listed above (e.g., 'emotional', 'analytical', 'provocateur')",
      "image": "LEAVE EMPTY - will be auto-assigned",
      "borderColor": "#HEXCODE (use vibrant: purples, teals, oranges, pinks, not muted)",
      "gradient": "linear-gradient(DEGdeg, #HEXCODE, #000000) (match borderColor, vary angle 120-240)",
      "voiceId": "LEAVE EMPTY - will be auto-assigned"
    }
  ],
  "dialogue": [
    {
      "characterId": "must match a character's id exactly",
      "text": "What they say, including [stage directions]. Keep under 200 chars when possible, max 300."
    }
  ]
}

Remember: This is theatre. Every word matters. Make it unforgettable.`;

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
      const response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama-3.3-70b-versatile",
          temperature: 0.9,
          top_p: 0.95,
          messages: [
            {
              role: "system",
              content: systemPrompt.replace(
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
