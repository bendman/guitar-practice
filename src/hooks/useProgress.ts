import { useCallback, useMemo, useState } from "react";
import { applyResult, levelToWeight } from "../lib/util";
import type { Level } from "../lib/util";
import {
  loadStats,
  saveStats,
  resetStats,
  mergeSessionIntoStats,
  loadWeights,
  saveWeights,
  resetWeights,
  loadConfusions,
  saveConfusions,
  resetConfusions,
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

  const recordResult = useCallback((itemId: string, correct: boolean) => {
    setWeights((prev) => {
      const next = applyResult(prev, itemId, correct);
      saveWeights(next);
      return next;
    });
  }, []);

  /**
   * Set an item's mastery directly, as declared by the user. Writes the same
   * weight the graded flows do — a self-assessment and a measured one are the
   * same kind of fact here, so they share one store.
   */
  const setLevel = useCallback((itemId: string, level: Level) => {
    setWeights((prev) => {
      const weight = levelToWeight(level);
      const next = { ...prev };
      if (weight == null) delete next[itemId];
      else next[itemId] = weight;
      saveWeights(next);
      return next;
    });
  }, []);

  const recordConfusion = useCallback((correctId: string, chosenWrongId: string) => {
    setConfusions((prev) => {
      const forTarget = { ...(prev[correctId] ?? {}) };
      forTarget[chosenWrongId] = (forTarget[chosenWrongId] ?? 0) + 1;
      const next = { ...prev, [correctId]: forTarget };
      saveConfusions(next);
      return next;
    });
  }, []);

  const commitSession = useCallback((summary: SessionSummary) => {
    setStats((prev) => {
      const next = mergeSessionIntoStats(prev, summary);
      saveStats(next);
      return next;
    });
  }, []);

  const resetAllStats = useCallback(() => setStats(resetStats()), []);
  const resetAllWeights = useCallback(() => {
    setWeights(resetWeights());
    setConfusions(resetConfusions());
  }, []);

  // Stable identity while the learning record is unchanged, so context
  // consumers only re-render on actual progress updates.
  return useMemo(
    () => ({
      stats,
      weights,
      confusions,
      recordResult,
      setLevel,
      recordConfusion,
      commitSession,
      resetAllStats,
      resetAllWeights,
    }),
    [
      stats,
      weights,
      confusions,
      recordResult,
      setLevel,
      recordConfusion,
      commitSession,
      resetAllStats,
      resetAllWeights,
    ],
  );
}
