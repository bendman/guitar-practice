import { useEffect } from "react";

/**
 * Nudges the practice interval with Up/Down arrows while `active`.
 *
 * Used during a live session to retune pacing without leaving the screen.
 * Steps ±0.1s, clamped to 0.5–10s; detaches the listener when inactive.
 */
export function useIntervalHotkeys(
  active: boolean,
  setIntervalSecs: (updater: (v: number) => number) => void,
) {
  useEffect(() => {
    if (!active) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setIntervalSecs((v) => Math.min(v + 0.1, 10));
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setIntervalSecs((v) => Math.max(v - 0.1, 0.5));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [active, setIntervalSecs]);
}
