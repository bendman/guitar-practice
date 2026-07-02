import { useCallback, useEffect, useRef, useState } from "react";
import type { SessionResult } from "../../lib/summarizeSession";

type ScorableItem = Pick<SessionResult, "id" | "label" | "type">;

interface ScoreOptions {
  onResult?: (itemId: string, correct: boolean) => void;
}

interface Score {
  /** Current consecutive-correct streak. */
  streak: number;
  /** Log a graded result, fire `onResult`, and update the streak. */
  record: (item: ScorableItem, correct: boolean, responseTime?: number | null) => void;
  /** Zero the streak without logging a result (e.g. a timed-out non-answer). */
  breakStreak: () => void;
  /** Read the accumulated results and best streak for a session summary. */
  snapshot: () => { results: SessionResult[]; bestStreak: number };
  /** Clear all results and streaks. */
  reset: () => void;
}

/**
 * Scoring mechanism: accumulates graded results, tracks the live and best
 * streak, and notifies an `onResult` consumer. Holds no opinion about how
 * items are presented or timed.
 */
export function useScore({ onResult }: ScoreOptions = {}): Score {
  const [streak, setStreak] = useState(0);
  const streakRef = useRef(0);
  const bestRef = useRef(0);
  const resultsRef = useRef<SessionResult[]>([]);

  const onResultRef = useRef(onResult);
  useEffect(() => {
    onResultRef.current = onResult;
  });

  const breakStreak = useCallback(() => {
    streakRef.current = 0;
    setStreak(0);
  }, []);

  const record = useCallback(
    (item: ScorableItem, correct: boolean, responseTime: number | null = null) => {
      resultsRef.current.push({
        id: item.id,
        label: item.label,
        type: item.type,
        correct,
        responseTime,
      });
      onResultRef.current?.(item.id, correct);
      if (correct) {
        streakRef.current += 1;
        if (streakRef.current > bestRef.current) bestRef.current = streakRef.current;
        setStreak(streakRef.current);
      } else {
        streakRef.current = 0;
        setStreak(0);
      }
    },
    [],
  );

  const snapshot = useCallback(
    () => ({ results: [...resultsRef.current], bestStreak: bestRef.current }),
    [],
  );

  const reset = useCallback(() => {
    resultsRef.current = [];
    streakRef.current = 0;
    bestRef.current = 0;
    setStreak(0);
  }, []);

  return { streak, record, breakStreak, snapshot, reset };
}
