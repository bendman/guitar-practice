import { NOTES, CHROMATIC_SHARPS } from "../constants";
import { formatTime } from "../util";
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
  onStop,
}) {
  const isCorrect = listening && hitStatus === "correct" && !paused;

  return (
    <div className={s.root}>
      <div
        className={s.progressBg}
        style={{ width: `${progress * 100}%`, opacity: paused ? 0.15 : 1 }}
      />
      {isCorrect && <div className={s.correctFlash} />}
      {isCorrect && <div className={s.correctGlow} />}
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
        {isCorrect ? (
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
      {paused && (
        <>
          <div className={s.pauseScrim} />
          <div className={s.pauseOverlay}>⏸ Pause</div>
        </>
      )}
      <div className={shared.screenFooter}>
        <button onClick={onPauseToggle} className={s.btnPause}>
          {paused ? "▶ Reprendre" : "⏸ Pause"}
        </button>
        {listening && current?.type === "note" && !paused && !isCorrect && (
          <button onClick={onForceAccept} className={s.btnForce}>→ Accepter</button>
        )}
        <button onClick={onStop} className={s.btnStop}>✕ Arrêter</button>
      </div>
      <div className={s.keyHints}>
        <span>▲▼ intervalle ({interval.toFixed(1)}s)</span>
      </div>
    </div>
  );
}
