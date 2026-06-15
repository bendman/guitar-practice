import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import ConfigView from "../components/views/ConfigView";
import SavePresetModal from "../components/ui/SavePresetModal";
import DeletePresetModal from "../components/ui/DeletePresetModal";
import { useSettings, useVoicings, useSessionHandoff } from "../AppState";
import { useChordConfig } from "../hooks/useChordConfig";

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
  const { enabled, chordMode } = useSettings();
  const { customPresets, removePreset } = useVoicings();
  const { chordProgression, setChordProgression } = useSessionHandoff();
  const { saveCurrentAsPreset } = useChordConfig();

  const closeOverlay = () => navigate({ to: ".", params: { mode }, search: {} });
  const openSavePreset = () => navigate({ to: ".", params: { mode }, search: { overlay: "savePreset" } });
  const openDeletePreset = (id: string) =>
    navigate({ to: ".", params: { mode }, search: { overlay: "deletePreset", preset: id } });

  const handleSavePreset = (name: string) => {
    saveCurrentAsPreset(name, enabled);
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
        onRemoveCustomPreset={openDeletePreset}
        onSavePreset={openSavePreset}
        onStart={startSession}
        onBack={() => navigate({ to: "/" })}
      />
      <SavePresetModal
        open={overlay === "savePreset"}
        onSave={handleSavePreset}
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
