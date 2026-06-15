import { useEffect, useRef } from "react";
import type { ChordItem, PracticeItem } from "../../lib/constants";
import { useFormatLabel } from "../../lib/noteNaming";
import type { NoteNaming } from "../../lib/util";
import { useRevealSession } from "../../hooks/flows/useRevealSession";
import type { SessionRawResult } from "../../hooks/flows/types";
import ChordReveal from "./ChordReveal";
import SessionChrome from "./SessionChrome";
import type { BtnSpec } from "./ControlBar";
import s from "./session.module.css";

interface ChordRevealSessionProps {
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

export default function ChordRevealSession({
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
}: ChordRevealSessionProps) {
  const formatLabel = useFormatLabel();
  const session = useRevealSession({
    interval,
    pool,
    weights,
    tts,
    spokenNaming,
    voiceURI,
    onResult,
  });

  const startedRef = useRef(false);
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    session.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resolved = session.current
    ? (pool.find((c) => c.id === session.current!.id) ?? session.current)
    : null;
  const isChord = resolved?.type === "chord";

  const stop = () => onStop(session.finish());

  const buttons: BtnSpec[] = session.revealed
    ? [
        {
          key: "miss",
          icon: "x",
          label: "Raté",
          variant: "danger-line",
          onClick: () => session.grade(false),
        },
        {
          key: "hit",
          icon: "check",
          label: "Trouvé",
          variant: "primary",
          onClick: () => session.grade(true),
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
          { key: "see", icon: "eye", label: "Voir", variant: "primary", onClick: session.reveal },
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
      {session.paused && !session.revealed && <div className={s.pauseBadge}>En pause</div>}
      <div className={s.noteName}>{resolved ? formatLabel(resolved.label) : "—"}</div>
      {session.revealed && isChord && (
        <ChordReveal
          chord={resolved as ChordItem}
          preferredVoicings={preferredVoicings}
          onVoicingChange={onVoicingChange}
          onAddVoicing={onAddVoicing}
          showChordNotes={showChordNotes}
          resetSignal={session.current?.id}
        />
      )}
    </SessionChrome>
  );
}
