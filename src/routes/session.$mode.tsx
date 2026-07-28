import { useEffect } from "react";
import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { useSettings, useProgress, useVoicings, useSessionHandoff } from "../AppState";
import { usePracticePool, useSaveVoicing } from "../hooks/useChordConfig";
import { summarizeSession } from "../lib/summarizeSession";
import type { SessionMode, SessionRawResult } from "../hooks/flows/types";
import { useIntervalHotkeys } from "../hooks/useIntervalHotkeys";
import NoteSession from "../components/sessions/NoteSession";
import ChordSession from "../components/sessions/ChordSession";
import QuizSession from "../components/sessions/QuizSession";
import LearningView from "../components/views/LearningView";
import ChordBuilderView from "../components/views/ChordBuilderView";

const sessionSearchSchema = z.object({
  flow: z.enum(["timed", "reveal", "quiz"]).catch("timed"),
  overlay: z.enum(["chordBuilder", "learning"]).optional().catch(undefined),
  root: z.string().optional().catch(undefined),
  quality: z.string().optional().catch(undefined),
});

function SessionScreen() {
  const { mode } = Route.useParams();
  const { flow, overlay, root, quality } = Route.useSearch();
  const navigate = useNavigate();
  const {
    intervalSecs,
    setIntervalSecs,
    tts,
    listening,
    spokenNaming,
    voiceURI,
    showChordNotes,
    chordMode,
  } = useSettings();
  const { stats, weights, confusions, recordResult, setLevel, recordConfusion, commitSession } =
    useProgress();
  const { customVoicings, preferredVoicings, setPreferredVoicing } = useVoicings();
  const { capturePreSession, setLastSummary } = useSessionHandoff();

  useEffect(() => {
    capturePreSession(stats, weights);
    // capture once at mount; subsequent state updates shouldn't overwrite
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useIntervalHotkeys(true, setIntervalSecs);

  const { pool, activePool } = usePracticePool(mode, flow);

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
      // The pool the flows actually drew from, so the summary can report the
      // items that never came up as well as the ones that did.
      poolItems: activePool,
    });
    commitSession(summary);
    setLastSummary(summary, mode);
    navigate({ to: "/summary" });
  };

  const handleBuilderSave = useSaveVoicing(closeOverlay);

  if (overlay === "learning") {
    return <LearningView mode={mode} onBack={closeOverlay} />;
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
          onSetLevel={setLevel}
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
    return (
      <ChordSession
        variant={flow === "reveal" ? "reveal" : "auto"}
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
  validateSearch: sessionSearchSchema,
  component: SessionScreen,
});
