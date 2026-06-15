import { createFileRoute, useNavigate } from "@tanstack/react-router";
import SettingsView from "../components/views/SettingsView";
import ChordBuilderView from "../components/views/ChordBuilderView";
import type { Voicing } from "../lib/constants";
import { CHORDS, mergeCustomVoicings } from "../lib/constants";
import { useVoicings } from "../AppState";

type SettingsSearch = {
  overlay?: "chordBuilder";
  root?: string;
  quality?: string;
};

function SettingsScreen() {
  const { customVoicings, addVoicing, setPreferredVoicing } = useVoicings();
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

  const handleBuilderSave = (id: string, voicing: Voicing) => {
    const pool = mergeCustomVoicings(CHORDS, customVoicings);
    const inPool = pool.find((c) => c.id === id);
    const builtInCount = CHORDS.find((c) => c.id === id)?.voicings?.length ?? 0;
    const newIdx = inPool?.voicings?.length ?? builtInCount + (customVoicings[id]?.length ?? 0);
    addVoicing(id, voicing);
    setPreferredVoicing(id, newIdx);
    closeBuilder();
  };

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
  validateSearch: (search: Record<string, unknown>): SettingsSearch => {
    const overlay = search.overlay === "chordBuilder" ? "chordBuilder" : undefined;
    if (!overlay) return {};
    return {
      overlay,
      root: typeof search.root === "string" ? search.root : undefined,
      quality: typeof search.quality === "string" ? search.quality : undefined,
    };
  },
  component: SettingsScreen,
});
