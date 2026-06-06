import { useEffect, useState } from "react";
import { ALL, CHORDS, CHORD_PRESETS, CHORD_PROGRESSIONS, mergeCustomVoicings } from "./lib/constants";
import type { ChordItem, Voicing } from "./lib/constants";
import { usePitchDetection } from "./hooks/usePitchDetection";
import { useSession } from "./hooks/useSession";
import { useSettings } from "./hooks/useSettings";
import { useProgress } from "./hooks/useProgress";
import { useCustomVoicings } from "./hooks/useCustomVoicings";
import { useCustomPresets } from "./hooks/useCustomPresets";
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
import ChordBuilderView from "./components/views/ChordBuilderView";
import SavePresetModal from "./components/ui/SavePresetModal";
import DeletePresetModal from "./components/ui/DeletePresetModal";

const PREFERRED_VOICINGS_KEY = "guitar-practice-preferred-voicings";

function loadPreferredVoicings(): Record<string, number> {
  try { return (JSON.parse(localStorage.getItem(PREFERRED_VOICINGS_KEY) ?? "null") as Record<string, number> | null) ?? {}; }
  catch { return {}; }
}

function savePreferredVoicings(v: Record<string, number>) {
  try { localStorage.setItem(PREFERRED_VOICINGS_KEY, JSON.stringify(v)); }
  catch { /* ignore quota / disabled storage */ }
}

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
    showChordNotes, setShowChordNotes,
  } = useSettings();
  const {
    stats, weights, confusions,
    recordResult, recordConfusion, commitSession, resetAllStats, resetAllWeights,
  } = useProgress();
  const { customVoicings, addVoicing, removeVoicing } = useCustomVoicings();
  const { customPresets, addPreset, removePreset } = useCustomPresets();

  const [builder, setBuilder] = useState<{ rootId: string; qualityId: string } | null>(null);
  const [savingPreset, setSavingPreset] = useState(false);
  const [deletingPresetId, setDeletingPresetId] = useState<string | null>(null);
  const [chordPreset, setChordPreset] = useState<string | null>(null);
  const [chordProgression, setChordProgression] = useState<string | null>(null);
  const [devScreen, setDevScreen] = useState<string | null>(null);
  const [showLearning, setShowLearning] = useState(false);
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);
  const [screen, setScreen] = useState<"welcome" | "config" | "progress">("welcome");
  const [mode, setMode] = useState<"notes" | "chords" | null>(null);
  const [preSessionStats, setPreSessionStats] = useState<Stats | null>(null);
  const [preSessionWeights, setPreSessionWeights] = useState<Weights>({});
  const [preferredVoicings, setPreferredVoicings] = useState<Record<string, number>>(loadPreferredVoicings);

  const targetType = mode === "chords" ? "chord" : "note";
  const basePool = ALL.filter((item) => enabled[item.id] && item.type === targetType);
  const pool = targetType === "chord"
    ? mergeCustomVoicings(basePool as ChordItem[], customVoicings)
    : basePool;
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

  const applyChordCollection = (chordIds: string[], id: string) => {
    const idSet = new Set(chordIds);
    setEnabled((prev) => {
      const next = { ...prev };
      for (const chord of CHORDS) next[chord.id] = idSet.has(chord.id);
      return next;
    });
    setChordProgression(id);
    setChordPreset(null);
  };

  const applyProgression = (progId: string) => {
    const prog = CHORD_PROGRESSIONS.find((p) => p.id === progId);
    if (prog) applyChordCollection(prog.chordIds, progId);
  };

  const applyCustomPreset = (presetId: string) => {
    const preset = customPresets.find((p) => p.id === presetId);
    if (preset) applyChordCollection(preset.chordIds, presetId);
  };

  const saveCurrentAsPreset = (name: string) => {
    const chordIds = CHORDS.filter((c) => enabled[c.id]).map((c) => c.id);
    addPreset(name, chordIds);
    setSavingPreset(false);
  };

  const handleRemoveCustomPreset = (id: string) => setDeletingPresetId(id);

  const confirmDeletePreset = () => {
    if (deletingPresetId) {
      removePreset(deletingPresetId);
      if (chordProgression === deletingPresetId) setChordProgression(null);
    }
    setDeletingPresetId(null);
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

  const openBuilder = (prefill?: { rootId: string; qualityId: string }) => {
    if (session.inSession && !session.paused) session.pauseToggle();
    setBuilder(prefill ?? { rootId: "mi", qualityId: "maj" });
  };

  const handleBuilderSave = (id: string, voicing: Voicing) => {
    const inPool = pool.find((c) => c.id === id) as ChordItem | undefined;
    const builtInCount = CHORDS.find((c) => c.id === id)?.voicings?.length ?? 0;
    const newIdx = inPool?.voicings?.length ?? (builtInCount + (customVoicings[id]?.length ?? 0));
    addVoicing(id, voicing);
    setPreferredVoicings((prev) => {
      const next = { ...prev, [id]: newIdx };
      savePreferredVoicings(next);
      return next;
    });
    setBuilder(null);
  };

  const handleVoicingChange = (chordId: string, idx: number) => {
    setPreferredVoicings((prev) => {
      const next = { ...prev, [chordId]: idx };
      savePreferredVoicings(next);
      return next;
    });
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
    const resolvedCurrent = session.current
      ? pool.find((c) => c.id === session.current!.id) ?? session.current
      : null;
    return (
      <SessionView
        current={resolvedCurrent}
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
        preferredVoicings={preferredVoicings}
        onVoicingChange={handleVoicingChange}
        onAddVoicing={(rootId, qualityId) => openBuilder({ rootId, qualityId })}
        showChordNotes={showChordNotes}
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
        customVoicings={customVoicings}
        onCreateChord={() => openBuilder()}
        onAddVoicing={(rootId, qualityId) => openBuilder({ rootId, qualityId })}
        onRemoveVoicing={removeVoicing}
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
        customPresets={customPresets}
        onCustomPreset={applyCustomPreset}
        onRemoveCustomPreset={handleRemoveCustomPreset}
        onSavePreset={() => setSavingPreset(true)}
        chordMode={chordMode}
        setChordMode={setChordMode}
        showChordNotes={showChordNotes}
        setShowChordNotes={setShowChordNotes}
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
      <SavePresetModal
        open={savingPreset}
        onSave={saveCurrentAsPreset}
        onCancel={() => setSavingPreset(false)}
      />
      <DeletePresetModal
        open={deletingPresetId !== null}
        presetLabel={customPresets.find((p) => p.id === deletingPresetId)?.label ?? ""}
        onConfirm={confirmDeletePreset}
        onCancel={() => setDeletingPresetId(null)}
      />
      {builder && (
        <ChordBuilderView
          prefillRootId={builder.rootId}
          prefillQualityId={builder.qualityId}
          customVoicings={customVoicings}
          onSave={handleBuilderSave}
          onCancel={() => setBuilder(null)}
        />
      )}
    </NoteNamingProvider>
  );
}
