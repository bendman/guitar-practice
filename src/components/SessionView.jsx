import { useEffect, useState } from "react";
import { NOTES, CHROMATIC_SHARPS } from "../constants";
import { formatTime } from "../util";
import ChordDiagram from "./ChordDiagram";
import shared from "./shared.module.css";
import s from "./SessionView.module.css";

const NOTE_LABELS = [...NOTES, ...CHROMATIC_SHARPS];

function detectedLabel(detectedNote) {
  if (!detectedNote) return "🎤 …";
  return NOTE_LABELS.find((n) => n.id === detectedNote)?.label || "?";
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
  onPauseToggle,
  onForceAccept,
  onManualNext,
  onStop,
}) {
  const [revealed, setRevealed] = useState(false);
  const [voicingIdx, setVoicingIdx] = useState(0);
  const isCorrect = listening && hitStatus === "correct" && !paused;
  const isChord = current?.type === "chord";
  const voicings = current?.voicings ?? [];

  // A new chord always starts hidden; also clears a stale reveal after manual
  // "Suivant" while paused.
  useEffect(() => {
    setRevealed(false);
    setVoicingIdx(0);
  }, [current?.id]);

  // Revealing the diagram pauses the auto-advance timer; continuing resumes it.
  // Reveal is only offered while playing, so these transitions are deterministic.
  const reveal = () => {
    setRevealed(true);
    if (!paused) onPauseToggle();
  };
  const continueSession = () => {
    setVoicingIdx(0);
    setRevealed(false);
    if (paused) onPauseToggle();
  };

  return (
    <div className={s.root}>
      <div
        className={s.progressBg}
        style={{ width: `${progress * 100}%`, opacity: paused ? 0.15 : 1 }}
      />
      {isCorrect && <div className={s.correctFlash} />}
      {isCorrect && <div className={s.correctGlow} />}
      {paused && !revealed && <div className={s.pauseBadge}>⏸ En pause</div>}
      <div className={s.center}>
        <div className={s.practiceTimer}>{formatTime(practiceTime)}</div>
        <div className={s.countBadge}>
          #{count}
          {listening && streak > 0 && (
            <span className={s.streak}>{streak} 🔥</span>
          )}
        </div>
        <div className={`${s.noteDisplay} ${isCorrect ? s.noteDisplayCorrect : ""}`}>
          {current?.label || "—"}
        </div>
        {revealed && isChord ? (
          <div className={s.revealView}>
            {voicings[voicingIdx] && (
              <ChordDiagram fingering={voicings[voicingIdx]} size={220} />
            )}
            {voicings.length > 1 && (
              <div className={s.voicingSwitcher}>
                <button
                  className={s.cycleBtn}
                  onClick={() => setVoicingIdx((i) => (i - 1 + voicings.length) % voicings.length)}
                >
                  ‹
                </button>
                <span>{voicingIdx + 1}/{voicings.length}</span>
                <button
                  className={s.cycleBtn}
                  onClick={() => setVoicingIdx((i) => (i + 1) % voicings.length)}
                >
                  ›
                </button>
              </div>
            )}
          </div>
        ) : isCorrect ? (
          <div className={s.correctMark}>✓</div>
        ) : (
          <>
            <div className={s.typeBadge}>
              {current?.type === "chord" ? "Accord" : "Note"}
            </div>
            {listening && current?.type === "note" && !paused && (
              <div className={s.detectionHint}>{detectedLabel(detectedNote)}</div>
            )}
          </>
        )}
      </div>
      <div className={shared.screenFooter}>
        {revealed ? (
          <button onClick={continueSession} className={s.btnContinue}>▶ Continuer</button>
        ) : (
          <>
            <button onClick={onPauseToggle} className={s.btnPause}>
              {paused ? "▶ Reprendre" : "⏸ Pause"}
            </button>
            {paused && (
              <button onClick={onManualNext} className={s.btnNext}>Suivant →</button>
            )}
            {isChord && !paused && (
              <button onClick={reveal} className={s.btnReveal}>👁 Voir l'accord</button>
            )}
            {listening && current?.type === "note" && !paused && !isCorrect && (
              <button onClick={onForceAccept} className={s.btnForce}>→ Accepter</button>
            )}
          </>
        )}
        <button onClick={onStop} className={s.btnStop}>✕ Arrêter</button>
      </div>
      <div className={s.keyHints}>
        <span>▲▼ intervalle ({interval.toFixed(1)}s)</span>
      </div>
    </div>
  );
}
