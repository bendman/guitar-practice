import { useCallback, useEffect, useRef, useState } from "react";
import type { PracticeItem } from "../../lib/constants";
import { pickWeightedRandom, sayAloud } from "../../lib/util";
import type { NoteNaming } from "../../lib/util";

interface ItemQueueOptions {
  pool: PracticeItem[];
  weights?: Record<string, number>;
  /** Speak each item aloud as it becomes current. */
  tts?: boolean;
  spokenNaming?: NoteNaming;
  voiceURI?: string | null;
}

interface ItemQueue {
  current: PracticeItem | null;
  /** How many items have been shown this run (1-based once started). */
  count: number;
  /** Pick the next weighted, non-repeating item, make it current, speak it. */
  advance: () => PracticeItem | null;
  /** Force a specific item (or clear) as current without bumping the count. */
  setTo: (item: PracticeItem | null) => void;
  /** Clear current and reset the count to 0. */
  reset: () => void;
}

/**
 * Weighted, no-repeat item selection with speak-on-set. Knows nothing about
 * timers, scoring, or the consuming interaction model — it only answers
 * "what's the next thing to show?" and tracks how many have been shown.
 */
export function useItemQueue({
  pool,
  weights = {},
  tts = false,
  spokenNaming = "solfege",
  voiceURI = null,
}: ItemQueueOptions): ItemQueue {
  const [current, setCurrent] = useState<PracticeItem | null>(null);
  const [count, setCount] = useState(0);
  const lastIdRef = useRef<string | null>(null);

  const latest = useRef({ pool, weights, tts, spokenNaming, voiceURI });
  useEffect(() => {
    latest.current = { pool, weights, tts, spokenNaming, voiceURI };
  });

  const speak = (item: PracticeItem) => {
    if (latest.current.tts) sayAloud(item, latest.current.spokenNaming, latest.current.voiceURI);
  };

  const setTo = useCallback((item: PracticeItem | null) => {
    setCurrent(item);
    lastIdRef.current = item?.id ?? null;
    if (item) speak(item);
  }, []);

  const advance = useCallback((): PracticeItem | null => {
    const next = pickWeightedRandom(latest.current.pool, lastIdRef.current, latest.current.weights);
    if (!next) return null;
    lastIdRef.current = next.id;
    setCurrent(next);
    setCount((c) => c + 1);
    speak(next);
    return next;
  }, []);

  const reset = useCallback(() => {
    setCurrent(null);
    setCount(0);
    lastIdRef.current = null;
  }, []);

  return { current, count, advance, setTo, reset };
}
