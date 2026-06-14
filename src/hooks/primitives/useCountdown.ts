import { useCallback, useEffect, useRef, useState } from "react";

interface CountdownOptions {
  durationMs: number;
  /** While true, progress advances each frame; false freezes it. */
  running: boolean;
  /** Fired once when progress first reaches 1. */
  onElapsed?: () => void;
}

/**
 * A single self-contained countdown: drives `progress` from 0 to 1 over
 * `durationMs` and fires `onElapsed` exactly once when it completes.
 * `restart()` begins a fresh cycle. Pausing (`running=false`) holds progress;
 * resuming restarts the current cycle's clock — matching the per-item timer
 * behaviour the timed flows expect.
 */
export function useCountdown({
  durationMs,
  running,
  onElapsed,
}: CountdownOptions): { progress: number; restart: () => void } {
  const [progress, setProgress] = useState(0);
  const [restartKey, setRestartKey] = useState(0);
  const firedRef = useRef(false);

  const onElapsedRef = useRef(onElapsed);
  const durationRef = useRef(durationMs);
  useEffect(() => {
    onElapsedRef.current = onElapsed;
    durationRef.current = durationMs;
  });

  useEffect(() => {
    if (!running) return;
    let rafId: number;
    const start = performance.now();
    firedRef.current = false;
    const tick = () => {
      const pct = Math.min((performance.now() - start) / durationRef.current, 1);
      setProgress(pct);
      if (pct >= 1 && !firedRef.current) {
        firedRef.current = true;
        onElapsedRef.current?.();
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [running, restartKey]);

  const restart = useCallback(() => {
    setProgress(0);
    setRestartKey((k) => k + 1);
  }, []);

  return { progress, restart };
}
