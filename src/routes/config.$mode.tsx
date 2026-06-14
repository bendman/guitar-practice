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

type ConfigSearch = {
  overlay?: "savePreset" | "deletePreset";
  preset?: string;
};

function flowForMode(mode: ConfigMode, chordMode: string): "timed" | "reveal" | "quiz" {
  if (mode === "notes") return "timed";
  if (chordMode === "quiz") return "quiz";
  if (chordMode === "manual") return "reveal";
  return "timed";
}

function ConfigScreen() {
  const { mode } = Route.useParams();
  const { overlay, preset } = Route.useSearch();
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

  const targetType = mode === "chords" ? "chord" : "note";
  const basePool = ALL.filter((item) => enabled[item.id] && item.type === targetType);
  const pool = targetType === "chord"
    ? mergeCustomVoicings(basePool as ChordItem[], customVoicings)
    : basePool;
  const activePool = buildActivePool(pool, weights, workingSetSize);

  const closeOverlay = () => navigate({ to: ".", params: { mode }, search: {} });
  const openSavePreset = () => navigate({ to: ".", params: { mode }, search: { overlay: "savePreset" } });
  const openDeletePreset = (id: string) =>
    navigate({ to: ".", params: { mode }, search: { overlay: "deletePreset", preset: id } });

  const setEnabledManual = (next: (prev: Record<string, boolean>) => Record<string, boolean>) => {
    setEnabled(next);
    setChordPreset(null);
    setChordProgression(null);
  };

  const applyPreset = (presetId: string) => {
    const builtIn = CHORD_PRESETS.find((p) => p.id === presetId);
    if (!builtIn) return;
    setEnabled((prev) => {
      const next = { ...prev };
      for (const chord of CHORDS) {
        next[chord.id] = builtIn.qualityIds === null || builtIn.qualityIds.includes(chord.qualityId);
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
    const custom = customPresets.find((p) => p.id === presetId);
    if (custom) applyChordCollection(custom.chordIds, presetId);
  };

  const saveCurrentAsPreset = (name: string) => {
    const chordIds = CHORDS.filter((c) => enabled[c.id]).map((c) => c.id);
    addPreset(name, chordIds);
    closeOverlay();
  };

  const confirmDeletePreset = () => {
    if (preset) {
      removePreset(preset);
      if (chordProgression === preset) setChordProgression(null);
    }
    closeOverlay();
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
        onRemoveCustomPreset={openDeletePreset}
        onSavePreset={openSavePreset}
        chordMode={chordMode}
        setChordMode={setChordMode}
        showChordNotes={showChordNotes}
        setShowChordNotes={setShowChordNotes}
        weights={weights}
        onStart={startSession}
        onBack={() => navigate({ to: "/" })}
      />
      <SavePresetModal
        open={overlay === "savePreset"}
        onSave={saveCurrentAsPreset}
        onCancel={closeOverlay}
      />
      <DeletePresetModal
        open={overlay === "deletePreset"}
        presetLabel={customPresets.find((p) => p.id === preset)?.label ?? ""}
        onConfirm={confirmDeletePreset}
        onCancel={closeOverlay}
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
  validateSearch: (search: Record<string, unknown>): ConfigSearch => {
    const overlay = search.overlay;
    if (overlay === "savePreset") return { overlay };
    if (overlay === "deletePreset") {
      return {
        overlay,
        preset: typeof search.preset === "string" ? search.preset : undefined,
      };
    }
    return {};
  },
  component: ConfigScreen,
});
