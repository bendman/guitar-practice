import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useSettings as useSettingsEngine } from "./hooks/useSettings";
import { useProgress as useProgressEngine } from "./hooks/useProgress";
import { useCustomVoicings } from "./hooks/useCustomVoicings";
import { useCustomPresets } from "./hooks/useCustomPresets";
import type { Stats, SessionSummary, Weights } from "./lib/stats";
import {
  load as loadPreferredVoicingsBlob,
  save as savePreferredVoicings,
} from "./persistence/preferredVoicings";

function loadPreferredVoicings(): Record<string, number> {
  return loadPreferredVoicingsBlob().data;
}

/**
 * Shared app state, split into four change-frequency-scoped contexts so each is
 * its own re-render boundary and a single combined hook can never collide keys:
 *
 *   - SettingsContext      — durable user preferences (interval, enabled, naming…)
 *   - ProgressContext      — the learning record (stats, weights, confusions)
 *   - VoicingsContext      — chord voicings/presets and the preferred-voicing map
 *   - SessionHandoffContext — ephemeral state passed between two routes
 *
 * Values are nested objects (never spread into one bag), so consumers subscribe
 * to exactly one slice and unrelated updates don't re-render them.
 */

// ── Settings ────────────────────────────────────────────────────────────────
export type Settings = ReturnType<typeof useSettingsEngine>;
const SettingsContext = createContext<Settings | null>(null);

export function useSettings(): Settings {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within AppStateProvider");
  return ctx;
}

// ── Progress ──────────────────────────────────────────────────────────────────
export type Progress = ReturnType<typeof useProgressEngine>;
const ProgressContext = createContext<Progress | null>(null);

export function useProgress(): Progress {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used within AppStateProvider");
  return ctx;
}

// ── Voicings & presets ────────────────────────────────────────────────────────
type CustomVoicings = ReturnType<typeof useCustomVoicings>;
type CustomPresets = ReturnType<typeof useCustomPresets>;
export type Voicings = CustomVoicings &
  CustomPresets & {
    preferredVoicings: Record<string, number>;
    setPreferredVoicing: (chordId: string, idx: number) => void;
  };
const VoicingsContext = createContext<Voicings | null>(null);

export function useVoicings(): Voicings {
  const ctx = useContext(VoicingsContext);
  if (!ctx) throw new Error("useVoicings must be used within AppStateProvider");
  return ctx;
}

// ── Session handoff ───────────────────────────────────────────────────────────
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
const SessionHandoffContext = createContext<SessionHandoff | null>(null);

export function useSessionHandoff(): SessionHandoff {
  const ctx = useContext(SessionHandoffContext);
  if (!ctx) throw new Error("useSessionHandoff must be used within AppStateProvider");
  return ctx;
}

// ── Providers ─────────────────────────────────────────────────────────────────
function VoicingsProvider({ children }: { children: ReactNode }) {
  const voicings = useCustomVoicings();
  const presets = useCustomPresets();
  const [preferredVoicings, setPreferredVoicings] =
    useState<Record<string, number>>(loadPreferredVoicings);

  const setPreferredVoicing = useCallback((chordId: string, idx: number) => {
    setPreferredVoicings((prev) => {
      const next = { ...prev, [chordId]: idx };
      savePreferredVoicings(next);
      return next;
    });
  }, []);

  const value: Voicings = useMemo(
    () => ({ ...voicings, ...presets, preferredVoicings, setPreferredVoicing }),
    [voicings, presets, preferredVoicings, setPreferredVoicing],
  );
  return <VoicingsContext.Provider value={value}>{children}</VoicingsContext.Provider>;
}

function SessionHandoffProvider({ children }: { children: ReactNode }) {
  const [lastSummary, setLastSummaryRaw] = useState<SessionSummary | null>(null);
  const [lastSessionMode, setLastSessionMode] = useState<"notes" | "chords" | null>(null);
  const [preSessionStats, setPreSessionStats] = useState<Stats | null>(null);
  const [preSessionWeights, setPreSessionWeights] = useState<Weights>({});
  const [chordPreset, setChordPreset] = useState<string | null>(null);
  const [chordProgression, setChordProgression] = useState<string | null>(null);

  const setLastSummary = useCallback(
    (summary: SessionSummary | null, mode: "notes" | "chords" | null = null) => {
      setLastSummaryRaw(summary);
      setLastSessionMode(summary ? mode : null);
    },
    [],
  );

  const capturePreSession = useCallback((stats: Stats, weights: Weights) => {
    setPreSessionStats(stats);
    setPreSessionWeights(weights);
  }, []);

  const value: SessionHandoff = useMemo(
    () => ({
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
    }),
    [
      lastSummary,
      lastSessionMode,
      setLastSummary,
      preSessionStats,
      preSessionWeights,
      capturePreSession,
      chordPreset,
      chordProgression,
    ],
  );
  return <SessionHandoffContext.Provider value={value}>{children}</SessionHandoffContext.Provider>;
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const settings = useSettingsEngine();
  const progress = useProgressEngine();

  return (
    <SettingsContext.Provider value={settings}>
      <ProgressContext.Provider value={progress}>
        <VoicingsProvider>
          <SessionHandoffProvider>{children}</SessionHandoffProvider>
        </VoicingsProvider>
      </ProgressContext.Provider>
    </SettingsContext.Provider>
  );
}
