import { useState } from "react";
import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import ConfigView from "../components/views/ConfigView";
import SavePresetModal from "../components/ui/SavePresetModal";
import DeletePresetModal from "../components/ui/DeletePresetModal";
import { useAppState } from "../AppState";
import {
  ALL, CHORDS, CHORD_PRESETS, CHORD_PROGRESSIONS, mergeCustomVoicings,
} from "../lib/constants";
import type { ChordItem } from "../lib/constants";
import { buildActivePool } from "../lib/util";

type ConfigMode = "notes" | "chords";

function flowForMode(mode: ConfigMode, chordMode: string): "timed" | "reveal" | "quiz" {
  if (mode === "notes") return "timed";
  if (chordMode === "quiz") return "quiz";
  if (chordMode === "manual") return "reveal";
  return "timed";
}

function ConfigScreen() {
  const { mode } = Route.useParams();
  const navigate = useNavigate();
  const {
    intervalSecs, setIntervalSecs,
    enabled, setEnabled,
    tts, setTts,
    listening, setListening,
    chordMode, setChordMode,
    workingSetSize,
    showChordNotes, setShowChordNotes,
    weights,
    customVoicings,
    customPresets, addPreset, removePreset,
    chordPreset, setChordPreset,
    chordProgression, setChordProgression,
  } = useAppState();

  const [savingPreset, setSavingPreset] = useState(false);
  const [deletingPresetId, setDeletingPresetId] = useState<string | null>(null);

  const targetType = mode === "chords" ? "chord" : "note";
  const basePool = ALL.filter((item) => enabled[item.id] && item.type === targetType);
  const pool = targetType === "chord"
    ? mergeCustomVoicings(basePool as ChordItem[], customVoicings)
    : basePool;
  const activePool = buildActivePool(pool, weights, workingSetSize);

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

  const confirmDeletePreset = () => {
    if (deletingPresetId) {
      removePreset(deletingPresetId);
      if (chordProgression === deletingPresetId) setChordProgression(null);
    }
    setDeletingPresetId(null);
  };

  const startSession = () => {
    navigate({
      to: "/session/$mode",
      params: { mode },
      search: { flow: flowForMode(mode, chordMode) },
    });
  };

  return (
    <>
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
        onRemoveCustomPreset={(id) => setDeletingPresetId(id)}
        onSavePreset={() => setSavingPreset(true)}
        chordMode={chordMode}
        setChordMode={setChordMode}
        showChordNotes={showChordNotes}
        setShowChordNotes={setShowChordNotes}
        weights={weights}
        onStart={startSession}
        onBack={() => navigate({ to: "/" })}
      />
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
    </>
  );
}

export const Route = createFileRoute("/config/$mode")({
  parseParams: (params): { mode: ConfigMode } => {
    if (params.mode !== "notes" && params.mode !== "chords") {
      throw redirect({ to: "/" });
    }
    return { mode: params.mode };
  },
  component: ConfigScreen,
});
