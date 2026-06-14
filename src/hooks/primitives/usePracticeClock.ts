import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Wall-clock accumulator. While `active` is true it adds real elapsed time
 * (seconds) every animation frame; pausing freezes the total, resuming
 * continues from where it left off. `reset()` zeroes the accumulator.
 *
 * Mechanism only — no knowledge of sessions, items, or scoring.
 */
export function usePracticeClock(active: boolean): { practiceTime: number; reset: () => void } {
  const [practiceTime, setPracticeTime] = useState(0);
  const accRef = useRef(0);

  useEffect(() => {
    if (!active) return;
    let rafId: number;
    let last = performance.now();
    const tick = () => {
      const now = performance.now();
      accRef.current += (now - last) / 1000;
      setPracticeTime(accRef.current);
      last = now;
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [active]);

  const reset = useCallback(() => {
    accRef.current = 0;
    setPracticeTime(0);
  }, []);

  return { practiceTime, reset };
}
