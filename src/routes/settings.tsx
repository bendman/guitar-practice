import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import SettingsView from "../components/views/SettingsView";
import ChordBuilderView from "../components/views/ChordBuilderView";
import { useVoicings } from "../AppState";
import { useSaveVoicing } from "../hooks/useChordConfig";

const settingsSearchSchema = z.object({
  overlay: z.literal("chordBuilder").optional().catch(undefined),
  root: z.string().optional().catch(undefined),
  quality: z.string().optional().catch(undefined),
});

function SettingsScreen() {
  const { customVoicings } = useVoicings();
  const navigate = useNavigate();
  const { overlay, root, quality } = Route.useSearch();

  const openBuilder = (prefill?: { rootId: string; qualityId: string }) => {
    navigate({
      to: ".",
      search: {
        overlay: "chordBuilder",
        root: prefill?.rootId ?? "mi",
        quality: prefill?.qualityId ?? "maj",
      },
    });
  };

  const closeBuilder = () => navigate({ to: ".", search: {} });

  const handleBuilderSave = useSaveVoicing(closeBuilder);

  return (
    <>
      <SettingsView
        onBack={() => navigate({ to: "/" })}
        onCreateChord={() => openBuilder()}
        onAddVoicing={(rootId, qualityId) => openBuilder({ rootId, qualityId })}
        onShowDebug={() => navigate({ to: "/debug" })}
      />
      {overlay === "chordBuilder" && (
        <ChordBuilderView
          prefillRootId={root ?? "mi"}
          prefillQualityId={quality ?? "maj"}
          customVoicings={customVoicings}
          onSave={handleBuilderSave}
          onCancel={closeBuilder}
        />
      )}
    </>
  );
}

export const Route = createFileRoute("/settings")({
  validateSearch: settingsSearchSchema,
  component: SettingsScreen,
});
