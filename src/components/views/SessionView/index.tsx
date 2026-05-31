import { useEffect, useState } from "react";
import { NOTES, CHROMATIC_SHARPS } from "../../../lib/constants";
import type { PracticeItem, ChordItem } from "../../../lib/constants";
import { formatTime } from "../../../lib/util";
import ChordDiagram from "../../ui/ChordDiagram";
import Icon from "../../ui/Icon";
import s from "./index.module.css";

const NOTE_LABELS = [...NOTES, ...CHROMATIC_SHARPS];

function detectedLabel(detectedNote: string | null): string | null {
  if (!detectedNote) return null;
  return NOTE_LABELS.find((n) => n.id === detectedNote)?.label ?? "?";
}

type CtrlVariant = "primary" | "secondary" | "accent-line" | "danger-line" | "danger";

interface CtrlBtnProps {
  icon: string;
  label: string;
  onClick: () => void;
  variant?: CtrlVariant;
}

function CtrlBtn({ icon, label, onClick, variant = "secondary" }: CtrlBtnProps) {
  const variantClass: Record<CtrlVariant, string> = {
    primary: s.ctrlBtnPrimary,
    secondary: s.ctrlBtnSecondary,
    "accent-line": s.ctrlBtnAccentLine,
    "danger-line": s.ctrlBtnDangerLine,
    danger: s.ctrlBtnDanger,
  };

  return (
    <button onClick={onClick} className={`${s.ctrlBtn} ${variantClass[variant]}`}>
      <span className={s.ctrlIcon}><Icon name={icon} size={20} /></span>
      <span className={s.ctrlLabel}>{label}</span>
    </button>
  );
}

interface SessionViewProps {
  current: PracticeItem | null;
  count: number;
  streak: number;
  progress: number;
  paused: boolean;
  listening: boolean;
  detectedNote: string | null;
  hitStatus: "correct" | "wrong" | null;
  practiceTime: number;
  interval: number;
  chordAuto: boolean;
  pendingReveal: boolean;
  onPauseToggle: () => void;
  onForceAccept: () => void;
  onManualNext: () => void;
  onChordGrade: (correct: boolean) => void;
  onStop: () => void;
  onShowLearning: () => void;
}

export default function SessionView({
  current,
  count,
  streak,
  progress,
  paused,
  listening,
  detectedNote,
  hitStatus,
  practiceTime,
  interval,
  chordAuto,
  pendingReveal,
  onPauseToggle,
  onForceAccept,
  onManualNext,
  onChordGrade,
  onStop,
  onShowLearning,
}: SessionViewProps) {
  const [revealed, setRevealed] = useState(false);
  const [voicingIdx, setVoicingIdx] = useState(0);
  const isCorrect = listening && hitStatus === "correct" && !paused;
  const isChord = current?.type === "chord";
  const voicings = current?.type === "chord" ? (current as ChordItem).voicings : [];

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setRevealed(false); setVoicingIdx(0); }, [current?.id]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (pendingReveal) setRevealed(true); }, [pendingReveal]);

  const reveal = () => {
    setRevealed(true);
    if (!paused) onPauseToggle();
  };

  const continueSession = () => {
    setVoicingIdx(0);
    setRevealed(false);
    if (paused) onPauseToggle();
  };

  const handleChordGrade = (correct: boolean) => {
    setVoicingIdx(0);
    setRevealed(false);
    if (paused) onPauseToggle();
    onChordGrade(correct);
  };

  const detected = detectedLabel(detectedNote);

  let controls: React.ReactNode;
  if (revealed) {
    if (chordAuto) {
      controls = (
        <>
          <CtrlBtn icon="pause" label="Pause" onClick={onPauseToggle} variant="accent-line" />
          <CtrlBtn icon="next" label="Continuer" onClick={continueSession} variant="primary" />
          <CtrlBtn icon="stop" label="Arrêter" onClick={onStop} variant="danger" />
        </>
      );
    } else {
      controls = (
        <>
          <CtrlBtn icon="x" label="Raté" onClick={() => handleChordGrade(false)} variant="danger-line" />
          <CtrlBtn icon="check" label="Trouvé" onClick={() => handleChordGrade(true)} variant="primary" />
          <CtrlBtn icon="stop" label="Arrêter" onClick={onStop} variant="danger" />
        </>
      );
    }
  } else if (paused) {
    controls = (
      <>
        <CtrlBtn icon="play" label="Reprendre" onClick={onPauseToggle} variant="primary" />
        <CtrlBtn icon="next" label="Suivant" onClick={onManualNext} variant="secondary" />
        <CtrlBtn icon="stop" label="Arrêter" onClick={onStop} variant="danger" />
      </>
    );
  } else if (isChord) {
    controls = (
      <>
        <CtrlBtn icon="pause" label="Pause" onClick={onPauseToggle} variant="accent-line" />
        <CtrlBtn icon="eye" label="Voir" onClick={reveal} variant="primary" />
        <CtrlBtn icon="stop" label="Arrêter" onClick={onStop} variant="danger" />
      </>
    );
  } else {
    controls = (
      <>
        <CtrlBtn icon="pause" label="Pause" onClick={onPauseToggle} variant="accent-line" />
        {listening && !isCorrect && (
          <CtrlBtn icon="check" label="Accepter" onClick={onForceAccept} variant="primary" />
        )}
        <CtrlBtn icon="stop" label="Arrêter" onClick={onStop} variant="danger" />
      </>
    );
  }

  return (
    <div className={s.root}>
      <div
        className={s.progressBar}
        style={{ width: `${progress * 100}%`, opacity: paused ? 0.2 : 1 }}
      />

      {isCorrect && <div className={s.correctFlash} />}
      {isCorrect && <div className={s.correctGlow} />}

      <div className={s.topBar}>
        <button className={s.learningLink} onClick={onShowLearning}>Details</button>
        <div className={s.timer}>{formatTime(practiceTime)}</div>
        <div className={s.countRow}>
          <span className={s.count}>#{count}</span>
          {listening && streak > 0 && (
            <span className={s.streak}>{streak} 🔥</span>
          )}
        </div>
      </div>

      <div className={s.center}>
        {paused && !revealed && (
          <div className={s.pauseBadge}>En pause</div>
        )}

        <div className={`${s.noteName} ${isCorrect ? s.noteNameCorrect : ""}`}>
          {current?.label || "—"}
        </div>

        {isCorrect && <div className={s.correctMark}>✓</div>}

        {listening && !isCorrect && !revealed && current?.type === "note" && !paused && (
          <div className={s.listenHint}>
            Note · {detected ? detected : "Écoute…"}
          </div>
        )}

        {revealed && isChord && (
          <div className={s.diagramWrap}>
            {voicings[voicingIdx] && (
              <ChordDiagram fingering={voicings[voicingIdx]} size={320} />
            )}
            {voicings.length > 1 && (
              <div className={s.voicingSwitcher}>
                <button
                  className={s.cycleBtn}
                  onClick={() => setVoicingIdx((i) => (i - 1 + voicings.length) % voicings.length)}
                >‹</button>
                <span className={s.voicingCount}>{voicingIdx + 1}/{voicings.length}</span>
                <button
                  className={s.cycleBtn}
                  onClick={() => setVoicingIdx((i) => (i + 1) % voicings.length)}
                >›</button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className={s.controlBar}>
        {controls}
      </div>

      <div className={s.keyHints}>▲▼ intervalle ({interval.toFixed(1)}s)</div>
    </div>
  );
}
