import { useEffect, useRef, useState } from "react";
import type { PracticeItem } from "../lib/constants";
import { pickWeightedRandom, sayAloud } from "../lib/util";
import type { NoteNaming } from "../lib/util";
import type { SessionResult } from "../lib/summarizeSession";

interface SessionOptions {
  interval: number;
  pool: PracticeItem[];
  listening: boolean;
  tts: boolean;
  spokenNaming?: NoteNaming;
  chordAuto: boolean;
  weights?: Record<string, number>;
  onResult?: (itemId: string, correct: boolean) => void;
}

export interface SessionRawResult {
  results: SessionResult[];
  bestStreak: number;
  practiceTime: number;
}

export interface UseSessionReturn {
  inSession: boolean;
  paused: boolean;
  current: PracticeItem | null;
  progress: number;
  count: number;
  streak: number;
  hitStatus: "correct" | "wrong" | null;
  practiceTime: number;
  pendingReveal: boolean;
  micActive: boolean;
  onDetectedNote: (noteId: string | null) => void;
  start: () => void;
  finish: () => SessionRawResult;
  pauseToggle: () => void;
  forceAccept: () => void;
  manualNext: () => void;
  manualGrade: (correct: boolean) => void;
  resetPracticeTime: () => void;
}

interface SessionLatest {
  interval: number;
  pool: PracticeItem[];
  listening: boolean;
  tts: boolean;
  spokenNaming: NoteNaming;
  current: PracticeItem | null;
  chordAuto: boolean;
  weights: Record<string, number>;
}

export function useSession({
  interval, pool, listening, tts, spokenNaming = "solfege", chordAuto, weights = {}, onResult,
}: SessionOptions): UseSessionReturn {
  const [inSession, setInSession] = useState(false);
  const [paused, setPaused] = useState(false);
  const [current, setCurrent] = useState<PracticeItem | null>(null);
  const [progress, setProgress] = useState(0);
  const [count, setCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [hitStatus, setHitStatus] = useState<"correct" | "wrong" | null>(null);
  const [practiceTime, setPracticeTime] = useState(0);
  const [pendingReveal, setPendingReveal] = useState(false);

  const lastIdRef = useRef<string | null>(null);
  const withinTimeRef = useRef(true);
  const advanceFnRef = useRef<((giveCredit: boolean) => void) | null>(null);
  const timerIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startRef = useRef(0);
  const responseTimeRef = useRef<number | null>(null);
  const resultsRef = useRef<SessionResult[]>([]);
  const bestStreakRef = useRef(0);
  const streakRef = useRef(0);
  const hitForCurrentRef = useRef(false);
  const practiceTimeRef = useRef(0);
  const sessionStartTimeRef = useRef(0);

  const latest = useRef<SessionLatest>({ interval, pool, listening, tts, spokenNaming, current, chordAuto, weights });
  useEffect(() => {
    latest.current = { interval, pool, listening, tts, spokenNaming, current, chordAuto, weights };
  });

  const resetHit = () => {
    hitForCurrentRef.current = false;
    withinTimeRef.current = true;
    setHitStatus(null);
    setPendingReveal(false);
  };

  useEffect(() => () => resetHit(), [listening]);

  useEffect(() => {
    if (!inSession || paused) return;

    let rafId: number;
    let lastFrame = performance.now();
    startRef.current = performance.now();
    withinTimeRef.current = true;

    const doAdvance = (giveCredit: boolean) => {
      if (giveCredit) {
        streakRef.current += 1;
        if (streakRef.current > bestStreakRef.current) bestStreakRef.current = streakRef.current;
        setStreak(streakRef.current);
      } else {
        streakRef.current = 0;
        setStreak(0);
      }
      const outgoing = latest.current.current;
      if (outgoing) {
        resultsRef.current.push({
          id: outgoing.id,
          label: outgoing.label,
          type: outgoing.type,
          correct: giveCredit,
          responseTime: giveCredit ? responseTimeRef.current : null,
        });
        onResult?.(outgoing.id, giveCredit);
      }
      const next = pickWeightedRandom(latest.current.pool, lastIdRef.current, latest.current.weights);
      clearTimeout(timerIdRef.current ?? undefined);
      if (next) {
        lastIdRef.current = next.id;
        if (latest.current.tts) sayAloud(next, latest.current.spokenNaming);
        setTimeout(() => {
          setCurrent(next);
          setCount((c) => c + 1);
          resetHit();
          startRef.current = performance.now();
          timerIdRef.current = setTimeout(onTimeout, latest.current.interval * 1000);
        }, 200);
      }
    };

    const onTimeout = () => {
      const listenerNote = latest.current.listening && latest.current.current?.type === "note";
      const manualChord = !latest.current.chordAuto && latest.current.current?.type === "chord";
      if (listenerNote) {
        if (hitForCurrentRef.current) {
          doAdvance(true);
        } else if (withinTimeRef.current) {
          withinTimeRef.current = false;
          streakRef.current = 0;
          setStreak(0);
        }
      } else if (manualChord) {
        setPaused(true);
        setPendingReveal(true);
      } else {
        doAdvance(false);
      }
    };

    advanceFnRef.current = doAdvance;
    timerIdRef.current = setTimeout(onTimeout, interval * 1000);

    const animate = () => {
      const now = performance.now();
      const pct = Math.min((now - startRef.current) / (latest.current.interval * 1000), 1);
      setProgress(pct);
      practiceTimeRef.current += (now - lastFrame) / 1000;
      setPracticeTime(practiceTimeRef.current);
      lastFrame = now;
      rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);

    return () => {
      clearTimeout(timerIdRef.current ?? undefined);
      cancelAnimationFrame(rafId);
    };
  }, [inSession, paused, interval]);

  const onDetectedNote = (noteId: string | null) => {
    if (!listening || !inSession || paused) return;
    const cur = latest.current.current;
    if (!cur || cur.type !== "note" || hitForCurrentRef.current) return;
    if (noteId == null) return;
    if (noteId === (cur.enharmonicId ?? cur.id)) {
      setHitStatus("correct");
      hitForCurrentRef.current = true;
      responseTimeRef.current = (performance.now() - startRef.current) / 1000;
      if (!withinTimeRef.current) advanceFnRef.current?.(false);
    } else {
      setHitStatus("wrong");
    }
  };

  const start = () => {
    if (pool.length === 0) return;
    resultsRef.current = [];
    bestStreakRef.current = 0;
    streakRef.current = 0;
    sessionStartTimeRef.current = practiceTimeRef.current;
    const first = pickWeightedRandom(pool, null, weights);
    lastIdRef.current = first?.id ?? null;
    setCurrent(first);
    setCount(1);
    setProgress(0);
    setHitStatus(null);
    setStreak(0);
    withinTimeRef.current = true;
    setPendingReveal(false);
    setInSession(true);
    setPaused(false);
    if (tts && first) sayAloud(first, spokenNaming);
  };

  const finish = (): SessionRawResult => {
    const out: SessionRawResult = {
      results: resultsRef.current,
      bestStreak: bestStreakRef.current,
      practiceTime: practiceTimeRef.current - sessionStartTimeRef.current,
    };
    setInSession(false);
    setPaused(false);
    setCurrent(null);
    setProgress(0);
    setHitStatus(null);
    setStreak(0);
    streakRef.current = 0;
    speechSynthesis.cancel();
    return out;
  };

  const pauseToggle = () => setPaused((p) => !p);
  const forceAccept = () => advanceFnRef.current?.(false);

  const manualNext = () => {
    const next = pickWeightedRandom(latest.current.pool, lastIdRef.current, latest.current.weights);
    if (!next) return;
    lastIdRef.current = next.id;
    setCurrent(next);
    setCount((c) => c + 1);
    setProgress(0);
    resetHit();
    if (latest.current.tts) sayAloud(next, latest.current.spokenNaming);
  };

  const manualGrade = (correct: boolean) => {
    const outgoing = latest.current.current;
    if (outgoing) {
      resultsRef.current.push({
        id: outgoing.id, label: outgoing.label, type: outgoing.type,
        correct, responseTime: null,
      });
      onResult?.(outgoing.id, correct);
    }
    if (correct) {
      streakRef.current += 1;
      if (streakRef.current > bestStreakRef.current) bestStreakRef.current = streakRef.current;
      setStreak(streakRef.current);
    } else {
      streakRef.current = 0;
      setStreak(0);
    }
    const next = pickWeightedRandom(latest.current.pool, lastIdRef.current, latest.current.weights);
    if (!next) return;
    lastIdRef.current = next.id;
    setCurrent(next);
    setCount((c) => c + 1);
    setProgress(0);
    resetHit();
    if (latest.current.tts) sayAloud(next, latest.current.spokenNaming);
  };

  const resetPracticeTime = () => {
    practiceTimeRef.current = 0;
    setPracticeTime(0);
  };

  const micActive = listening && inSession && !paused;

  return {
    inSession, paused, current, progress, count, streak, hitStatus, practiceTime, pendingReveal,
    micActive, onDetectedNote,
    start, finish, pauseToggle, forceAccept, manualNext, manualGrade, resetPracticeTime,
  };
}
