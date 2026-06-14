import { useEffect, useRef } from "react";
import type { NoteNaming } from "../../lib/util";
import type { PracticeItem } from "../../lib/constants";
import { useTimedSession } from "../../hooks/flows/useTimedSession";
import { usePitchDetection } from "../../hooks/usePitchDetection";
import type { SessionRawResult } from "../../hooks/flows/types";
import NoteDisplay from "./NoteDisplay";
import SessionChrome from "./SessionChrome";
import type { BtnSpec } from "./ControlBar";

interface NoteSessionProps {
  pool: PracticeItem[];
  weights: Record<string, number>;
  interval: number;
  listening: boolean;
  tts: boolean;
  spokenNaming: NoteNaming;
  voiceURI: string | null;
  onResult: (itemId: string, correct: boolean) => void;
  onStop: (raw: SessionRawResult) => void;
  onShowLearning: () => void;
}

export default function NoteSession({
  pool,
  weights,
  interval,
  listening,
  tts,
  spokenNaming,
  voiceURI,
  onResult,
  onStop,
  onShowLearning,
}: NoteSessionProps) {
  const session = useTimedSession({
    interval,
    pool,
    listening,
    weights,
    tts,
    spokenNaming,
    voiceURI,
    onResult,
  });

  // Drive the session through one full lifecycle: start on mount, do nothing on
  // re-render, never auto-stop on unmount (the user's Arrêter handles that).
  const startedRef = useRef(false);
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    session.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const detectedNote = usePitchDetection(session.micActive, session.count);
  useEffect(() => {
    session.onDetectedNote(detectedNote);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detectedNote]);

  const stop = () => onStop(session.finish());

  const recognized = listening && session.hitStatus === "correct" && !session.paused;

  const buttons: BtnSpec[] = (() => {
    if (session.paused) {
      return [
        { key: "resume", icon: "play", label: "Reprendre", variant: "primary", onClick: session.pauseToggle },
        { key: "next", icon: "next", label: "Suivant", variant: "secondary", onClick: session.skip },
        { key: "stop", icon: "stop", label: "Arrêter", variant: "danger", onClick: stop },
      ];
    }
    const out: BtnSpec[] = [
      { key: "pause", icon: "pause", label: "Pause", variant: "accent-line", onClick: session.pauseToggle },
    ];
    if (listening && !recognized) {
      out.push({ key: "accept", icon: "check", label: "Accepter", variant: "primary", onClick: session.forceAccept });
    }
    out.push({ key: "stop", icon: "stop", label: "Arrêter", variant: "danger", onClick: stop });
    return out;
  })();

  return (
    <SessionChrome
      practiceTime={session.practiceTime}
      count={session.count}
      streak={session.streak}
      showStreak={listening}
      progress={session.progress}
      paused={session.paused}
      recognized={recognized}
      interval={interval}
      onShowLearning={onShowLearning}
      buttons={buttons}
    >
      <NoteDisplay
        current={session.current}
        showPauseBadge={session.paused}
        recognized={recognized}
        showListenHint={listening && !recognized && !session.paused}
        detectedNote={detectedNote}
      />
    </SessionChrome>
  );
}
