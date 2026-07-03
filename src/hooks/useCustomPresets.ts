import { useCallback, useMemo, useState } from "react";
import type { ChordProgression } from "../lib/constants";
import { load as loadBlob, save as saveCustomPresets } from "../persistence/customPresets";

function loadCustomPresets(): ChordProgression[] {
  return loadBlob().data;
}

export function useCustomPresets() {
  const [customPresets, setCustomPresets] = useState<ChordProgression[]>(loadCustomPresets);

  const addPreset = useCallback((label: string, chordIds: string[]) => {
    setCustomPresets((prev) => {
      const next = [...prev, { id: `custom_${Date.now()}`, label, chordIds }];
      saveCustomPresets(next);
      return next;
    });
  }, []);

  const removePreset = useCallback((id: string) => {
    setCustomPresets((prev) => {
      const next = prev.filter((p) => p.id !== id);
      saveCustomPresets(next);
      return next;
    });
  }, []);

  return useMemo(
    () => ({ customPresets, addPreset, removePreset }),
    [customPresets, addPreset, removePreset],
  );
}
