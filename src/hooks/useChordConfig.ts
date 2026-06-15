import {
  ALL, CHORDS, CHORD_PRESETS, CHORD_PROGRESSIONS, mergeCustomVoicings,
} from "../lib/constants";
import type { ChordItem, PracticeItem } from "../lib/constants";
import { buildActivePool } from "../lib/util";
import { useSettings, useVoicings, useProgress, useSessionHandoff } from "../AppState";

type Mode = "notes" | "chords";

/**
 * Derives the practice pool for a mode from the enabled set, custom voicings and
 * spaced-repetition weights. Shared verbatim by the config, session and learning
 * screens so the derivation lives in exactly one place.
 */
export function usePracticePool(mode: Mode): { pool: PracticeItem[]; activePool: PracticeItem[] } {
  const { enabled, workingSetSize } = useSettings();
  const { customVoicings } = useVoicings();
  const { weights } = useProgress();

  const targetType = mode === "chords" ? "chord" : "note";
  const basePool = ALL.filter((item) => enabled[item.id] && item.type === targetType);
  const pool = targetType === "chord"
    ? mergeCustomVoicings(basePool as ChordItem[], customVoicings)
    : basePool;
  const activePool = buildActivePool(pool, weights, workingSetSize);

  return { pool, activePool };
}

/**
 * Chord-collection orchestration for the config screen: each action mutates the
 * enabled set and the (mutually exclusive) preset/progression markers together,
 * so they can never drift out of sync. Pure state — navigation stays in the route.
 */
export function useChordConfig() {
  const { setEnabled } = useSettings();
  const { addPreset, customPresets } = useVoicings();
  const { setChordPreset, setChordProgression } = useSessionHandoff();

  const setEnabledManual = (updater: (prev: Record<string, boolean>) => Record<string, boolean>) => {
    setEnabled(updater);
    setChordPreset(null);
    setChordProgression(null);
  };

  const applyChordCollection = (chordIds: string[], progId: string | null, presetId: string | null) => {
    const idSet = new Set(chordIds);
    setEnabled((prev) => {
      const next = { ...prev };
      for (const chord of CHORDS) next[chord.id] = idSet.has(chord.id);
      return next;
    });
    setChordProgression(progId);
    setChordPreset(presetId);
  };

  const applyPreset = (presetId: string) => {
    const builtIn = CHORD_PRESETS.find((p) => p.id === presetId);
    if (!builtIn) return;
    setEnabled((prev) => {
      const next = { ...prev };
      for (const chord of CHORDS) {
        next[chord.id] = builtIn.qualityIds === null || builtIn.qualityIds.includes(chord.qualityId);
      }
      return next;
    });
    setChordPreset(presetId);
    setChordProgression(null);
  };

  const applyProgression = (progId: string) => {
    const prog = CHORD_PROGRESSIONS.find((p) => p.id === progId);
    if (prog) applyChordCollection(prog.chordIds, progId, null);
  };

  const applyCustomPreset = (presetId: string) => {
    const custom = customPresets.find((p) => p.id === presetId);
    if (custom) applyChordCollection(custom.chordIds, presetId, null);
  };

  const saveCurrentAsPreset = (name: string, enabled: Record<string, boolean>) => {
    const chordIds = CHORDS.filter((c) => enabled[c.id]).map((c) => c.id);
    addPreset(name, chordIds);
  };

  return { setEnabledManual, applyPreset, applyProgression, applyCustomPreset, saveCurrentAsPreset };
}
