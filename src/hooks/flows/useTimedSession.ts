import { useCallback, useEffect, useRef, useState } from "react";
import type { PracticeItem } from "../../lib/constants";
import type { NoteNaming } from "../../lib/util";
import { useCountdown } from "../primitives/useCountdown";
import { useItemQueue } from "../primitives/useItemQueue";
import { usePracticeClock } from "../primitives/usePracticeClock";
import { useScore } from "../primitives/useScore";
import type { SessionRawResult } from "./types";

interface TimedSessionOptions {
  interval: number;
  pool: PracticeItem[];
  /** Mic-driven note practice: a correct detected note advances the round. */
  listening?: boolean;
  weights?: Record<string, number>;
  tts?: boolean;
  spokenNaming?: NoteNaming;
  voiceURI?: string | null;
  onResult?: (itemId: string, correct: boolean) => void;
}

export interface TimedSession {
  current: PracticeItem | null;
  count: number;
  streak: number;
  progress: number;
  paused: boolean;
  hitStatus: "correct" | "wrong" | null;
  practiceTime: number;
  micActive: boolean;
  start: () => void;
  finish: () => SessionRawResult;
  pauseToggle: () => void;
  forceAccept: () => void;
  /** Advance to the next item without recording the outgoing one. Intended for the paused→Suivant control. */
  skip: () => void;
  onDetectedNote: (noteId: string | null) => void;
}

const ADVANCE_GAP_MS = 200;

/**
 * Timed-advance flow shared by notes-auto, notes-listening, and chord-auto.
 * A countdown drives each round; when it elapses the round advances (with
 * credit only in the listening variant when the note was hit in time). The
 * listening variant adds the mic-hit / late-hit / force-accept glue ported
 * over from the legacy timed loop, including its ~200ms inter-item gap.
 */
export function useTimedSession({
  interval,
  pool,
  listening = false,
  weights = {},
  tts = false,
  spokenNaming = "solfege",
  voiceURI = null,
  onResult,
}: TimedSessionOptions): TimedSession {
  const queue = useItemQueue({ pool, weights, tts, spokenNaming, voiceURI });
  const score = useScore({ onResult });

  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [hitStatus, setHitStatus] = useState<"correct" | "wrong" | null>(null);

  const { practiceTime, reset: resetClock } = usePracticeClock(running && !paused);

  const hitRef = useRef(false);
  const withinTimeRef = useRef(true);
  const responseTimeRef = useRef<number | null>(null);
  const startRef = useRef(0);
  const gapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stable view of the flags the countdown/mic callbacks need, so they read
  // current values without being torn down and recreated.
  const flags = useRef({ listening, running, paused });
  useEffect(() => {
    flags.current = { listening, running, paused };
  });

  const resetHit = useCallback(() => {
    hitRef.current = false;
    withinTimeRef.current = true;
    setHitStatus(null);
  }, []);

  // We need restart() inside doAdvance, but useCountdown needs onElapsed (which
  // calls doAdvance) first. Bridge them through refs.
  const restartRef = useRef<() => void>(() => {});

  const doAdvance = useCallback(
    (giveCredit: boolean) => {
      const outgoing = queue.current;
      if (outgoing) {
        score.record(outgoing, giveCredit, giveCredit ? responseTimeRef.current : null);
      } else if (!giveCredit) {
        score.breakStreak();
      }
      clearTimeout(gapTimerRef.current ?? undefined);
      gapTimerRef.current = setTimeout(() => {
        const next = queue.advance();
        if (!next) return;
        resetHit();
        startRef.current = performance.now();
        restartRef.current();
      }, ADVANCE_GAP_MS);
    },
    [queue, score, resetHit],
  );

  const onElapsed = useCallback(() => {
    const cur = queue.current;
    const listenerNote = flags.current.listening && cur?.type === "note";
    if (listenerNote) {
      if (hitRef.current) {
        doAdvance(true);
      } else if (withinTimeRef.current) {
        // First timeout without a hit: stop the streak but keep waiting for a
        // late hit instead of advancing.
        withinTimeRef.current = false;
        score.breakStreak();
      }
    } else {
      doAdvance(false);
    }
  }, [queue, score, doAdvance]);

  const { progress, restart } = useCountdown({
    durationMs: interval * 1000,
    running: running && !paused,
    onElapsed,
  });
  restartRef.current = restart;

  const start = useCallback(() => {
    if (pool.length === 0) return;
    score.reset();
    resetClock();
    queue.reset();
    setRunning(true);
    setPaused(false);
    resetHit();
    startRef.current = performance.now();
    queue.advance();
    restart();
  }, [pool.length, score, resetClock, queue, resetHit, restart]);

  const finish = useCallback((): SessionRawResult => {
    const snap = score.snapshot();
    clearTimeout(gapTimerRef.current ?? undefined);
    setRunning(false);
    setPaused(false);
    setHitStatus(null);
    queue.reset();
    score.reset();
    speechSynthesis.cancel();
    return { ...snap, practiceTime };
  }, [score, queue, practiceTime]);

  const pauseToggle = useCallback(() => setPaused((p) => !p), []);

  const forceAccept = useCallback(() => doAdvance(false), [doAdvance]);

  const skip = useCallback(() => {
    const next = queue.advance();
    if (!next) return;
    resetHit();
    responseTimeRef.current = null;
    startRef.current = performance.now();
  }, [queue, resetHit]);

  const onDetectedNote = useCallback(
    (noteId: string | null) => {
      const f = flags.current;
      if (!f.listening || !f.running || f.paused) return;
      const cur = queue.current;
      if (!cur || cur.type !== "note" || hitRef.current || noteId == null) return;
      if (noteId === (cur.enharmonicId ?? cur.id)) {
        setHitStatus("correct");
        hitRef.current = true;
        responseTimeRef.current = (performance.now() - startRef.current) / 1000;
        // A correct note that arrives after the timer already expired advances
        // immediately (without credit, since the streak was already broken).
        if (!withinTimeRef.current) doAdvance(false);
      } else {
        setHitStatus("wrong");
      }
    },
    [queue, doAdvance],
  );

  return {
    current: queue.current,
    count: queue.count,
    streak: score.streak,
    progress,
    paused,
    hitStatus,
    practiceTime,
    micActive: listening && running && !paused,
    start,
    finish,
    pauseToggle,
    forceAccept,
    skip,
    onDetectedNote,
  };
}
