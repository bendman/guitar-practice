import { useEffect, useState } from "react";
import { ALL, CHORDS, CHORD_PRESETS, CHORD_PROGRESSIONS } from "./lib/constants";
import { usePitchDetection } from "./hooks/usePitchDetection";
import { useSession } from "./hooks/useSession";
import { applyResult, buildActivePool } from "./lib/util";
import type { NoteNaming } from "./lib/util";
import { NoteNamingProvider } from "./lib/noteNaming";
import { summarizeSession } from "./lib/summarizeSession";
import {
  loadStats, saveStats, resetStats, mergeSessionIntoStats,
  loadWeights, saveWeights, resetWeights,
  loadConfusions, saveConfusions, resetConfusions,
} from "./lib/stats";
import type { Stats, SessionSummary, Weights, Confusions } from "./lib/stats";
import type { ChordMode } from "./hooks/useSession";
import WelcomeView from "./components/views/WelcomeView";
import ConfigView from "./components/views/ConfigView";
import SessionView from "./components/views/SessionView";
import SummaryView from "./components/views/SummaryView";
import ProgressView from "./components/views/ProgressView";
import DebugView from "./components/views/DebugView";
import LearningView from "./components/views/LearningView";

const SETTINGS_KEY = "guitar-practice-settings";

interface StoredSettings {
  interval?: number;
  enabled?: Record<string, boolean>;
  tts?: boolean;
  listening?: boolean;
  chordAuto?: boolean;
  chordMode?: ChordMode;
  workingSetSize?: number;
  noteNaming?: NoteNaming;
  spokenNaming?: NoteNaming;
  voiceURI?: string | null;
}

function loadSettings(): StoredSettings {
  try { return (JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "null") as StoredSettings | null) ?? {}; }
  catch { return {}; }
}

const DEFAULT_ENABLED: Record<string, boolean> = Object.fromEntries(ALL.map((item) => [item.id, item.defaultEnabled !== false]));

function parseInitialSettings() {
  const s = loadSettings();
  return {
    intervalSecs: typeof s.interval === "number" ? s.interval : 2,
    enabled: s.enabled ? { ...DEFAULT_ENABLED, ...s.enabled } : { ...DEFAULT_ENABLED },
    tts: s.tts ?? false,
    listening: s.listening ?? false,
    chordMode: (s.chordMode ?? (s.chordAuto ? "auto" : "manual")) as ChordMode,
    workingSetSize: typeof s.workingSetSize === "number" ? s.workingSetSize : 5,
    noteNaming: (s.noteNaming === "letters" ? "letters" : "solfege") as NoteNaming,
    spokenNaming: (s.spokenNaming === "letters" ? "letters" : "solfege") as NoteNaming,
    voiceURI: typeof s.voiceURI === "string" ? s.voiceURI : null,
  };
}
const initialSettings = parseInitialSettings();

export default function GuitarPractice() {
  const [intervalSecs, setIntervalSecs] = useState<number>(initialSettings.intervalSecs);
  const [enabled, setEnabled] = useState<Record<string, boolean>>(initialSettings.enabled);
  const [tts, setTts] = useState<boolean>(initialSettings.tts);
  const [listening, setListening] = useState<boolean>(initialSettings.listening);
  const [chordPreset, setChordPreset] = useState<string | null>(null);
  const [chordProgression, setChordProgression] = useState<string | null>(null);
  const [chordMode, setChordMode] = useState<ChordMode>(initialSettings.chordMode);
  const [workingSetSize, setWorkingSetSize] = useState<number>(initialSettings.workingSetSize);
  const [noteNaming, setNoteNaming] = useState<NoteNaming>(initialSettings.noteNaming);
  const [spokenNaming, setSpokenNaming] = useState<NoteNaming>(initialSettings.spokenNaming);
  const [voiceURI, setVoiceURI] = useState<string | null>(initialSettings.voiceURI);
  const [devScreen, setDevScreen] = useState<string | null>(null);
  const [showLearning, setShowLearning] = useState(false);
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);
  const [stats, setStats] = useState<Stats>(loadStats);
  const [weights, setWeights] = useState<Weights>(loadWeights);
  const [confusions, setConfusions] = useState<Confusions>(loadConfusions);
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

  const recordConfusion = (correctId: string, chosenWrongId: string) => {
    setConfusions((prev) => {
      const forTarget = { ...(prev[correctId] ?? {}) };
      forTarget[chosenWrongId] = (forTarget[chosenWrongId] ?? 0) + 1;
      const next = { ...prev, [correctId]: forTarget };
      saveConfusions(next);
      return next;
    });
  };

  const session = useSession({
    interval: intervalSecs,
    pool: activePool,
    fullPool: pool,
    listening: mode === "notes" && listening,
    tts,
    spokenNaming,
    voiceURI,
    chordMode,
    weights,
    confusions,
    onResult: handleResult,
    onConfusion: recordConfusion,
  });

  const detectedNote = usePitchDetection(session.micActive, session.count);

  useEffect(() => {
    session.onDetectedNote(detectedNote);
  }, [detectedNote]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({
        interval: intervalSecs, enabled, tts, listening, chordMode, workingSetSize, noteNaming, spokenNaming, voiceURI,
      }));
    } catch { /* ignore quota / disabled storage */ }
  }, [intervalSecs, enabled, tts, listening, chordMode, workingSetSize, noteNaming, spokenNaming, voiceURI]);

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
      for (const chord of CHORDS) {
        next[chord.id] = preset.qualityIds === null || preset.qualityIds.includes(chord.qualityId);
      }
      return next;
    });
    setChordPreset(presetId);
    setChordProgression(null);
  };

  const applyProgression = (progId: string) => {
    const prog = CHORD_PROGRESSIONS.find((p) => p.id === progId);
    if (!prog) return;
    const progSet = new Set(prog.chordIds);
    setEnabled((prev) => {
      const next = { ...prev };
      for (const chord of CHORDS) {
        next[chord.id] = progSet.has(chord.id);
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
      wasManualChord: mode === "chords" && (chordMode === "manual" || chordMode === "quiz"),
    });
    setSessionSummary(summary);
    setStats((prev) => {
      const next = mergeSessionIntoStats(prev, summary);
      saveStats(next);
      return next;
    });
  };

  const resetAllStats = () => setStats(resetStats());
  const resetAllWeights = () => {
    setWeights(resetWeights());
    setConfusions(resetConfusions());
  };

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

  const renderContent = () => {
  if (import.meta.env.DEV && devScreen === "mic") {
    return <DebugView onBack={() => setDevScreen(null)} />;
  }

  if (showLearning) {
    return (
      <LearningView
        pool={pool}
        activePool={activePool}
        weights={weights}
        workingSetSize={workingSetSize}
        onBack={() => setShowLearning(false)}
      />
    );
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
        chordMode={chordMode}
        pendingReveal={session.pendingReveal}
        choices={session.choices}
        correctId={session.correctId}
        selectedId={session.selectedId}
        onPauseToggle={session.pauseToggle}
        onForceAccept={session.forceAccept}
        onManualNext={session.manualNext}
        onChordGrade={session.manualGrade}
        onQuizSelect={session.quizSelect}
        onQuizNext={session.quizNext}
        onStop={stopSession}
        onShowLearning={() => setShowLearning(true)}
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
        noteNaming={noteNaming}
        setNoteNaming={setNoteNaming}
        spokenNaming={spokenNaming}
        setSpokenNaming={setSpokenNaming}
        voiceURI={voiceURI}
        setVoiceURI={setVoiceURI}
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
        chordMode={chordMode}
        setChordMode={setChordMode}
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
  };

  return (
    <NoteNamingProvider naming={noteNaming}>
      {renderContent()}
    </NoteNamingProvider>
  );
}
