import { useCallback, useState } from "react";
import type { PracticeItem } from "../../lib/constants";
import type { NoteNaming } from "../../lib/util";
import { useCountdown } from "../primitives/useCountdown";
import { useItemQueue } from "../primitives/useItemQueue";
import { usePracticeClock } from "../primitives/usePracticeClock";
import { useScore } from "../primitives/useScore";
import type { SessionRawResult } from "./types";

interface RevealSessionOptions {
  interval: number;
  pool: PracticeItem[];
  weights?: Record<string, number>;
  tts?: boolean;
  spokenNaming?: NoteNaming;
  voiceURI?: string | null;
  onResult?: (itemId: string, correct: boolean) => void;
}

export interface RevealSession {
  current: PracticeItem | null;
  count: number;
  streak: number;
  progress: number;
  paused: boolean;
  revealed: boolean;
  practiceTime: number;
  start: () => void;
  finish: () => SessionRawResult;
  pauseToggle: () => void;
  reveal: () => void;
  grade: (correct: boolean) => void;
  skip: () => void;
}

/**
 * Reveal-and-grade flow (manual chord practice). A countdown gives the user
 * time to recall the chord, then auto-reveals (pausing) when it elapses; the
 * user may also reveal early. `grade()` logs the result and advances;
 * `skip()` moves on without grading. `reveal`/`grade`/`skip` are first-class.
 */
export function useRevealSession({
  interval,
  pool,
  weights = {},
  tts = false,
  spokenNaming = "solfege",
  voiceURI = null,
  onResult,
}: RevealSessionOptions): RevealSession {
  const queue = useItemQueue({ pool, weights, tts, spokenNaming, voiceURI });
  const score = useScore({ onResult });

  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const { practiceTime, reset: resetClock } = usePracticeClock(running && !paused);

  // The recall timer runs only while the round is live and unrevealed; elapsing
  // auto-reveals and pauses, matching the legacy onTimeout for manual chords.
  const onElapsed = useCallback(() => {
    setRevealed(true);
    setPaused(true);
  }, []);
  const { progress, restart } = useCountdown({
    durationMs: interval * 1000,
    running: running && !paused && !revealed,
    onElapsed,
  });

  const start = useCallback(() => {
    if (pool.length === 0) return;
    score.reset();
    resetClock();
    queue.reset();
    setRunning(true);
    setPaused(false);
    setRevealed(false);
    queue.advance();
    restart();
  }, [pool.length, score, resetClock, queue, restart]);

  const finish = useCallback((): SessionRawResult => {
    const snap = score.snapshot();
    setRunning(false);
    setPaused(false);
    setRevealed(false);
    queue.reset();
    score.reset();
    speechSynthesis.cancel();
    return { ...snap, practiceTime };
  }, [score, queue, practiceTime]);

  const pauseToggle = useCallback(() => setPaused((p) => !p), []);

  const reveal = useCallback(() => {
    setRevealed(true);
    setPaused(true);
  }, []);

  const grade = useCallback(
    (correct: boolean) => {
      if (queue.current) score.record(queue.current, correct);
      setRevealed(false);
      setPaused(false);
      queue.advance();
      restart();
    },
    [queue, score, restart],
  );

  const skip = useCallback(() => {
    setRevealed(false);
    queue.advance();
    restart();
  }, [queue, restart]);

  return {
    current: queue.current,
    count: queue.count,
    streak: score.streak,
    progress,
    paused,
    revealed,
    practiceTime,
    start,
    finish,
    pauseToggle,
    reveal,
    grade,
    skip,
  };
}
