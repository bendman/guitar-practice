import type { SessionResult } from "../../lib/summarizeSession";

export type ChordMode = "manual" | "auto" | "quiz";

export type SessionMode = "notes" | "chords";
export type SessionFlow = "timed" | "reveal" | "quiz";

/**
 * Single source of the mode↔flow mapping. The config route uses it to pick the
 * flow when starting a session; the session route dispatches components off the
 * same vocabulary. Adding a flow means extending this map and the dispatch in
 * session.$mode.tsx together.
 */
const CHORD_MODE_FLOW: Record<ChordMode, SessionFlow> = {
  quiz: "quiz",
  manual: "reveal",
  auto: "timed",
};

export function flowForMode(mode: SessionMode, chordMode: ChordMode): SessionFlow {
  return mode === "notes" ? "timed" : CHORD_MODE_FLOW[chordMode];
}

export interface SessionRawResult {
  results: SessionResult[];
  bestStreak: number;
  practiceTime: number;
}
