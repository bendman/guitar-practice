import { createContext, useContext, useState, type ReactNode } from "react";
import { useSettings } from "./hooks/useSettings";
import { useProgress } from "./hooks/useProgress";
import { useCustomVoicings } from "./hooks/useCustomVoicings";
import { useCustomPresets } from "./hooks/useCustomPresets";

const PREFERRED_VOICINGS_KEY = "guitar-practice-preferred-voicings";

function loadPreferredVoicings(): Record<string, number> {
  try { return (JSON.parse(localStorage.getItem(PREFERRED_VOICINGS_KEY) ?? "null") as Record<string, number> | null) ?? {}; }
  catch { return {}; }
}

function savePreferredVoicings(v: Record<string, number>) {
  try { localStorage.setItem(PREFERRED_VOICINGS_KEY, JSON.stringify(v)); }
  catch { /* ignore quota / disabled storage */ }
}

type Settings = ReturnType<typeof useSettings>;
type Progress = ReturnType<typeof useProgress>;
type Voicings = ReturnType<typeof useCustomVoicings>;
type Presets = ReturnType<typeof useCustomPresets>;

export type AppStateValue = Settings & Progress & Voicings & Presets & {
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

  const setPreferredVoicing = (chordId: string, idx: number) => {
    setPreferredVoicings((prev) => {
      const next = { ...prev, [chordId]: idx };
      savePreferredVoicings(next);
      return next;
    });
  };

  const value: AppStateValue = {
    ...settings,
    ...progress,
    ...voicings,
    ...presets,
    preferredVoicings,
    setPreferredVoicing,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}
