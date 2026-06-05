import { useState } from "react";
import type { ChordProgression } from "../lib/constants";

const CUSTOM_PRESETS_KEY = "guitar-practice-custom-presets";

function loadCustomPresets(): ChordProgression[] {
  try { return (JSON.parse(localStorage.getItem(CUSTOM_PRESETS_KEY) ?? "null") as ChordProgression[] | null) ?? []; }
  catch { return []; }
}

function saveCustomPresets(v: ChordProgression[]) {
  try { localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(v)); }
  catch { /* ignore quota / disabled storage */ }
}

export function useCustomPresets() {
  const [customPresets, setCustomPresets] = useState<ChordProgression[]>(loadCustomPresets);

  const addPreset = (label: string, chordIds: string[]) => {
    setCustomPresets((prev) => {
      const next = [...prev, { id: `custom_${Date.now()}`, label, chordIds }];
      saveCustomPresets(next);
      return next;
    });
  };

  const removePreset = (id: string) => {
    setCustomPresets((prev) => {
      const next = prev.filter((p) => p.id !== id);
      saveCustomPresets(next);
      return next;
    });
  };

  return { customPresets, addPreset, removePreset };
}
