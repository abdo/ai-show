// ============================================================================
// getShow.ts - Complete TypeScript server for AI Show Generation
// ============================================================================

import 'dotenv/config';
import axios from 'axios';

// ============================================================================
// TYPES
// ============================================================================

type Gender = 'male' | 'female';

const roleDescriptions = {
  empathetic: "warm, understanding, slower speech",
  analytical: "logical, measured, clear thinking",
  provocateur: "bold, challenging, faster speech",
  emotional: "raw, expressive, passionate",
  calm: "peaceful, soothing, slow",
  assertive: "confident, direct, slightly fast",
  skeptical: "questioning, doubtful",
  optimistic: "hopeful, upbeat, positive",
  cynical: "pessimistic, dry humor",
  nurturing: "caring, gentle, slow",
  intense: "powerful, fierce, fast speech",
  playful: "lighthearted, fun, quick",
  serious: "grave, deliberate, slow",
  wise: "thoughtful, measured, sage-like",
  rebellious: "defiant, quick, challenging",
  mediator: "balanced, neutral, peacemaker",
  challenger: "confrontational, direct",
  supporter: "encouraging, cheerleader",
  observer: "detached, watching, slow",
  wildcard: "unpredictable, varying pace",
  curious: "inquisitive, exploring, engaged",
  compassionate: "deeply caring, warm, gentle",
  humorous: "witty, light, playful timing",
  sarcastic: "dry, cynical, quick wit",
  thoughtful: "reflective, considering, measured",
} as const;

type CharacterRole = keyof typeof roleDescriptions;

interface Character {
  id: string;
  name: string;
  gender: Gender;
  role: string;
  image?: string;
  borderColor?: string;
  gradient?: string;
  voiceId?: string;
}

interface DialogueLine {
  characterId: string;
  text: string;
}

interface StoryData {
  characters: Character[];
  dialogue: DialogueLine[];
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const OPENAI_TTS_API_KEY = process.env.OPENAI_TTS_API_KEY;

// ============================================================================
// CONSTANTS - Avatar IDs
// ============================================================================

const pravatarImgIdsForMales: number[] = [
  3, 4, 6, 7, 8, 11, 12, 13, 14, 15, 17, 18, 33, 50, 51, 52, 53, 54, 55, 56, 57,
  58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70,
];

const pravatarImgIdsForFemales: number[] = [
  5, 9, 10, 16, 19, 20, 21, 22, 23, 24, 25, 27, 28, 29, 30, 31, 32, 34, 36, 38,
  39, 40, 41, 43, 44, 45, 47, 48, 49,
];

// ============================================================================
// CONSTANTS - Theatre Characters
// ============================================================================

const availableRoles = Object.keys(roleDescriptions) as CharacterRole[];
const maleVoices = ["onyx", "ash"];
const femaleVoices = ["alloy", "nova", "shimmer", "sage", "coral"];

// ============================================================================
// CONSTANTS - Prompts
// ============================================================================

const conversationScenarios = [
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

function getRandomScenario(): string {
  return conversationScenarios[Math.floor(Math.random() * conversationScenarios.length)];
}

const seriousStoryToneDirectives = [
  "**TONE: THE PRESSURE COOKER.** The atmosphere is suffocatingly tense. Patience is at zero. The characters are snapping at each other, interrupting, and letting their annoyance bleed into every sentence. It feels like a bomb is about to go off.",
  "**TONE: COLD JUDGMENT.** The vibe is critical and harsh. The characters aren't yelling, but they are dissecting the situation with a sense of superiority and contempt. They are judging the choices made, offering 'tough love' that feels more like an attack.",
  "**TONE: CHAOTIC PANIC.** Total loss of control. The characters are spiraling into anxiety, feeding off each other's fear. Logical thought has left the building. The dialogue is fast, fragmented, and breathless as they catastrophize the situation.",
  "**TONE: DEFENSIVE WALLS.** Everyone feels attacked. The characters are guarded, interpreting innocent comments as insults. Trust is low, and the conversation feels like a minefield where everyone is trying to protect their own ego.",
  "**TONE: HEAVY MELANCHOLY.** The energy is low and heavy. A sense of deep sadness permeates the room. The characters aren't trying to fix it; they are just mourning the reality of the situation. Sentences trail off; silences are long and painful.",
  "**TONE: SHARED REGRET.** The focus turns inward to guilt and shame. The situation makes the characters reflect on their own failures. The conversation becomes a confessional where they admit their own mistakes, bonding over a sense of shared brokenness.",
  "**TONE: RAW VULNERABILITY.** The armor comes off. The characters are speaking from a place of deep hurt and helplessness. It is uncomfortable but necessary honesty. They are admitting things they are usually too proud to say.",
  "**TONE: AWKWARD DISCOMFORT.** The situation is embarrassing or cringe-worthy. The characters don't know where to look or what to say. They fumble with their words, try to change the subject, and create a palpable sense of social anxiety.",
  "**TONE: UNBOUNDED ENTHUSIASM.** The characters are hyping the situation up. They are excited, loud, and looking at the possibilities. The vibe is electric and infectious. They are feeding each other's energy, turning a spark into a fire of optimism.",
  "**TONE: PLAYFUL BANTER.** The characters are coping through humor and wit. They are roasting each other and the situation with affection. It's a comedy routine born from chemistry—lighthearted, teasing, and fun, even if the topic is serious.",
  "**TONE: FIERCE VALIDATION.** A mood of aggressive support. The characters are loud and proud in their defense of the user. They are empowering, boosting confidence, and acting like a cheer squad ready to go to war for their friend.",
  "**TONE: SURPRISED DELIGHT.** The characters are genuinely shocked in a good way. They are reacting with gasps, wide eyes, and 'no way!' exclamations. The vibe is discovery and wonder, treating the situation like a plot twist they love.",
  "**TONE: GENTLE SANCTUARY.** The room feels safe. The characters are speaking softly, offering unconditional empathy and love. There is no judgment here, only a warm, wrapping sense of comfort and relief. It feels like coming home.",
  "**TONE: WISE REFLECTION.** The characters step back to look at the big picture. The tone is philosophical and calm. They are analyzing the meaning of the situation, offering advice that feels earned and grounded. It's a moment of clarity.",
  "**TONE: UNSHAKABLE TRUST.** The characters are acting as the rock. They are steady, reliable, and calm. They convey a sense of 'we've got this.' The anxiety of the situation crashes against their stability and dissolves.",
  "**TONE: INTELLECTUAL DEBATE.** The characters detach emotionally and treat the situation like a puzzle. They play devil's advocate, challenge assumptions, and analyze the logic. It's a meeting of minds, sharp and stimulating.",
  "**TONE: CONSPIRATORIAL WHISPERS.** The vibe is secretive and intense. The characters feel like they are plotting something or sharing forbidden knowledge. They lean in close, creating a bubble of intimacy that excludes the rest of the world.",
  "**TONE: BITTERSWEET NOSTALGIA.** The situation triggers memories. The characters drift into the past, mixing the current issue with 'remember when' stories. It is a blend of happiness for what was and sadness for how things change.",
  "**TONE: TOXIC POSITIVITY.** A complex mix where characters forcefully try to be happy when they shouldn't be. They ignore the bad stuff to maintain a facade of perfection. It feels slightly manic and disconnected from reality.",
  "**TONE: TIRED CAMARADERIE.** The characters are exhausted but together. They speak in shorthand, too tired to be polite but too close to be mean. It's the grumbling, comfortable solidarity of people who have been through a long day together."
];

const lightStoryToneDirectives = [
  "**TONE: THE PRESSURE COOKER.** The characters are trying desperately to remain polite and calm, but the subtext is screaming. Every small comment feels like a spark near a gas leak. They are repressing their true feelings so hard that the eventual explosion (or almost-explosion) feels inevitable and dangerous.",
  "**TONE: MANIC DEFLECTION.** The energy is frantic and scattered. Characters are avoiding the core painful truth by talking rapidly about everything else. They obsess over trivial details or crack jokes that are too loud and too frequent. It's the sound of people running away from a feeling while standing still.",
  "**TONE: THE POWER STRUGGLE.** This isn't just a discussion; it's a battle for dominance. One character tries to parent or psychoanalyze the other, while the other resists with sharp wit or stubborn silence. The emotional focus shifts from the situation itself to the dynamic of 'who is right' and 'who is in charge' of the narrative.",
  "**TONE: PARANOID ECHO CHAMBER.** The characters feed each other's worst fears until they detach from reality. Validation turns into hysteria. They aren't just agreeing; they are amplifying the threat until the world feels unsafe. It's a bonding experience, but a toxic one built on shared anxiety.",
  "**TONE: PASSIVE-AGGRESSIVE CARE.** The characters claim to be helping, but their advice is laced with judgment. They use terms of endearment ('honey', 'sweetie') to deliver stinging critiques. It creates a confusing emotional landscape where the user feels supported and insulted at the same time.",
  "**TONE: NOSTALGIC REGRET.** The current situation acts as a portal to the past. Characters view the event through the lens of their own missed opportunities. The conversation is soft and wistful, filled with sentences that start with 'I wish I had...' It connects the user's immediate pain to the universal ache of time passing.",
  "**TONE: EXHAUSTED SURRENDER.** The fight is gone. The characters aren't angry anymore; they are just tired. They discuss the situation with a flat, heavy acceptance. It's the specific intimacy of people who are too drained to lie to each other. The silence between lines is as important as the words.",
  "**TONE: THE ELEPHANT IN THE ROOM.** Everyone knows the harsh truth, but no one wants to say it first. The dialogue is a dance around the crater. Characters speak in metaphors and vague allusions, creating a thick tension where the most important thing is the thing *not* being said, until the dam finally breaks.",
  "**TONE: DIGNIFIED GRIEF.** There are no tears or wailing, just a steel-spined, quiet sorrow. The characters treat the situation with immense gravity and ritualistic respect. They are holding space for the loss, refusing to cheapen it with clichés or quick fixes. It feels momentous and somber.",
  "**TONE: TOUGH LOVE & TRUTH.** The characters love the user enough to be the bad guys. They offer a warm hand but harsh words. They challenge the user's narrative not out of malice, but out of a fierce desire to see them grow. It's a friction born entirely from deep affection and protective instinct.",
  "**TONE: THE SAFE HARBOR.** The world outside is chaotic, but this conversation is a vacuum of safety. Defenses drop completely. Characters admit to shame, fear, and weakness without any posturing. It's a rare moment of pure, unmasked humanity where judgement is suspended entirely.",
  "**TONE: CONSPIRATORIAL INTIMACY.** The characters create an 'Us vs. Them' bunker. They whisper and plot, finding joy in their shared secret perspective. It's a mix of mischief and loyalty. They might be wrong about the world, but they are right about each other. It feels illicit and thrilling.",
  "**TONE: RELUCTANT UNDERSTANDING.** Two characters who usually disagree or dislike each other find themselves aligning on this one issue. They are surprised by their own agreement. The tone is awkward but respectful, bridging a gap that usually separates them. It represents the complexity of unexpected allies.",
  "**TONE: GALLOWS HUMOR.** The situation is terrible, so the only option is to laugh. The characters make dark, biting jokes that would be offensive to outsiders. It's a coping mechanism that bonds them in the face of tragedy. The laughter is genuine, but it has a sharp, desperate edge to it.",
  "**TONE: SURGICAL CURIOSITY.** The characters detach emotionally to analyze the situation like a puzzle. They are fascinated by the 'why' and 'how' of the event, almost forgetting the human cost. It's not cruel, just hyper-intellectual. They are trying to solve feelings with math/logic.",
  "**TONE: THE PHILOSOPHICAL DETOUR.** The characters zoom out too far, turning a personal problem into a debate about ethics, society, or human nature. They get lost in the abstract, using big words to distance themselves from small, painful feelings. It's high-minded but emotionally avoidant.",
  "**TONE: SKEPTICAL REALISM.** One character is the dreamer/panicker, and the other is the grounding anchor. The tone is a push-and-pull between 'what if' and 'what is.' It's a grounding exercise where the characters strip away the drama to look at the bare, boring facts of the situation.",
  "**TONE: LAUGHTER THROUGH TEARS.** The emotional pendulum swings wildly. One moment the characters are crying/upset, and the next they are cracking up at the absurdity of it all. It captures the messy reality of a breakdown where emotions bleed into one another without clear boundaries.",
  "**TONE: THE SLOW REALIZATION.** The conversation starts in one place (e.g., anger) and slowly, line by line, morphs into something else (e.g., sadness). The characters uncover a piece of information or a perspective mid-conversation that completely changes the vibe in the room. We watch the mood shift in real-time.",
  "**TONE: BITTERSWEET VICTORY.** The characters find a win, but it comes at a cost. They are celebrating, but there is a shadow over the party. They acknowledge the good while holding the bad. It's a mature, complex happiness that recognizes life is rarely purely one thing or the other."
];

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
- Allow for stillness and reflection, not just constant talking

**CHARACTER GUIDELINES:**
- When [USER_NAME] is in the scene: use their name when others address them, first-person when they speak.
- Based on the name, infer [USER_NAME]'s likely gender for consistency.
- Focus on authentic reactions and emotions in the heat of the moment.
- Create characters naturally based on who belongs in THIS specific scene.
- Let characters be complex - capable of both hurting and healing, defending and opening up`;

const SHARED_INSTRUCTIONS = `**BE CREATIVE:**
Don't fall into predictable patterns. Surprise with unexpected turns, unique character dynamics, and fresh perspectives. Avoid one-dimensional conversations where everyone just states opinions. Make it cinematic and memorable.

**YOUR MISSION:**
Craft a conversation of 16-18 exchanges that feels like the most memorable scene from an award-winning film. This should be the kind of dialogue people quote, discuss, and remember.

**CHARACTER DEPTH:**
Create characters with:
- Distinct communication styles (verbose vs. terse, formal vs. casual, poetic vs. blunt)
- Different life experiences that inform their perspectives
- Hidden motivations or personal stakes in this discussion
- Flaws and contradictions that make them human
- Varying levels of social awareness and emotional intelligence

**IMPORTANT: STANDARDIZED ROLES**
Each character MUST have a "role" field that uses ONE of these exact values (this affects their voice characteristics):
${availableRoles.map((role) => `- "${role}" - ${roleDescriptions[role]}`).join("\n")}

Choose roles that create interesting dynamics and contrast. Each character should embody their role in speech patterns and perspective, but there can be a character arc or development in the story if needed, roll the dice on that.

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
- Combine emotions when layered: [hopeful, nervous] or [angry, defensive]
- Match the character's emotional arc through the conversation
- Vary tones even for the same character - people's emotions shift!

Common tones: excited, scared, cynical, hopeful, desperate, defensive, playful, serious, bitter, warm, cold, intense, calm, breaking, raw, gentle, harsh, proud, ashamed, confident, insecure, angry, sad, happy

Each line must:
- Sound like something a real person would actually say
- Move the conversation forward (no wheel-spinning)

**ABSOLUTELY FORBIDDEN:**
- Tidy resolutions where everyone learns and grows
- All characters becoming best friends by the end, things like "We are always here for you"
- Safe, sanitized conflict

**TECHNICAL SPECIFICATIONS:**

Output ONLY this JSON (no markdown, no explanations):
{
  "characters": [
    {
      "id": "lowercase-kebab-case, something that could be their twitter handle, realistic, maybe funny",
      "name": "First name only (realistic, culturally appropriate)",
      "gender": "string of exact string 'male' OR 'female' (choose based on the character)",
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
- Leave the audience thinking

**VOICE & TONE:**
This should feel like:
- Midnight conversations that keep you up thinking
- Arguments that reveal uncomfortable truths
- Moments of connection that surprise everyone
- The scene in the movie where you lean forward
- Real people struggling to communicate hard things
`;

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

function storyGenerationPrompt(mode: 'conversation' | 'story' = 'conversation'): string {
  const modeFraming = mode === 'conversation' ? getConversationModeFraming() : STORY_MODE_FRAMING;
  const structure = mode === 'conversation' ? CONVERSATION_STRUCTURE : STORY_STRUCTURE;

  let patternSection = "";
  if (mode === 'conversation') {
    patternSection = `
**CONVERSATION PATTERN:**
${getRandomScenario()}

Use this as a loose guide for the conversation's dynamic. Adapt it naturally to fit the user's situation - don't force it.
`;
  } else {
    patternSection = `
**NARRATIVE DIRECTIVE SELECTION (CRITICAL):**
I have selected two potential "vibes" for this scene. You must choose the one that best fits the gravity of the user's situation.

**OPTION A (SERIOUS/HEAVY):**
${seriousStoryToneDirectives[Math.floor(Math.random() * seriousStoryToneDirectives.length)]}

**OPTION B (LIGHT/POSITIVE):**
${lightStoryToneDirectives[Math.floor(Math.random() * lightStoryToneDirectives.length)]}

**INSTRUCTIONS:**
1. Analyze the User's Situation.
2. If the topic is heavy, traumatic, or deeply serious -> **USE OPTION A**.
3. If the topic is light, trivial, funny, or heartwarming -> **USE OPTION B**.
4. **ESCAPE HATCH:** If NEITHER option fits (e.g., Option A is too dark and Option B is too silly), you may ignore them and choose a completely different tone that matches the situation perfectly.

**YOUR GOAL:**
Commit fully to the chosen tone. If it's funny, make it genuinely funny. If it's dark, go deep. Do not mix them into a lukewarm middle ground.
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

// ============================================================================
// UTILITIES - Text Cleaner
// ============================================================================

function extractToneAndCleanText(text: string): { cleanedText: string; tone: string | null } {
  let cleaned = text;
  let tone: string | null = null;

  const toneMatch = cleaned.match(/\[([^\]]+)\]\s*$/);
  if (toneMatch) {
    tone = toneMatch[1].trim();
    cleaned = cleaned.replace(/\[([^\]]+)\]\s*$/, "").trim();
  }

  cleaned = cleaned.replace(/\[.+?\]/g, "");
  cleaned = cleaned.replace(/\*\*(.+?)\*\*/g, "$1");
  cleaned = cleaned.replace(/\*(.+?)\*/g, "$1");
  cleaned = cleaned.replace(/__(.+?)__/g, "$1");
  cleaned = cleaned.replace(/_(.+?)_/g, "$1");
  cleaned = cleaned.replace(/^#{1,6}\s+/gm, "");
  cleaned = cleaned.replace(
    /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}]/gu,
    ""
  );
  cleaned = cleaned.replace(/…/g, " —— ");
  cleaned = cleaned.replace(/\.{2,}/g, " —— ");
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  return { cleanedText: cleaned, tone };
}

// ============================================================================
// SERVICES - Story Service
// ============================================================================

function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomAvatarId(gender: Gender, usedIds: Set<string>): number {
  const pool = gender === "male" ? pravatarImgIdsForMales : pravatarImgIdsForFemales;
  const available = pool.filter((id) => !usedIds.has(id.toString()));

  if (available.length === 0) {
    const id = getRandomItem(pool);
    usedIds.add(id.toString());
    return id;
  }

  const id = getRandomItem(available);
  usedIds.add(id.toString());
  return id;
}

function getRandomVoice(gender: Gender, usedVoices: Set<string>): string {
  const pool = gender === "male" ? maleVoices : femaleVoices;
  const available = pool.filter((voice) => !usedVoices.has(voice));

  const selectionPool = available.length > 0 ? available : pool;
  const voice = getRandomItem(selectionPool);

  usedVoices.add(voice);
  return voice;
}

function assignAvatarsAndColors(characters: Character[]): Character[] {
  const usedAvatarIds = new Set<string>();
  const usedVoices = new Set<string>();

  return characters.map((char, index) => {
    let rawGender = char.gender || (index % 2 === 0 ? "male" : "female");
    let normalizedGender = rawGender.toLowerCase().trim();

    let gender: Gender;
    if (normalizedGender === "male") {
      gender = "male";
    } else if (normalizedGender === "female") {
      gender = "female";
    } else {
      console.warn(`Invalid gender value "${rawGender}" for character ${char.name}, defaulting to ${index % 2 === 0 ? "male" : "female"}`);
      gender = index % 2 === 0 ? "male" : "female";
    }

    const imageId = getRandomAvatarId(gender, usedAvatarIds);
    const image = `https://i.pravatar.cc/300?img=${imageId}`;
    const voiceId = char.voiceId || getRandomVoice(gender, usedVoices);

    let borderColor = char.borderColor;
    let gradient = char.gradient;

    if (!borderColor) {
      const hue = Math.floor(Math.random() * 360);
      borderColor = `hsl(${hue}, 70%, 50%)`;
      gradient = `linear-gradient(135deg, ${borderColor}, #000000)`;
    }

    return {
      ...char,
      gender,
      image,
      voiceId,
      borderColor,
      gradient,
    };
  });
}

async function generateStory(
  userInput: string,
  userName?: string,
  mode: 'conversation' | 'story' = 'conversation'
): Promise<StoryData> {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is missing');
  }

  const prompt = storyGenerationPrompt(mode)
    .replace('[will be inserted]', userInput)
    .replace(/\[USER_NAME\]/g, userName || 'the user');

  const response = await axios.post(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      messages: [{ role: "system", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.9,
      top_p: 0.95,
      max_tokens: 4000,
      response_format: { type: "json_object" },
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
    }
  );

  const content = response.data.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No content received from LLM');
  }

  const storyData: StoryData = JSON.parse(content);
  storyData.characters = assignAvatarsAndColors(storyData.characters);

  return storyData;
}

// ============================================================================
// SERVICES - Voice Service
// ============================================================================

function extractRole(roleText: string): CharacterRole {
  const normalized = roleText.toLowerCase().trim();

  if (availableRoles.includes(normalized as CharacterRole)) {
    return normalized as CharacterRole;
  }

  const matchedRole = availableRoles.find(role => normalized.includes(role));
  return matchedRole || "mediator";
}

async function generateVoices(story: StoryData): Promise<Record<number, string>> {
  if (!OPENAI_TTS_API_KEY) {
    throw new Error('OPENAI_TTS_API_KEY is missing');
  }

  const audioMap: Record<number, string> = {};
  const characterMap = new Map(story.characters.map((c) => [c.id, c]));

  const promises = story.dialogue.map(async (line, index) => {
    const character = characterMap.get(line.characterId);
    if (!character || !character.voiceId) {
      console.warn(`Character not found or missing voiceId for line ${index}`);
      return;
    }

    const { cleanedText, tone } = extractToneAndCleanText(line.text);
    const characterRole = extractRole(character.role);
    const roleDescription = roleDescriptions[characterRole];
    const instructions = tone || roleDescription;

    try {
      const response = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_TTS_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini-tts",
          voice: character.voiceId,
          speed: character.voiceId === "coral" ? 0.9 : 1.1,
          input: cleanedText,
          instructions: instructions,
        }),
      });

      if (!response.ok) {
        throw new Error(`Voice generation failed: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64Audio = buffer.toString("base64");

      audioMap[index] = base64Audio;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Failed to generate voice for line ${index}:`, errorMessage);
    }
  });

  await Promise.all(promises);
  return audioMap;
}

// ============================================================================
// EXPORT - Main Handler
// ============================================================================

export async function handleGetShow(
  body: { userInput?: string; userName?: string; mode?: 'conversation' | 'story' }
): Promise<{ story: StoryData; audioMap: Record<number, string> }> {
  // Validation
  if (!body.userInput) {
    throw new Error('userInput is required');
  }

  const { userInput, userName, mode } = body;
  console.log('[getShow] Starting generation...', { userInput, userName, mode });

  const story = await generateStory(userInput, userName, mode);
  console.log('[getShow] Story generated', { characterCount: story.characters.length });

  const audioMap = await generateVoices(story);
  console.log('[getShow] Voices generated', { audioCount: Object.keys(audioMap).length });

  return { story, audioMap };
}
