import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { z } from "zod";
import ConfigView from "../components/views/ConfigView";
import SavePresetModal from "../components/ui/SavePresetModal";
import DeletePresetModal from "../components/ui/DeletePresetModal";
import { useSettings, useVoicings, useSessionHandoff } from "../AppState";
import { useChordConfig } from "../hooks/useChordConfig";
import { flowForMode } from "../hooks/flows/types";
import type { SessionMode } from "../hooks/flows/types";

const configSearchSchema = z.object({
  overlay: z.enum(["savePreset", "deletePreset"]).optional().catch(undefined),
  preset: z.string().optional().catch(undefined),
});

function ConfigScreen() {
  const { mode } = Route.useParams();
  const { overlay, preset } = Route.useSearch();
  const navigate = useNavigate();
  const { enabled, chordMode } = useSettings();
  const { customPresets, removePreset } = useVoicings();
  const { chordProgression, setChordProgression } = useSessionHandoff();
  const { saveCurrentAsPreset } = useChordConfig();

  const closeOverlay = () => navigate({ to: ".", params: { mode }, search: {} });
  const openSavePreset = () =>
    navigate({ to: ".", params: { mode }, search: { overlay: "savePreset" } });
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
  parseParams: (params): { mode: SessionMode } => {
    if (params.mode !== "notes" && params.mode !== "chords") {
      throw redirect({ to: "/" });
    }
    return { mode: params.mode };
  },
  validateSearch: configSearchSchema,
  component: ConfigScreen,
});
