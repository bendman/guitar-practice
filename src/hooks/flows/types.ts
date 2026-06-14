import type { SessionResult } from "../../lib/summarizeSession";

export type ChordMode = "manual" | "auto" | "quiz";

export interface SessionRawResult {
  results: SessionResult[];
  bestStreak: number;
  practiceTime: number;
}
