/**
 * Theatre Character Configuration
 * Defines standardized roles and their voice characteristics for AI-generated characters
 */

// Single source of truth: all roles and their descriptions
export const roleDescriptions = {
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
} as const;

// Derive everything else from roleDescriptions
export type CharacterRole = keyof typeof roleDescriptions;
export const availableRoles = Object.keys(roleDescriptions) as CharacterRole[];

// OpenAI TTS voices by gender
export const maleVoices = ["onyx", "ash"];
export const femaleVoices = ["alloy", "nova", "shimmer", "sage", "coral"];
