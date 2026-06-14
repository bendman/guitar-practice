import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Route as PracticeRoute } from "./routes/practice";
import { ALL, CHORDS, CHORD_PRESETS, CHORD_PROGRESSIONS, mergeCustomVoicings } from "./lib/constants";
import type { ChordItem, Voicing } from "./lib/constants";
import { useIntervalHotkeys } from "./hooks/useIntervalHotkeys";
import { buildActivePool } from "./lib/util";
import { summarizeSession } from "./lib/summarizeSession";
import type { Stats, SessionSummary, Weights } from "./lib/stats";
import type { SessionRawResult } from "./hooks/flows/types";
import ConfigView from "./components/views/ConfigView";
import SummaryView from "./components/views/SummaryView";
import LearningView from "./components/views/LearningView";
import ChordBuilderView from "./components/views/ChordBuilderView";
import NoteSession from "./components/sessions/NoteSession";
import ChordAutoSession from "./components/sessions/ChordAutoSession";
import ChordRevealSession from "./components/sessions/ChordRevealSession";
import QuizSession from "./components/sessions/QuizSession";
import SavePresetModal from "./components/ui/SavePresetModal";
import DeletePresetModal from "./components/ui/DeletePresetModal";
import { useAppState } from "./AppState";

export default function GuitarPractice() {
  const {
    intervalSecs, setIntervalSecs,
    enabled, setEnabled,
    tts, setTts,
    listening, setListening,
    chordMode, setChordMode,
    workingSetSize,
    spokenNaming,
    voiceURI,
    showChordNotes, setShowChordNotes,
    stats, weights, confusions,
    recordResult, recordConfusion, commitSession,
    customVoicings, addVoicing,
    customPresets, addPreset, removePreset,
    preferredVoicings, setPreferredVoicing,
  } = useAppState();

  const navigate = useNavigate();
  const { mode: searchMode } = PracticeRoute.useSearch();

  const [builder, setBuilder] = useState<{ rootId: string; qualityId: string } | null>(null);
  const [savingPreset, setSavingPreset] = useState(false);
  const [deletingPresetId, setDeletingPresetId] = useState<string | null>(null);
  const [chordPreset, setChordPreset] = useState<string | null>(null);
  const [chordProgression, setChordProgression] = useState<string | null>(null);
  const [showLearning, setShowLearning] = useState(false);
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);
  const [mode, setMode] = useState<"notes" | "chords" | null>(searchMode ?? null);
  const [sessionActive, setSessionActive] = useState(false);
  const [preSessionStats, setPreSessionStats] = useState<Stats | null>(null);
  const [preSessionWeights, setPreSessionWeights] = useState<Weights>({});

  useEffect(() => {
    if (searchMode && searchMode !== mode) setMode(searchMode);
  }, [searchMode, mode]);

  useEffect(() => {
    if (!mode && !sessionActive && !sessionSummary) {
      navigate({ to: "/" });
    }
  }, [mode, sessionActive, sessionSummary, navigate]);

  const targetType = mode === "chords" ? "chord" : "note";
  const basePool = ALL.filter((item) => enabled[item.id] && item.type === targetType);
  const pool = targetType === "chord"
    ? mergeCustomVoicings(basePool as ChordItem[], customVoicings)
    : basePool;
  const activePool = buildActivePool(pool, weights, workingSetSize);

  useIntervalHotkeys(sessionActive, setIntervalSecs);

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

  const handleSessionStop = (raw: SessionRawResult) => {
    const summary = summarizeSession({
      ...raw,
      wasListening: mode === "notes" && listening,
      wasManualChord: mode === "chords" && (chordMode === "manual" || chordMode === "quiz"),
    });
    setSessionSummary(summary);
    commitSession(summary);
    setSessionActive(false);
  };

  const openBuilder = (prefill?: { rootId: string; qualityId: string }) => {
    setBuilder(prefill ?? { rootId: "mi", qualityId: "maj" });
  };

  const handleBuilderSave = (id: string, voicing: Voicing) => {
    const inPool = pool.find((c) => c.id === id) as ChordItem | undefined;
    const builtInCount = CHORDS.find((c) => c.id === id)?.voicings?.length ?? 0;
    const newIdx = inPool?.voicings?.length ?? (builtInCount + (customVoicings[id]?.length ?? 0));
    addVoicing(id, voicing);
    setPreferredVoicing(id, newIdx);
    setBuilder(null);
  };

  const goWelcome = () => {
    setSessionSummary(null);
    setMode(null);
    navigate({ to: "/" });
  };

  const startSession = () => {
    setPreSessionStats(stats);
    setPreSessionWeights(weights);
    setSessionActive(true);
  };

  const handleReplay = () => {
    setSessionSummary(null);
  };

  const renderSession = () => {
    const onShowLearning = () => setShowLearning(true);
    if (mode === "notes") {
      return (
        <NoteSession
          pool={activePool}
          weights={weights}
          interval={intervalSecs}
          listening={listening}
          tts={tts}
          spokenNaming={spokenNaming}
          voiceURI={voiceURI}
          onResult={recordResult}
          onStop={handleSessionStop}
          onShowLearning={onShowLearning}
        />
      );
    }
    if (chordMode === "quiz") {
      return (
        <QuizSession
          pool={activePool}
          fullPool={pool}
          weights={weights}
          confusions={confusions}
          tts={tts}
          spokenNaming={spokenNaming}
          voiceURI={voiceURI}
          onResult={recordResult}
          onConfusion={recordConfusion}
          onStop={handleSessionStop}
          onShowLearning={onShowLearning}
          preferredVoicings={preferredVoicings}
          showChordNotes={showChordNotes}
        />
      );
    }
    const ChordFlow = chordMode === "auto" ? ChordAutoSession : ChordRevealSession;
    return (
      <ChordFlow
        pool={activePool}
        weights={weights}
        interval={intervalSecs}
        tts={tts}
        spokenNaming={spokenNaming}
        voiceURI={voiceURI}
        onResult={recordResult}
        onStop={handleSessionStop}
        onShowLearning={onShowLearning}
        preferredVoicings={preferredVoicings}
        onVoicingChange={setPreferredVoicing}
        onAddVoicing={(rootId, qualityId) => openBuilder({ rootId, qualityId })}
        showChordNotes={showChordNotes}
      />
    );
  };

  const renderContent = () => {
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

    if (sessionActive) return renderSession();

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

    if (!mode) return null;

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
      />
    );
  };

  return (
    <>
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
    </>
  );
}
