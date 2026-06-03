import { useEffect, useState } from "react";

const RING_DURATION = 1200;

/**
 * Animates a number from 0 up to `target`, restarting when `target` changes.
 *
 * Used when the summary's accuracy ring reveals its score.
 * `animated` flips true on the first frame so the SVG ring can ease its stroke.
 */
export function useCountUp(target: number) {
  const [animated, setAnimated] = useState(false);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setAnimated(true));
    let frame: number;
    let startTime: number | null = null;
    const tick = (now: number) => {
      if (startTime == null) startTime = now;
      const t = Math.min((now - startTime) / RING_DURATION, 1);
      setDisplay(Math.round(t * target));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); cancelAnimationFrame(frame); };
  }, [target]);

  return { display, animated };
}

/**
 * Holds a level at `before`, then bumps it to `after` after a staggered delay.
 *
 * Used when the summary animates each chord's mastery gain.
 * The delay is keyed on `index` so rows fill in one after another.
 */
export function useDelayedLevel(
  before: 0 | 1 | 2 | 3,
  after: 0 | 1 | 2 | 3,
  index: number,
) {
  const [shown, setShown] = useState<0 | 1 | 2 | 3>(before);
  const changed = after !== before;

  useEffect(() => {
    if (!changed) return;
    const id = setTimeout(() => setShown(after), 250 + index * 120);
    return () => clearTimeout(id);
  }, [after, changed, index]);

  return shown;
}
