import { useState } from "react";
import { applyResult } from "../lib/util";
import {
  loadStats, saveStats, resetStats, mergeSessionIntoStats,
  loadWeights, saveWeights, resetWeights,
  loadConfusions, saveConfusions, resetConfusions,
} from "../lib/stats";
import type { Stats, SessionSummary, Weights, Confusions } from "../lib/stats";

/**
 * Holds the durable learning record and persists every mutation.
 *
 * Used by the app root to record session outcomes and drive the summary.
 * Covers lifetime stats, per-item spaced-repetition weights, and the confusion
 * matrix, exposing session recorders plus resets for the settings screen.
 */
export function useProgress() {
  const [stats, setStats] = useState<Stats>(loadStats);
  const [weights, setWeights] = useState<Weights>(loadWeights);
  const [confusions, setConfusions] = useState<Confusions>(loadConfusions);

  const recordResult = (itemId: string, correct: boolean) => {
    setWeights((prev) => {
      const next = applyResult(prev, itemId, correct);
      saveWeights(next);
      return next;
    });
  };

  const recordConfusion = (correctId: string, chosenWrongId: string) => {
    setConfusions((prev) => {
      const forTarget = { ...(prev[correctId] ?? {}) };
      forTarget[chosenWrongId] = (forTarget[chosenWrongId] ?? 0) + 1;
      const next = { ...prev, [correctId]: forTarget };
      saveConfusions(next);
      return next;
    });
  };

  const commitSession = (summary: SessionSummary) => {
    setStats((prev) => {
      const next = mergeSessionIntoStats(prev, summary);
      saveStats(next);
      return next;
    });
  };

  const resetAllStats = () => setStats(resetStats());
  const resetAllWeights = () => {
    setWeights(resetWeights());
    setConfusions(resetConfusions());
  };

  return {
    stats, weights, confusions,
    recordResult, recordConfusion, commitSession,
    resetAllStats, resetAllWeights,
  };
}
