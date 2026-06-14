import { useEffect } from "react";
import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useAppState } from "../AppState";
import { ALL, CHORDS, mergeCustomVoicings } from "../lib/constants";
import type { ChordItem, Voicing } from "../lib/constants";
import { buildActivePool } from "../lib/util";
import { summarizeSession } from "../lib/summarizeSession";
import type { SessionRawResult } from "../hooks/flows/types";
import { useIntervalHotkeys } from "../hooks/useIntervalHotkeys";
import NoteSession from "../components/sessions/NoteSession";
import ChordAutoSession from "../components/sessions/ChordAutoSession";
import ChordRevealSession from "../components/sessions/ChordRevealSession";
import QuizSession from "../components/sessions/QuizSession";
import LearningView from "../components/views/LearningView";
import ChordBuilderView from "../components/views/ChordBuilderView";

type SessionMode = "notes" | "chords";
type SessionFlow = "timed" | "reveal" | "quiz";
type SessionOverlay = "chordBuilder" | "learning";
type SessionSearch = {
  flow: SessionFlow;
  overlay?: SessionOverlay;
  root?: string;
  quality?: string;
};

function SessionScreen() {
  const { mode } = Route.useParams();
  const { flow, overlay, root, quality } = Route.useSearch();
  const navigate = useNavigate();
  const {
    intervalSecs, setIntervalSecs,
    tts, listening, spokenNaming, voiceURI,
    showChordNotes,
    stats, weights, confusions,
    recordResult, recordConfusion, commitSession,
    customVoicings, addVoicing,
    enabled, workingSetSize,
    preferredVoicings, setPreferredVoicing,
    capturePreSession, setLastSummary,
    chordMode,
  } = useAppState();

  useEffect(() => {
    capturePreSession(stats, weights);
    // capture once at mount; subsequent state updates shouldn't overwrite
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useIntervalHotkeys(true, setIntervalSecs);

  const targetType = mode === "chords" ? "chord" : "note";
  const basePool = ALL.filter((item) => enabled[item.id] && item.type === targetType);
  const pool = targetType === "chord"
    ? mergeCustomVoicings(basePool as ChordItem[], customVoicings)
    : basePool;
  const activePool = buildActivePool(pool, weights, workingSetSize);

  const closeOverlay = () => navigate({ to: ".", params: { mode }, search: { flow } });
  const openBuilder = (rootId: string, qualityId: string) =>
    navigate({
      to: ".",
      params: { mode },
      search: { flow, overlay: "chordBuilder", root: rootId, quality: qualityId },
    });
  const openLearning = () =>
    navigate({ to: ".", params: { mode }, search: { flow, overlay: "learning" } });

  const handleSessionStop = (raw: SessionRawResult) => {
    const summary = summarizeSession({
      ...raw,
      wasListening: mode === "notes" && listening,
      wasManualChord: mode === "chords" && (chordMode === "manual" || chordMode === "quiz"),
    });
    commitSession(summary);
    setLastSummary(summary, mode);
    navigate({ to: "/summary" });
  };

  const handleBuilderSave = (id: string, voicing: Voicing) => {
    const inPool = pool.find((c) => c.id === id) as ChordItem | undefined;
    const builtInCount = CHORDS.find((c) => c.id === id)?.voicings?.length ?? 0;
    const newIdx = inPool?.voicings?.length ?? (builtInCount + (customVoicings[id]?.length ?? 0));
    addVoicing(id, voicing);
    setPreferredVoicing(id, newIdx);
    closeOverlay();
  };

  if (overlay === "learning") {
    return (
      <LearningView
        pool={pool}
        activePool={activePool}
        weights={weights}
        workingSetSize={workingSetSize}
        onBack={closeOverlay}
      />
    );
  }

  const renderFlow = () => {
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
          onShowLearning={openLearning}
        />
      );
    }
    if (flow === "quiz") {
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
          onShowLearning={openLearning}
          preferredVoicings={preferredVoicings}
          showChordNotes={showChordNotes}
        />
      );
    }
    const ChordFlow = flow === "reveal" ? ChordRevealSession : ChordAutoSession;
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
        onShowLearning={openLearning}
        preferredVoicings={preferredVoicings}
        onVoicingChange={setPreferredVoicing}
        onAddVoicing={openBuilder}
        showChordNotes={showChordNotes}
      />
    );
  };

  return (
    <>
      {renderFlow()}
      {overlay === "chordBuilder" && (
        <ChordBuilderView
          prefillRootId={root ?? "mi"}
          prefillQualityId={quality ?? "maj"}
          customVoicings={customVoicings}
          onSave={handleBuilderSave}
          onCancel={closeOverlay}
        />
      )}
    </>
  );
}

export const Route = createFileRoute("/session/$mode")({
  parseParams: (params): { mode: SessionMode } => {
    if (params.mode !== "notes" && params.mode !== "chords") {
      throw redirect({ to: "/" });
    }
    return { mode: params.mode };
  },
  validateSearch: (search: Record<string, unknown>): SessionSearch => {
    const rawFlow = search.flow;
    const flow: SessionFlow = rawFlow === "timed" || rawFlow === "reveal" || rawFlow === "quiz"
      ? rawFlow
      : "timed";
    const overlay = search.overlay === "chordBuilder" || search.overlay === "learning"
      ? (search.overlay as SessionOverlay)
      : undefined;
    if (!overlay) return { flow };
    if (overlay === "learning") return { flow, overlay };
    return {
      flow,
      overlay,
      root: typeof search.root === "string" ? search.root : undefined,
      quality: typeof search.quality === "string" ? search.quality : undefined,
    };
  },
  component: SessionScreen,
});
