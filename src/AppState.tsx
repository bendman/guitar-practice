import { createContext, useContext, useState, type ReactNode } from "react";
import { useSettings } from "./hooks/useSettings";
import { useProgress } from "./hooks/useProgress";
import { useCustomVoicings } from "./hooks/useCustomVoicings";
import { useCustomPresets } from "./hooks/useCustomPresets";
import type { Stats, SessionSummary, Weights } from "./lib/stats";
import { load as loadPreferredVoicingsBlob, save as savePreferredVoicings } from "./persistence/preferredVoicings";

function loadPreferredVoicings(): Record<string, number> {
  return loadPreferredVoicingsBlob().data;
}

type Settings = ReturnType<typeof useSettings>;
type Progress = ReturnType<typeof useProgress>;
type Voicings = ReturnType<typeof useCustomVoicings>;
type Presets = ReturnType<typeof useCustomPresets>;

export interface SessionHandoff {
  lastSummary: SessionSummary | null;
  lastSessionMode: "notes" | "chords" | null;
  setLastSummary: (summary: SessionSummary | null, mode?: "notes" | "chords" | null) => void;
  preSessionStats: Stats | null;
  preSessionWeights: Weights;
  capturePreSession: (stats: Stats, weights: Weights) => void;
  chordPreset: string | null;
  setChordPreset: (id: string | null) => void;
  chordProgression: string | null;
  setChordProgression: (id: string | null) => void;
}

export type AppStateValue = Settings & Progress & Voicings & Presets & SessionHandoff & {
  preferredVoicings: Record<string, number>;
  setPreferredVoicing: (chordId: string, idx: number) => void;
};

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const settings = useSettings();
  const progress = useProgress();
  const voicings = useCustomVoicings();
  const presets = useCustomPresets();
  const [preferredVoicings, setPreferredVoicings] = useState<Record<string, number>>(loadPreferredVoicings);
  const [lastSummary, setLastSummaryRaw] = useState<SessionSummary | null>(null);
  const [lastSessionMode, setLastSessionMode] = useState<"notes" | "chords" | null>(null);
  const setLastSummary = (summary: SessionSummary | null, mode: "notes" | "chords" | null = null) => {
    setLastSummaryRaw(summary);
    if (mode !== undefined) setLastSessionMode(summary ? mode : null);
  };
  const [preSessionStats, setPreSessionStats] = useState<Stats | null>(null);
  const [preSessionWeights, setPreSessionWeights] = useState<Weights>({});
  const [chordPreset, setChordPreset] = useState<string | null>(null);
  const [chordProgression, setChordProgression] = useState<string | null>(null);

  const setPreferredVoicing = (chordId: string, idx: number) => {
    setPreferredVoicings((prev) => {
      const next = { ...prev, [chordId]: idx };
      savePreferredVoicings(next);
      return next;
    });
  };

  const capturePreSession = (stats: Stats, weights: Weights) => {
    setPreSessionStats(stats);
    setPreSessionWeights(weights);
  };

  const value: AppStateValue = {
    ...settings,
    ...progress,
    ...voicings,
    ...presets,
    preferredVoicings,
    setPreferredVoicing,
    lastSummary,
    lastSessionMode,
    setLastSummary,
    preSessionStats,
    preSessionWeights,
    capturePreSession,
    chordPreset,
    setChordPreset,
    chordProgression,
    setChordProgression,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}
