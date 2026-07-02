import { useEffect } from "react";
import type { NoteNaming } from "../../lib/util";
import type { PracticeItem } from "../../lib/constants";
import { useTimedSession } from "../../hooks/flows/useTimedSession";
import { usePitchDetection } from "../../hooks/usePitchDetection";
import type { SessionRawResult } from "../../hooks/flows/types";
import NoteDisplay from "./NoteDisplay";
import SessionChrome from "./SessionChrome";
import type { BtnSpec } from "./ControlBar";
import { btn, pausedButtons } from "./sessionButtons";
import { useStartOnMount } from "./useSessionScaffold";

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

  useStartOnMount(session.start);

  const detectedNote = usePitchDetection(session.micActive, session.count);
  useEffect(() => {
    session.onDetectedNote(detectedNote);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detectedNote]);

  const stop = () => onStop(session.finish());

  const recognized = listening && session.hitStatus === "correct" && !session.paused;

  const buttons: BtnSpec[] = session.paused
    ? pausedButtons(session.pauseToggle, session.skip, stop)
    : [
        btn.pause(session.pauseToggle),
        ...(listening && !recognized ? [btn.accept(session.forceAccept)] : []),
        btn.stop(stop),
      ];

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
