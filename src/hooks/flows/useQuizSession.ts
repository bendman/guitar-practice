import { useCallback, useEffect, useRef, useState } from "react";
import type { ChordItem, PracticeItem } from "../../lib/constants";
import type { Confusions } from "../../lib/stats";
import type { NoteNaming } from "../../lib/util";
import { pickDistractors, shuffle } from "../../lib/util";
import { useItemQueue } from "../primitives/useItemQueue";
import { usePracticeClock } from "../primitives/usePracticeClock";
import { useScore } from "../primitives/useScore";
import type { SessionRawResult } from "./types";

interface QuizSessionOptions {
  pool: PracticeItem[];
  fullPool?: PracticeItem[];
  weights?: Record<string, number>;
  confusions?: Confusions;
  tts?: boolean;
  spokenNaming?: NoteNaming;
  voiceURI?: string | null;
  onResult?: (itemId: string, correct: boolean) => void;
  onConfusion?: (correctId: string, chosenWrongId: string) => void;
}

export interface QuizSession {
  current: PracticeItem | null;
  count: number;
  streak: number;
  paused: boolean;
  practiceTime: number;
  choices: ChordItem[];
  correctId: string | null;
  selectedId: string | null;
  start: () => void;
  finish: () => SessionRawResult;
  pauseToggle: () => void;
  select: (id: string) => void;
  next: () => void;
}

const isChord = (i: PracticeItem): i is ChordItem => i.type === "chord";

/**
 * Multiple-choice (QCM) chord quiz flow. Composes the weighted item queue and
 * the score primitive; owns the round's `choices`/`correctId`/`selectedId` and
 * the confusion-biased distractor selection. No countdown — rounds advance only
 * when the user picks and asks for the next.
 */
export function useQuizSession({
  pool,
  fullPool = [],
  weights = {},
  confusions = {},
  tts = false,
  spokenNaming = "solfege",
  voiceURI = null,
  onResult,
  onConfusion,
}: QuizSessionOptions): QuizSession {
  const queue = useItemQueue({ pool, weights, tts, spokenNaming, voiceURI });
  const score = useScore({ onResult });

  const [paused, setPaused] = useState(false);
  const [running, setRunning] = useState(false);
  const [choices, setChoices] = useState<ChordItem[]>([]);
  const [correctId, setCorrectId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { practiceTime, reset: resetClock } = usePracticeClock(running && !paused);

  const latest = useRef({ pool, fullPool, confusions, onConfusion });
  useEffect(() => {
    latest.current = { pool, fullPool, confusions, onConfusion };
  });

  // Pick the next target (weighted, non-repeating) and build a shuffled round of
  // the target plus three confusion-biased distractors.
  const buildRound = useCallback(() => {
    const target = queue.advance();
    if (!target || !isChord(target)) return;
    const activeChords = latest.current.pool.filter(isChord);
    const fullChords = latest.current.fullPool.filter(isChord);
    const distractors = pickDistractors(target, activeChords, fullChords, latest.current.confusions, 3);
    setChoices(shuffle([target, ...distractors]));
    setCorrectId(target.id);
    setSelectedId(null);
  }, [queue]);

  const start = useCallback(() => {
    if (latest.current.pool.length === 0) return;
    score.reset();
    resetClock();
    queue.reset();
    setRunning(true);
    setPaused(false);
    buildRound();
  }, [buildRound, queue, score, resetClock]);

  const finish = useCallback((): SessionRawResult => {
    const snap = score.snapshot();
    setRunning(false);
    setPaused(false);
    queue.reset();
    score.reset();
    setChoices([]);
    setCorrectId(null);
    setSelectedId(null);
    speechSynthesis.cancel();
    return { ...snap, practiceTime };
  }, [score, queue, practiceTime]);

  const pauseToggle = useCallback(() => setPaused((p) => !p), []);

  const select = useCallback(
    (id: string) => {
      if (selectedId != null) return;
      const target = queue.current;
      if (!target) return;
      const correct = id === target.id;
      setSelectedId(id);
      score.record(target, correct);
      if (!correct) latest.current.onConfusion?.(target.id, id);
    },
    [selectedId, queue.current, score],
  );

  const next = useCallback(() => {
    if (selectedId == null) return;
    buildRound();
  }, [selectedId, buildRound]);

  return {
    current: queue.current,
    count: queue.count,
    streak: score.streak,
    paused,
    practiceTime,
    choices,
    correctId,
    selectedId,
    start,
    finish,
    pauseToggle,
    select,
    next,
  };
}
