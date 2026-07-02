import { useEffect, useState } from "react";
import type { ChordItem, PracticeItem } from "../../lib/constants";
import { useFormatLabel } from "../../lib/noteNaming";
import type { NoteNaming } from "../../lib/util";
import { useTimedSession } from "../../hooks/flows/useTimedSession";
import type { SessionRawResult } from "../../hooks/flows/types";
import ChordReveal from "./ChordReveal";
import SessionChrome from "./SessionChrome";
import type { BtnSpec } from "./ControlBar";
import { resolveItem, useStartOnMount } from "./useSessionScaffold";
import s from "./session.module.css";

interface ChordAutoSessionProps {
  pool: PracticeItem[];
  weights: Record<string, number>;
  interval: number;
  tts: boolean;
  spokenNaming: NoteNaming;
  voiceURI: string | null;
  onResult: (itemId: string, correct: boolean) => void;
  onStop: (raw: SessionRawResult) => void;
  onShowLearning: () => void;
  preferredVoicings: Record<string, number>;
  onVoicingChange: (chordId: string, idx: number) => void;
  onAddVoicing: (rootId: string, qualityId: string) => void;
  showChordNotes: boolean;
}

export default function ChordAutoSession({
  pool,
  weights,
  interval,
  tts,
  spokenNaming,
  voiceURI,
  onResult,
  onStop,
  onShowLearning,
  preferredVoicings,
  onVoicingChange,
  onAddVoicing,
  showChordNotes,
}: ChordAutoSessionProps) {
  const formatLabel = useFormatLabel();
  const session = useTimedSession({
    interval,
    pool,
    weights,
    tts,
    spokenNaming,
    voiceURI,
    onResult,
  });

  useStartOnMount(session.start);

  const [revealed, setRevealed] = useState(false);
  // Reset reveal when the underlying item changes (timer auto-advanced past).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    setRevealed(false);
  }, [session.current?.id]);

  const resolved = resolveItem(pool, session.current);
  const isChord = resolved?.type === "chord";

  const showChord = () => {
    setRevealed(true);
    if (!session.paused) session.pauseToggle();
  };
  const continueSession = () => {
    setRevealed(false);
    if (session.paused) session.pauseToggle();
  };
  const stop = () => onStop(session.finish());

  const buttons: BtnSpec[] = revealed
    ? [
        {
          key: "pause",
          icon: "pause",
          label: "Pause",
          variant: "accent-line",
          onClick: session.pauseToggle,
        },
        {
          key: "continue",
          icon: "next",
          label: "Continuer",
          variant: "primary",
          onClick: continueSession,
        },
        { key: "stop", icon: "stop", label: "Arrêter", variant: "danger", onClick: stop },
      ]
    : session.paused
      ? [
          {
            key: "resume",
            icon: "play",
            label: "Reprendre",
            variant: "primary",
            onClick: session.pauseToggle,
          },
          {
            key: "next",
            icon: "next",
            label: "Suivant",
            variant: "secondary",
            onClick: session.skip,
          },
          { key: "stop", icon: "stop", label: "Arrêter", variant: "danger", onClick: stop },
        ]
      : [
          {
            key: "pause",
            icon: "pause",
            label: "Pause",
            variant: "accent-line",
            onClick: session.pauseToggle,
          },
          { key: "see", icon: "eye", label: "Voir", variant: "primary", onClick: showChord },
          { key: "stop", icon: "stop", label: "Arrêter", variant: "danger", onClick: stop },
        ];

  return (
    <SessionChrome
      practiceTime={session.practiceTime}
      count={session.count}
      progress={session.progress}
      paused={session.paused}
      interval={interval}
      onShowLearning={onShowLearning}
      buttons={buttons}
    >
      {session.paused && !revealed && <div className={s.pauseBadge}>En pause</div>}
      <div className={s.noteName}>{resolved ? formatLabel(resolved.label) : "—"}</div>
      {revealed && isChord && (
        <ChordReveal
          chord={resolved as ChordItem}
          preferredVoicings={preferredVoicings}
          onVoicingChange={onVoicingChange}
          onAddVoicing={onAddVoicing}
          showChordNotes={showChordNotes}
          resetSignal={revealed}
        />
      )}
    </SessionChrome>
  );
}
