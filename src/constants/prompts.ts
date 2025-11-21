/**
 * AI Prompts and Conversation Dynamics
 * System prompts and narrative techniques for generating theatrical conversations
 */

import { availableRoles, roleDescriptions } from "./theatreCharacters";

/**
 * High-level conversation patterns that create engaging dynamics.
 * One scenario is randomly selected to guide the AI's narrative approach.
 * These are intentionally abstract to work with ANY user input topic.
 */
export const conversationScenarios = [
  "Everyone initially agrees, but one person who had an extreme personal experience challenges the consensus and forces others to reconsider.",
  
  "The conversation starts with curiosity and people building on each other's ideas, discovering perspectives they hadn't considered before.",
  
  "The situation reminds one character of something from their past, and as they share their story, others become curious and the conversation shifts to explore that parallel experience.",
  
  "What seems like a simple topic reveals deep personal stakes when someone shares why this matters to them on a profound level.",
  
  "One person plays devil's advocate so convincingly that they start questioning their own position, creating doubt in others.",
  
  "A quiet observer suddenly speaks up with information or a perspective that completely shifts the conversation's direction.",
  
  "Through discussing the friend's situation, the group accidentally discovers an unexpected solution or approach no one had considered.",
  
  "Someone's seemingly innocent question exposes a contradiction that nobody noticed, unraveling the conversation.",
  
  "As the discussion deepens, participants realize they're actually talking about something much bigger than the original topic.",
  
  "One person's vulnerability opens the door for others to drop their defenses, turning debate into raw honesty.",
  
  "The conversation takes a lighthearted turn when someone finds humor in the situation, helping everyone see it from a fresh angle.",
  
  "One character's personal story is so compelling that it completely shifts everyone's perspective on the friend's situation.",
  
  "Someone introduces new information midway through that forces everyone to reconsider their positions.",
  
  "The group realizes they're all making different assumptions about the same situation, leading to productive chaos.",
  
  "An uncomfortable truth gets voiced that everyone was thinking but nobody wanted to say, breaking the tension.",
  
  "The discussion oscillates between intellectual analysis and emotional reactions, never fully settling on one mode.",
  
  "People start connecting dots between seemingly unrelated things, leading to surprising insights and 'aha' moments.",
  
  "Two characters who initially disagreed find unexpected common ground, while another character raises new concerns no one thought of.",
  
  "Multiple people speak from personal experience, finding unexpected parallels that create empathy and understanding.",
  
  "The conversation becomes playful and creative as people imagine different what-if scenarios together.",
  
  "Someone offers surprisingly practical advice based on their own experience, shifting the conversation from abstract to actionable.",
  
  "A character's unexpected emotional reaction to the situation reveals something about themselves, making others see them differently.",
  
  "The group discovers they each have a piece of the puzzle, and by combining their perspectives, they see the full picture.",
  
  "One person's optimism clashes with another's realism, while a third finds a way to bridge both viewpoints in a surprising way.",
];

/**
 * Randomly selects one scenario from the array
 */
export function getRandomScenario(): string {
  return conversationScenarios[Math.floor(Math.random() * conversationScenarios.length)];
}

/**
 * Conversation Mode: Friends discussing what happened to [USER_NAME]
 */
/**
 * Conversation Mode: Friends discussing what happened to [USER_NAME]
 */
const getConversationModeFraming = () => `**CRITICAL FRAMING:**
The characters are discussing what [USER_NAME] told them about their situation - NOT experiencing it themselves.
- The user input above is what [USER_NAME] said/experienced (when it says "I", that's [USER_NAME] speaking)
- The characters are talking ABOUT what [USER_NAME] told them, not claiming it as their own experience
- Example: If [USER_NAME] said "I saw my friend cheating", the characters discuss what [USER_NAME] saw, not what they themselves saw
- They ALL know [USER_NAME] - it's their mutual friend, colleague, or someone they all care about
- They're debating what [USER_NAME] should do, how to help, what it means, different perspectives on [USER_NAME]'s situation
- This personal connection creates stakes: they care about the outcome and may disagree on what's best
- Use [USER_NAME] naturally but SPARINGLY - mostly use pronouns (him/her) instead of repeating the name constantly
- Based on the name, infer the person's likely gender and use appropriate pronouns (him/her, he/she, his/hers) instead of they/them

**CONVERSATION PATTERN:**
${getRandomScenario()}

Use this as a loose guide for the conversation's dynamic. Adapt it naturally to fit the user's situation - don't force it.`;

/**
 * Story Mode: Re-enacting the situation as a dramatic scene
 */
const STORY_MODE_FRAMING = `**CRITICAL FRAMING:**
You are creating a dramatic re-enactment inspired by what [USER_NAME] described. This is a STORY - bring a compelling scene to life!

**ABSOLUTELY FORBIDDEN:**
- Do NOT have characters discussing the situation as a past event or "news" they heard.
- Do NOT have characters analyzing the situation from the outside.
- This is NOT a therapy session or a gossip circle.

**STORYTELLING APPROACH:**
- **SHOW, DON'T TELL:** If the user says "I found out my coworker earns more", show the EXACT MOMENT of discovery. Show them looking at the payslip, or the tense confrontation with the boss, or the awkward silence with the coworker.
- **IN MEDIA RES:** Start the scene right in the middle of the action. No "Hello, how are you?" pleasantries.
- **IMMEDIATE CONFLICT:** Jump straight to the tension.
- The characters ARE the people in the scene (e.g., the Boss, the Coworker, [USER_NAME]).

**SCENE SELECTION:**
- Choose the most dramatic, emotionally resonant moment implied by the input.
- If the input is "I found out...", the scene IS the finding out.
- If the input is "I had a fight...", the scene IS the fight.
- If the input is "I'm worried about...", show the moment that caused the worry, or the confrontation it leads to.

**[USER_NAME] INCLUSION:**
- Include [USER_NAME] as a character ONLY if they're directly involved in the scene you're showing.
- If they're just an observer or it's about others: focus on those central to the action.
- Examples:
  - "I saw two people fighting" → Show the fight, [USER_NAME] doesn't need to be present.
  - "I had tea with grandma" → [USER_NAME] should be in the scene.
  - "My friend got dumped" → Could show the breakup without [USER_NAME].
- Use your judgment - prioritize dramatic impact over forcing [USER_NAME] into every scene.

**NARRATIVE ELEMENTS:**
- Include reactions, body language, and emotional beats in the dialogue.
- Show the buildup, tension, and consequences as they unfold.
- Let the scene breathe - moments of silence, hesitation, realization.
- Create atmosphere through how characters speak and react.
- Make the most emotionally powerful choice - surprise us with your creativity.

**CHARACTER GUIDELINES:**
- When [USER_NAME] is in the scene: use their name when others address them, first-person when they speak.
- Based on the name, infer [USER_NAME]'s likely gender for consistency.
- Focus on authentic reactions and emotions in the heat of the moment.
- Create characters naturally based on who belongs in THIS specific scene.`;

/**
 * Base instructions shared by both modes (technical specs, dialogue craft, format)
 */
/**
 * Shared instructions for both modes (Character depth, roles, dialogue craft, technical specs)
 */
const SHARED_INSTRUCTIONS = `**BE CREATIVE:**
Don't fall into predictable patterns. Surprise with unexpected turns, unique character dynamics, and fresh perspectives. Avoid one-dimensional conversations where everyone just states opinions. Make it cinematic and memorable.

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

**DIALOGUE CRAFT:**

Make it sound REAL:
- Use contractions, fragments, run-ons, interruptions
- Include verbal tics: "you know," "I mean," "like," "look"
- Show emotion through punctuation: ellipses for trailing off, dashes for cut-offs
- Natural cadence: short + long sentences, vary rhythm
- Regional or generational speech patterns (subtle, not stereotypical)

**NATURAL CONVERSATION FLOW:**
DO NOT have characters speak in predictable round-robin order! This is crucial:
- Some characters may speak 2-3 times in a row if they're passionate or dominating
- Others may stay silent for several exchanges before jumping in
- Characters respond to each other organically, not in turns
- A heated debate between two people might exclude others temporarily
- Speaking order should feel random and natural, like real movie dialogue

**CRITICAL: Emotional Tone Annotations**
Every dialogue line MUST end with a tone/emotion annotation in square brackets. This controls voice delivery.

Format: "Dialogue text here [tone/emotion]"

Examples:
- "I can't believe you did that [angry]"
- "Maybe you're right... I don't know [uncertain, vulnerable]"
- "That's exactly what I've been saying! [excited, vindicated]"
- "Whatever. Do what you want [dismissive, hurt]"

Tone guidelines:
- Be specific: not just "sad" but "heartbroken" or "disappointed"
- Combine emotions when layered: [hopeful, nervous] or [angry, defensive]
- Match the character's emotional arc through the conversation
- Vary tones even for the same character - people's emotions shift!

Common tones: excited, scared, cynical, hopeful, desperate, defensive, playful, serious, bitter, warm, cold, intense, calm, breaking, raw, gentle, harsh, proud, ashamed, confident, insecure, angry, sad, happy

Each line must:
- Sound like something a real person would actually say
- Move the conversation forward (no wheel-spinning)

**ABSOLUTELY FORBIDDEN:**
- Tidy resolutions where everyone learns and grows
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
      "id": "lowercase-kebab-case, something that could be their twitter handle, realistic, maybe funny",
      "name": "First name only (realistic, culturally appropriate)",
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

/**
 * Structure for Conversation Mode (Debate/Discussion)
 */
const CONVERSATION_STRUCTURE = `**STRUCTURAL REQUIREMENTS (DISCUSSION):**

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
- Leave the audience thinking`;

/**
 * Structure for Story Mode (Cinematic Scene)
 */
const STORY_STRUCTURE = `**STRUCTURAL REQUIREMENTS (CINEMATIC SCENE):**

*Phase 1: The Hook (In Media Res)*
- Drop us DIRECTLY into the moment. No warm-ups.
- Establish the immediate physical and emotional context.
- The first line should set the stakes instantly.

*Phase 2: The Action (The Event)*
- Show the core conflict or discovery unfolding in real-time.
- Focus on sensory details and visceral reactions.
- Allow for silence, hesitation, and non-verbal beats [looks away], [pauses].
- Build the tension to a breaking point.

*Phase 3: The Fallout (Reaction)*
- Show the immediate emotional aftermath.
- Don't resolve the problem - show how it lands on the characters.
- End on a high emotional note or a cliffhanger.
- Leave the viewer feeling the weight of the moment.`;

/**
 * Main story generation prompt - combines mode-specific framing with correct structure and shared instructions
 */
export function storyGenerationPrompt(mode: 'conversation' | 'story' = 'conversation'): string {
  const modeFraming = mode === 'conversation' ? getConversationModeFraming() : STORY_MODE_FRAMING;
  const structure = mode === 'conversation' ? CONVERSATION_STRUCTURE : STORY_STRUCTURE;
  
  // Only include conversation pattern for conversation mode
  let patternSection = "";
  if (mode === 'conversation') {
    patternSection = `
**CONVERSATION PATTERN:**
${getRandomScenario()}

Use this as a loose guide for the conversation's dynamic. Adapt it naturally to fit the user's situation - don't force it.
`;
  }
  
  return `You are a master screenwriter creating a gripping, emotionally charged conversation between 3-5 distinct characters.

**USER'S SITUATION:** [will be inserted]

${modeFraming}

${patternSection}

${structure}

${SHARED_INSTRUCTIONS}
`;
}
