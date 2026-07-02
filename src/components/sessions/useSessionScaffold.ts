import { useEffect, useRef } from "react";
import type { PracticeItem } from "../../lib/constants";

/**
 * Drive a flow session through one lifecycle: start once on mount, do nothing on
 * re-render, never auto-stop on unmount (the user's Arrêter button handles that).
 * The flow hooks own `start`/`finish` but stay test-friendly by not auto-starting
 * themselves — every screen shares this single effect instead of copy-pasting it.
 */
export function useStartOnMount(start: () => void) {
  const startedRef = useRef(false);
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/**
 * Resolve the session's current item against the live pool so reveals pick up
 * the latest voicing/label, falling back to the session's own copy if the item
 * has dropped out of the pool. Shared by the chord screens.
 */
export function resolveItem(
  pool: PracticeItem[],
  current: PracticeItem | null,
): PracticeItem | null {
  return current ? (pool.find((c) => c.id === current.id) ?? current) : null;
}
