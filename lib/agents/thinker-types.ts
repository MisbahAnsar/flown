export interface ThinkerDeps {
  /** Test override for Gemini generation. */
  generateText?: (prompt: string) => Promise<string>;
}

export type ThinkerError = {
  code: "unsupported_intent" | "thinker_failed";
  message: string;
};

export type ThinkerResult =
  | { success: true; summary: string; usedAi: boolean }
  | { success: false; error: ThinkerError };
