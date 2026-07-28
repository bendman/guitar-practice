import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ChordItem, PracticeItem } from "../../lib/constants";
import { useFormatLabel } from "../../lib/noteNaming";
import type { NoteNaming } from "../../lib/util";
import { useTimedSession } from "../../hooks/flows/useTimedSession";
import { useRevealSession } from "../../hooks/flows/useRevealSession";
import type { SessionRawResult } from "../../hooks/flows/types";
import ChordReveal from "./ChordReveal";
import SessionChrome from "./SessionChrome";
import type { BtnSpec } from "./ControlBar";
import { makeSessionButtons, pausedButtons } from "./sessionButtons";
import { resolveItem, useStartOnMount } from "./useSessionScaffold";
import s from "./session.module.css";

export interface ChordSessionProps {
  /** "reveal" = manual grade flow; "auto" = timer-advanced flow. */
  variant: "auto" | "reveal";
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

type Phase = "revealed" | "paused" | "active";

/** What each variant adapter hands to the shared stage. */
interface StageState {
  current: PracticeItem | null;
  count: number;
  progress: number;
  paused: boolean;
  practiceTime: number;
  revealed: boolean;
  /** Keyed by phase so the button sets are flat data, not ternary pyramids. */
  buttons: Record<Phase, BtnSpec[]>;
  /** Passed through to ChordReveal to reset its voicing carousel. */
  resetSignal: unknown;
}

export default function ChordSession(props: ChordSessionProps) {
  // The variant is fixed for the lifetime of the route, so each branch mounts a
  // distinct adapter component and hook order is never violated.
  return props.variant === "reveal" ? <RevealAdapter {...props} /> : <AutoAdapter {...props} />;
}

/** Manual flow: the hook owns `revealed`; the user grades each chord. */
function RevealAdapter(props: ChordSessionProps) {
  const { pool, weights, interval, tts, spokenNaming, voiceURI, onResult, onStop } = props;
  const { t } = useTranslation();
  const btn = useMemo(() => makeSessionButtons(t), [t]);
  const session = useRevealSession({
    interval,
    pool,
    weights,
    tts,
    spokenNaming,
    voiceURI,
    onResult,
  });
  useStartOnMount(session.start);
  const stop = () => onStop(session.finish());

  return (
    <ChordStage
      {...props}
      stage={{
        current: session.current,
        count: session.count,
        progress: session.progress,
        paused: session.paused,
        practiceTime: session.practiceTime,
        revealed: session.revealed,
        resetSignal: session.current?.id,
        buttons: {
          revealed: [
            btn.miss(() => session.grade(false)),
            btn.hit(() => session.grade(true)),
            btn.stop(stop),
          ],
          paused: pausedButtons(btn, session.pauseToggle, session.skip, stop),
          active: [btn.pause(session.pauseToggle), btn.see(session.reveal), btn.stop(stop)],
        },
      }}
    />
  );
}

/** Timer-advanced flow: reveal is local UI state that pauses the timer. */
function AutoAdapter(props: ChordSessionProps) {
  const { pool, interval, tts, spokenNaming, voiceURI, onStop } = props;
  const { t } = useTranslation();
  const btn = useMemo(() => makeSessionButtons(t), [t]);
  // An ungraded carousel: nothing is scored here, so it neither reads progress
  // weights (omitting them makes the draw uniform over the whole selection) nor
  // reports results back into them.
  const session = useTimedSession({
    interval,
    pool,
    tts,
    spokenNaming,
    voiceURI,
  });
  useStartOnMount(session.start);
  const stop = () => onStop(session.finish());

  const [revealed, setRevealed] = useState(false);
  // Reset reveal when the underlying item changes (timer auto-advanced past).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    setRevealed(false);
  }, [session.current?.id]);

  const showChord = () => {
    setRevealed(true);
    if (!session.paused) session.pauseToggle();
  };
  const continueSession = () => {
    setRevealed(false);
    if (session.paused) session.pauseToggle();
  };

  return (
    <ChordStage
      {...props}
      stage={{
        current: session.current,
        count: session.count,
        progress: session.progress,
        paused: session.paused,
        practiceTime: session.practiceTime,
        revealed,
        resetSignal: revealed,
        buttons: {
          revealed: [btn.pause(session.pauseToggle), btn.continue(continueSession), btn.stop(stop)],
          paused: pausedButtons(btn, session.pauseToggle, session.skip, stop),
          active: [btn.pause(session.pauseToggle), btn.see(showChord), btn.stop(stop)],
        },
      }}
    />
  );
}

function ChordStage({
  stage,
  pool,
  interval,
  onShowLearning,
  preferredVoicings,
  onVoicingChange,
  onAddVoicing,
  showChordNotes,
}: ChordSessionProps & { stage: StageState }) {
  const { t } = useTranslation();
  const formatLabel = useFormatLabel();
  const resolved = resolveItem(pool, stage.current);
  const isChord = resolved?.type === "chord";

  const phase: Phase = stage.revealed ? "revealed" : stage.paused ? "paused" : "active";

  return (
    <SessionChrome
      practiceTime={stage.practiceTime}
      count={stage.count}
      progress={stage.progress}
      paused={stage.paused}
      interval={interval}
      onShowLearning={onShowLearning}
      buttons={stage.buttons[phase]}
    >
      {phase === "paused" && <div className={s.pauseBadge}>{t("session.paused")}</div>}
      <div className={s.noteName}>{resolved ? formatLabel(resolved.label) : "—"}</div>
      {stage.revealed && isChord && (
        <ChordReveal
          chord={resolved as ChordItem}
          preferredVoicings={preferredVoicings}
          onVoicingChange={onVoicingChange}
          onAddVoicing={onAddVoicing}
          showChordNotes={showChordNotes}
          resetSignal={stage.resetSignal}
        />
      )}
    </SessionChrome>
  );
}
