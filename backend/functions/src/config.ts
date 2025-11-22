import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

export const config = {
  groqApiKey: process.env.GROQ_API_KEY || "",
  openAiTTSApiKey: process.env.OPENAI_TTS_API_KEY || "",
};
