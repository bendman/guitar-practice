import { useEffect, useState } from "react";
import { NOTES, CHROMATIC_SHARPS } from "../constants";
import { formatTime } from "../util";
import ChordDiagram from "./ChordDiagram";
import Icon from "./Icon";
import s from "./SessionView.module.css";

const NOTE_LABELS = [...NOTES, ...CHROMATIC_SHARPS];

function detectedLabel(detectedNote) {
  if (!detectedNote) return null;
  return NOTE_LABELS.find((n) => n.id === detectedNote)?.label || "?";
}

// Single control-bar button
function CtrlBtn({ icon, label, onClick, variant = "secondary" }) {
  const variantClass = {
    primary: s.ctrlBtnPrimary,
    secondary: s.ctrlBtnSecondary,
    "accent-line": s.ctrlBtnAccentLine,
    "danger-line": s.ctrlBtnDangerLine,
    danger: s.ctrlBtnDanger,
  }[variant] ?? s.ctrlBtnSecondary;

  return (
    <button onClick={onClick} className={`${s.ctrlBtn} ${variantClass}`}>
      <span className={s.ctrlIcon}><Icon name={icon} size={20} /></span>
      <span className={s.ctrlLabel}>{label}</span>
    </button>
  );
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
}) {
  const [revealed, setRevealed] = useState(false);
  const [voicingIdx, setVoicingIdx] = useState(0);
  const isCorrect = listening && hitStatus === "correct" && !paused;
  const isChord = current?.type === "chord";
  const voicings = current?.voicings ?? [];

  // Reset reveal and voicing on new card
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setRevealed(false); setVoicingIdx(0); }, [current?.id]);

  // Auto-reveal when the timer expires in manual chord mode
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

  const handleChordGrade = (correct) => {
    setVoicingIdx(0);
    setRevealed(false);
    if (paused) onPauseToggle();
    onChordGrade(correct);
  };

  const detected = detectedLabel(detectedNote);

  // Build control bar buttons based on session state
  let controls;
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
    // Notes mode
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
      {/* Progress sweep — top bar */}
      <div
        className={s.progressBar}
        style={{ width: `${progress * 100}%`, opacity: paused ? 0.2 : 1 }}
      />

      {/* Recognition flash/glow */}
      {isCorrect && <div className={s.correctFlash} />}
      {isCorrect && <div className={s.correctGlow} />}

      {/* Timer + count */}
      <div className={s.topBar}>
        <div className={s.timer}>{formatTime(practiceTime)}</div>
        <div className={s.countRow}>
          <span className={s.count}>#{count}</span>
          {listening && streak > 0 && (
            <span className={s.streak}>{streak} 🔥</span>
          )}
        </div>
      </div>

      {/* Main content area */}
      <div className={s.center}>
        {paused && !revealed && (
          <div className={s.pauseBadge}>En pause</div>
        )}

        {/* Large note/chord name */}
        <div className={`${s.noteName} ${isCorrect ? s.noteNameCorrect : ""}`}>
          {current?.label || "—"}
        </div>

        {/* Recognized checkmark */}
        {isCorrect && <div className={s.correctMark}>✓</div>}

        {/* Mic listening hint */}
        {listening && !isCorrect && !revealed && current?.type === "note" && !paused && (
          <div className={s.listenHint}>
            Note · {detected ? detected : "Écoute…"}
          </div>
        )}

        {/* Chord diagram when revealed */}
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

      {/* Control bar */}
      <div className={s.controlBar}>
        {controls}
      </div>

      <div className={s.keyHints}>▲▼ intervalle ({interval.toFixed(1)}s)</div>
    </div>
  );
}
