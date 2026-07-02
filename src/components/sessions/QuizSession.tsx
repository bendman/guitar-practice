import type { PracticeItem } from "../../lib/constants";
import { useFormatLabel } from "../../lib/noteNaming";
import type { NoteNaming } from "../../lib/util";
import type { Confusions } from "../../lib/stats";
import { useQuizSession } from "../../hooks/flows/useQuizSession";
import type { SessionRawResult } from "../../hooks/flows/types";
import QuizGrid from "./QuizGrid";
import SessionChrome from "./SessionChrome";
import type { BtnSpec } from "./ControlBar";
import { useStartOnMount } from "./useSessionScaffold";
import s from "./session.module.css";

interface QuizSessionProps {
  pool: PracticeItem[];
  fullPool: PracticeItem[];
  weights: Record<string, number>;
  confusions: Confusions;
  tts: boolean;
  spokenNaming: NoteNaming;
  voiceURI: string | null;
  onResult: (itemId: string, correct: boolean) => void;
  onConfusion: (correctId: string, chosenWrongId: string) => void;
  onStop: (raw: SessionRawResult) => void;
  onShowLearning: () => void;
  preferredVoicings: Record<string, number>;
  showChordNotes: boolean;
}

export default function QuizSession({
  pool,
  fullPool,
  weights,
  confusions,
  tts,
  spokenNaming,
  voiceURI,
  onResult,
  onConfusion,
  onStop,
  onShowLearning,
  preferredVoicings,
  showChordNotes,
}: QuizSessionProps) {
  const formatLabel = useFormatLabel();
  const session = useQuizSession({
    pool,
    fullPool,
    weights,
    confusions,
    tts,
    spokenNaming,
    voiceURI,
    onResult,
    onConfusion,
  });

  useStartOnMount(session.start);

  const stop = () => onStop(session.finish());

  const buttons: BtnSpec[] = [
    {
      key: "pause",
      icon: session.paused ? "play" : "pause",
      label: session.paused ? "Reprendre" : "Pause",
      variant: session.paused ? "primary" : "accent-line",
      onClick: session.pauseToggle,
    },
    {
      key: "next",
      icon: "next",
      label: "Suivant",
      variant: "primary",
      onClick: session.next,
      disabled: session.selectedId == null,
    },
    { key: "stop", icon: "stop", label: "Arrêter", variant: "danger", onClick: stop },
  ];

  return (
    <SessionChrome
      practiceTime={session.practiceTime}
      count={session.count}
      paused={session.paused}
      onShowLearning={onShowLearning}
      buttons={buttons}
    >
      <div className={s.noteName}>{session.current ? formatLabel(session.current.label) : "—"}</div>
      <QuizGrid
        choices={session.choices}
        correctId={session.correctId}
        selectedId={session.selectedId}
        preferredVoicings={preferredVoicings}
        showChordNotes={showChordNotes}
        onSelect={session.select}
      />
    </SessionChrome>
  );
}
