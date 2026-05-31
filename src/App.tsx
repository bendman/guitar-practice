import { useEffect, useState } from "react";
import { ALL, CHORD_ROOTS, CHORD_QUALITIES, CHORD_PRESETS, CHORD_PROGRESSIONS } from "./lib/constants";
import { usePitchDetection } from "./hooks/usePitchDetection";
import { useSession } from "./hooks/useSession";
import { applyResult, buildActivePool } from "./lib/util";
import { summarizeSession } from "./lib/summarizeSession";
import {
  loadStats, saveStats, resetStats, mergeSessionIntoStats,
  loadWeights, saveWeights, resetWeights,
} from "./lib/stats";
import type { Stats, SessionSummary, Weights } from "./lib/stats";
import WelcomeView from "./components/views/WelcomeView";
import ConfigView from "./components/views/ConfigView";
import SessionView from "./components/views/SessionView";
import SummaryView from "./components/views/SummaryView";
import ProgressView from "./components/views/ProgressView";
import DebugView from "./components/views/DebugView";

const SETTINGS_KEY = "guitar-practice-settings";

interface StoredSettings {
  interval?: number;
  enabled?: Record<string, boolean>;
  tts?: boolean;
  listening?: boolean;
  chordAuto?: boolean;
  workingSetSize?: number;
}

function loadSettings(): StoredSettings {
  try { return (JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "null") as StoredSettings | null) ?? {}; }
  catch { return {}; }
}

function initialEnabled(): Record<string, boolean> {
  const defaults = Object.fromEntries(ALL.map((item) => [item.id, item.defaultEnabled !== false]));
  const stored = loadSettings().enabled;
  return stored ? { ...defaults, ...stored } : defaults;
}

export default function GuitarPractice() {
  const [intervalSecs, setIntervalSecs] = useState<number>(() => {
    const stored = loadSettings().interval;
    return typeof stored === "number" ? stored : 2;
  });
  const [enabled, setEnabled] = useState<Record<string, boolean>>(initialEnabled);
  const [tts, setTts] = useState<boolean>(() => loadSettings().tts ?? false);
  const [listening, setListening] = useState<boolean>(() => loadSettings().listening ?? false);
  const [chordPreset, setChordPreset] = useState<string | null>(null);
  const [chordProgression, setChordProgression] = useState<string | null>(null);
  const [chordAuto, setChordAuto] = useState<boolean>(() => loadSettings().chordAuto ?? false);
  const [workingSetSize, setWorkingSetSize] = useState<number>(() => {
    const stored = loadSettings().workingSetSize;
    return typeof stored === "number" ? stored : 5;
  });
  const [devScreen, setDevScreen] = useState<string | null>(null);
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);
  const [stats, setStats] = useState<Stats>(loadStats);
  const [weights, setWeights] = useState<Weights>(loadWeights);
  const [screen, setScreen] = useState<"welcome" | "config" | "progress">("welcome");
  const [mode, setMode] = useState<"notes" | "chords" | null>(null);
  const [preSessionStats, setPreSessionStats] = useState<Stats | null>(null);

  const targetType = mode === "chords" ? "chord" : "note";
  const pool = ALL.filter((item) => enabled[item.id] && item.type === targetType);
  const activePool = buildActivePool(pool, weights, workingSetSize);

  const handleResult = (itemId: string, correct: boolean) => {
    setWeights((prev) => {
      const next = applyResult(prev, itemId, correct);
      saveWeights(next);
      return next;
    });
  };

  const session = useSession({
    interval: intervalSecs,
    pool: activePool,
    listening: mode === "notes" && listening,
    tts,
    chordAuto,
    weights,
    onResult: handleResult,
  });

  const detectedNote = usePitchDetection(session.micActive, session.count);

  useEffect(() => {
    session.onDetectedNote(detectedNote);
  }, [detectedNote]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({
        interval: intervalSecs, enabled, tts, listening, chordAuto, workingSetSize,
      }));
    } catch { /* ignore quota / disabled storage */ }
  }, [intervalSecs, enabled, tts, listening, chordAuto, workingSetSize]);

  useEffect(() => {
    if (!session.inSession) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setIntervalSecs((v) => Math.min(v + 0.1, 10));
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setIntervalSecs((v) => Math.max(v - 0.1, 0.5));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [session.inSession]);

  const setEnabledManual = (next: (prev: Record<string, boolean>) => Record<string, boolean>) => {
    setEnabled(next);
    setChordPreset(null);
    setChordProgression(null);
  };

  const applyPreset = (presetId: string) => {
    const preset = CHORD_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setEnabled((prev) => {
      const next = { ...prev };
      for (const root of CHORD_ROOTS) {
        for (const q of CHORD_QUALITIES) {
          const id = `${root.id}_${q.id}`;
          next[id] = preset.qualityIds === null || preset.qualityIds.includes(q.id);
        }
      }
      return next;
    });
    setChordPreset(presetId);
    setChordProgression(null);
  };

  const applyProgression = (progId: string) => {
    const prog = CHORD_PROGRESSIONS.find((p) => p.id === progId);
    if (!prog) return;
    setEnabled((prev) => {
      const next = { ...prev };
      for (const root of CHORD_ROOTS) {
        for (const q of CHORD_QUALITIES) {
          const id = `${root.id}_${q.id}`;
          next[id] = prog.chordIds.includes(id);
        }
      }
      return next;
    });
    setChordProgression(progId);
    setChordPreset(null);
  };

  const stopSession = () => {
    const raw = session.finish();
    const summary = summarizeSession({
      ...raw,
      wasListening: mode === "notes" && listening,
      wasManualChord: mode === "chords" && !chordAuto,
    });
    setSessionSummary(summary);
    setStats((prev) => {
      const next = mergeSessionIntoStats(prev, summary);
      saveStats(next);
      return next;
    });
  };

  const resetAllStats = () => setStats(resetStats());
  const resetAllWeights = () => setWeights(resetWeights());

  const goWelcome = () => {
    setSessionSummary(null);
    setMode(null);
    setScreen("welcome");
  };

  const goProgress = () => setScreen("progress");

  const pickMode = (m: "notes" | "chords") => {
    setMode(m);
    setScreen("config");
  };

  const startSession = () => {
    setPreSessionStats(stats);
    session.start();
  };

  const handleReplay = () => {
    setPreSessionStats(stats);
    setSessionSummary(null);
    session.start();
  };

  if (import.meta.env.DEV && devScreen === "mic") {
    return <DebugView onBack={() => setDevScreen(null)} />;
  }

  if (session.inSession) {
    return (
      <SessionView
        current={session.current}
        count={session.count}
        streak={session.streak}
        progress={session.progress}
        paused={session.paused}
        listening={mode === "notes" && listening}
        detectedNote={detectedNote}
        hitStatus={session.hitStatus}
        practiceTime={session.practiceTime}
        interval={intervalSecs}
        chordAuto={chordAuto}
        pendingReveal={session.pendingReveal}
        onPauseToggle={session.pauseToggle}
        onForceAccept={session.forceAccept}
        onManualNext={session.manualNext}
        onChordGrade={session.manualGrade}
        onStop={stopSession}
      />
    );
  }

  if (sessionSummary !== null) {
    return (
      <SummaryView
        summary={sessionSummary}
        preSessionStats={preSessionStats}
        weights={weights}
        onDismiss={goWelcome}
        onReplay={handleReplay}
      />
    );
  }

  if (screen === "progress") {
    return (
      <ProgressView
        weights={weights}
        onBack={goWelcome}
        onResetWeights={resetAllWeights}
        workingSetSize={workingSetSize}
        setWorkingSetSize={setWorkingSetSize}
      />
    );
  }

  if (screen === "config") {
    return (
      <ConfigView
        mode={mode}
        interval={intervalSecs}
        setInterval={setIntervalSecs}
        enabled={enabled}
        setEnabled={setEnabledManual}
        tts={tts}
        setTts={setTts}
        listening={listening}
        setListening={setListening}
        pool={activePool}
        chordPreset={chordPreset}
        chordProgression={chordProgression}
        onPreset={applyPreset}
        onProgression={applyProgression}
        chordAuto={chordAuto}
        setChordAuto={setChordAuto}
        weights={weights}
        onStart={startSession}
        onBack={goWelcome}
        showDebugLink={import.meta.env.DEV}
        onShowDebug={() => setDevScreen("mic")}
      />
    );
  }

  void resetAllStats;

  return (
    <WelcomeView
      stats={stats}
      onPickNotes={() => pickMode("notes")}
      onPickChords={() => pickMode("chords")}
      onShowProgress={goProgress}
      showDebugLink={import.meta.env.DEV}
      onShowDebug={() => setDevScreen("mic")}
    />
  );
}
