import { useState } from "react";
import type { Voicing } from "../lib/constants";
import { load as loadBlob, save as saveCustomVoicings, type CustomVoicings } from "../persistence/customVoicings";

export type { CustomVoicings } from "../persistence/customVoicings";

function loadCustomVoicings(): CustomVoicings {
  return loadBlob().data;
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
