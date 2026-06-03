import { useState } from "react";
import type { Voicing } from "../lib/constants";

const CUSTOM_VOICINGS_KEY = "guitar-practice-custom-voicings";

export type CustomVoicings = Record<string, Voicing[]>;

function loadCustomVoicings(): CustomVoicings {
  try { return (JSON.parse(localStorage.getItem(CUSTOM_VOICINGS_KEY) ?? "null") as CustomVoicings | null) ?? {}; }
  catch { return {}; }
}

function saveCustomVoicings(v: CustomVoicings) {
  try { localStorage.setItem(CUSTOM_VOICINGS_KEY, JSON.stringify(v)); }
  catch { /* ignore quota / disabled storage */ }
}

/**
 * User-authored chord voicings, keyed by chord id (`{root}_{quality}`).
 * Each entry is appended to that chord's built-in voicings at runtime, so a
 * saved shape joins the chord's voicing rotation in practice.
 */
export function useCustomVoicings() {
  const [customVoicings, setCustomVoicings] = useState<CustomVoicings>(loadCustomVoicings);

  const addVoicing = (chordId: string, voicing: Voicing) => {
    setCustomVoicings((prev) => {
      const next = { ...prev, [chordId]: [...(prev[chordId] ?? []), voicing] };
      saveCustomVoicings(next);
      return next;
    });
  };

  const removeVoicing = (chordId: string, index: number) => {
    setCustomVoicings((prev) => {
      const remaining = (prev[chordId] ?? []).filter((_, i) => i !== index);
      const next = { ...prev };
      if (remaining.length) next[chordId] = remaining;
      else delete next[chordId];
      saveCustomVoicings(next);
      return next;
    });
  };

  return { customVoicings, addVoicing, removeVoicing };
}
