import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import SettingsView from "../components/views/SettingsView";
import DebugView from "../components/views/DebugView";
import ChordBuilderView from "../components/views/ChordBuilderView";
import type { Voicing } from "../lib/constants";
import { CHORDS, mergeCustomVoicings } from "../lib/constants";
import { useAppState } from "../AppState";

function SettingsScreen() {
  const {
    weights, resetAllWeights,
    workingSetSize, setWorkingSetSize,
    noteNaming, setNoteNaming,
    spokenNaming, setSpokenNaming,
    voiceURI, setVoiceURI,
    customVoicings, addVoicing, removeVoicing,
    preferredVoicings, setPreferredVoicing,
  } = useAppState();
  const navigate = useNavigate();

  const [builder, setBuilder] = useState<{ rootId: string; qualityId: string } | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  if (showDebug) return <DebugView onBack={() => setShowDebug(false)} />;

  const openBuilder = (prefill?: { rootId: string; qualityId: string }) => {
    setBuilder(prefill ?? { rootId: "mi", qualityId: "maj" });
  };

  const handleBuilderSave = (id: string, voicing: Voicing) => {
    const pool = mergeCustomVoicings(CHORDS, customVoicings);
    const inPool = pool.find((c) => c.id === id);
    const builtInCount = CHORDS.find((c) => c.id === id)?.voicings?.length ?? 0;
    const newIdx = inPool?.voicings?.length ?? (builtInCount + (customVoicings[id]?.length ?? 0));
    addVoicing(id, voicing);
    setPreferredVoicing(id, newIdx);
    setBuilder(null);
  };

  return (
    <>
      <SettingsView
        weights={weights}
        onBack={() => navigate({ to: "/" })}
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
        preferredVoicings={preferredVoicings}
        onVoicingChange={setPreferredVoicing}
        onCreateChord={() => openBuilder()}
        onAddVoicing={(rootId, qualityId) => openBuilder({ rootId, qualityId })}
        onRemoveVoicing={removeVoicing}
        onShowDebug={() => setShowDebug(true)}
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

export const Route = createFileRoute("/settings")({ component: SettingsScreen });
