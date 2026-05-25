import { useEffect, useRef, useState } from "react";
import { pickRandom, sayAloud } from "./util";

// Drives a practice session: timer + RAF progress bar + practice-time clock,
// random item selection, and optional mic-hit detection coupling with streak logic.
//
// Inputs:
//   interval (s), pool (items), listening, tts — read live each tick via a ref
//     so the timer doesn't restart when only pool/listening/tts change.
//
// Returns:
//   state (inSession, paused, current, …),
//   micActive (compute whether mic should be on),
//   start()/finish()/pauseToggle()/forceAccept()/resetPracticeTime() actions,
//   onDetectedNote(noteId) — feed from pitch hook on each detection change.
export function useSession({ interval, pool, listening, tts }) {
  const [inSession, setInSession] = useState(false);
  const [paused, setPaused] = useState(false);
  const [current, setCurrent] = useState(null);
  const [progress, setProgress] = useState(0);
  const [count, setCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [hitStatus, setHitStatus] = useState(null);
  const [practiceTime, setPracticeTime] = useState(0);

  // Refs the timer/RAF need to read async.
  const lastIdRef = useRef(null);
  const withinTimeRef = useRef(true);
  const advanceFnRef = useRef(null);
  const timerIdRef = useRef(null);
  const startRef = useRef(0);
  const responseTimeRef = useRef(null);
  const resultsRef = useRef([]);
  const bestStreakRef = useRef(0);
  const streakRef = useRef(0);
  const hitForCurrentRef = useRef(false);
  const practiceTimeRef = useRef(0);

  // Latest non-reactive inputs for the timer loop (kept in a ref so mid-session
  // changes to pool/listening/tts take effect on next tick without restart).
  const latest = useRef({ interval, pool, listening, tts, current });
  useEffect(() => {
    latest.current = { interval, pool, listening, tts, current };
  });

  const resetHit = () => {
    hitForCurrentRef.current = false;
    withinTimeRef.current = true;
    setHitStatus(null);
  };

  // Switching listening mode mid-session counts as a fresh target — clear the
  // pending hit on the *outgoing* listening value (runs as cleanup before the
  // next effect setup).
  useEffect(() => () => resetHit(), [listening]);

  // Session timer + RAF progress + practice clock.
  useEffect(() => {
    if (!inSession || paused) return;

    let rafId;
    let lastFrame = performance.now();
    startRef.current = performance.now();
    withinTimeRef.current = true;

    const doAdvance = (giveCredit) => {
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
      }
      const next = pickRandom(latest.current.pool, lastIdRef.current);
      clearTimeout(timerIdRef.current);
      if (next) {
        lastIdRef.current = next.id;
        if (latest.current.tts) sayAloud(next);
        setTimeout(() => {
          setCurrent(next);
          setCount((c) => c + 1);
          resetHit();
          // Start progress origin + reschedule together so the bar always
          // reaches 100% exactly when the next timeout fires.
          startRef.current = performance.now();
          timerIdRef.current = setTimeout(onTimeout, latest.current.interval * 1000);
        }, 200);
      }
    };

    const onTimeout = () => {
      const listenerNote = latest.current.listening && latest.current.current?.type === "note";
      if (listenerNote) {
        if (hitForCurrentRef.current) {
          doAdvance(true);
        } else if (withinTimeRef.current) {
          // Time expired without a correct note — freeze bar at 100% and wait.
          // The hit observer will call advanceFnRef on next correct note.
          withinTimeRef.current = false;
          streakRef.current = 0;
          setStreak(0);
        }
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
      clearTimeout(timerIdRef.current);
      cancelAnimationFrame(rafId);
    };
  }, [inSession, paused, interval]);

  const onDetectedNote = (noteId) => {
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
    const first = pickRandom(pool, null);
    lastIdRef.current = first?.id;
    setCurrent(first);
    setCount(1);
    setProgress(0);
    setHitStatus(null);
    setStreak(0);
    withinTimeRef.current = true;
    setInSession(true);
    setPaused(false);
    if (tts && first) sayAloud(first);
  };

  // Stop the session and return its aggregated raw data for summarization.
  const finish = () => {
    const out = {
      results: resultsRef.current,
      bestStreak: bestStreakRef.current,
      practiceTime: practiceTimeRef.current,
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
  const resetPracticeTime = () => {
    practiceTimeRef.current = 0;
    setPracticeTime(0);
  };

  const micActive = listening && inSession && !paused;

  return {
    inSession, paused, current, progress, count, streak, hitStatus, practiceTime,
    micActive, onDetectedNote,
    start, finish, pauseToggle, forceAccept, resetPracticeTime,
  };
}
