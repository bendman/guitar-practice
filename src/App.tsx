import { useEffect, useState } from "react";
import { ALL, CHORDS, CHORD_PRESETS, CHORD_PROGRESSIONS } from "./lib/constants";
import { usePitchDetection } from "./hooks/usePitchDetection";
import { useSession } from "./hooks/useSession";
import { useSettings } from "./hooks/useSettings";
import { useProgress } from "./hooks/useProgress";
import { useIntervalHotkeys } from "./hooks/useIntervalHotkeys";
import { buildActivePool } from "./lib/util";
import { NoteNamingProvider } from "./lib/noteNaming";
import { summarizeSession } from "./lib/summarizeSession";
import type { Stats, SessionSummary, Weights } from "./lib/stats";
import WelcomeView from "./components/views/WelcomeView";
import ConfigView from "./components/views/ConfigView";
import SessionView from "./components/views/SessionView";
import SummaryView from "./components/views/SummaryView";
import ProgressView from "./components/views/ProgressView";
import DebugView from "./components/views/DebugView";
import LearningView from "./components/views/LearningView";

export default function GuitarPractice() {
  const {
    intervalSecs, setIntervalSecs,
    enabled, setEnabled,
    tts, setTts,
    listening, setListening,
    chordMode, setChordMode,
    workingSetSize, setWorkingSetSize,
    noteNaming, setNoteNaming,
    spokenNaming, setSpokenNaming,
    voiceURI, setVoiceURI,
  } = useSettings();
  const {
    stats, weights, confusions,
    recordResult, recordConfusion, commitSession, resetAllStats, resetAllWeights,
  } = useProgress();

  const [chordPreset, setChordPreset] = useState<string | null>(null);
  const [chordProgression, setChordProgression] = useState<string | null>(null);
  const [devScreen, setDevScreen] = useState<string | null>(null);
  const [showLearning, setShowLearning] = useState(false);
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);
  const [screen, setScreen] = useState<"welcome" | "config" | "progress">("welcome");
  const [mode, setMode] = useState<"notes" | "chords" | null>(null);
  const [preSessionStats, setPreSessionStats] = useState<Stats | null>(null);
  const [preSessionWeights, setPreSessionWeights] = useState<Weights>({});

  const targetType = mode === "chords" ? "chord" : "note";
  const pool = ALL.filter((item) => enabled[item.id] && item.type === targetType);
  const activePool = buildActivePool(pool, weights, workingSetSize);

  const session = useSession({
    interval: intervalSecs,
    pool: activePool,
    fullPool: pool,
    listening: mode === "notes" && listening,
    tts,
    spokenNaming,
    voiceURI,
    chordMode: mode === "chords" ? chordMode : "manual",
    weights,
    confusions,
    onResult: recordResult,
    onConfusion: recordConfusion,
  });

  const detectedNote = usePitchDetection(session.micActive, session.count);

  useEffect(() => {
    session.onDetectedNote(detectedNote);
  }, [detectedNote]); // eslint-disable-line react-hooks/exhaustive-deps

  useIntervalHotkeys(session.inSession, setIntervalSecs);

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
    commitSession(summary);
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
    setPreSessionWeights(weights);
    session.start();
  };

  const handleReplay = () => {
    setSessionSummary(null);
    setScreen("config");
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
        preWeights={preSessionWeights}
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
