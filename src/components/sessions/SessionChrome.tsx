import { useEffect, useRef, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { formatTime } from "../../lib/util";
import ControlBar, { type BtnSpec } from "./ControlBar";
import s from "./session.module.css";

interface SessionChromeProps {
  practiceTime: number;
  count: number;
  streak?: number;
  showStreak?: boolean;
  /** Omit to hide the top progress bar (quiz mode). */
  progress?: number;
  paused: boolean;
  /** True when the listener just recognized a correct note — drives the flash/glow overlay. */
  recognized?: boolean;
  /** Shown under the control bar when defined (interval hint). */
  interval?: number;
  onShowLearning: () => void;
  buttons: BtnSpec[];
  children: ReactNode;
}

export default function SessionChrome({
  practiceTime,
  count,
  streak = 0,
  showStreak = false,
  progress,
  paused,
  recognized = false,
  interval,
  onShowLearning,
  buttons,
  children,
}: SessionChromeProps) {
  const { t } = useTranslation();

  // A progress decrease means the countdown restarted for the next item: the
  // bar must snap back to the left, not animate leftwards through the CSS
  // width transition (which only smooths the rightward fill). The previous
  // value is tracked post-commit (not during render, which StrictMode runs
  // twice and would see its own update).
  const prevProgressRef = useRef(progress ?? 0);
  const isReset = progress != null && progress < prevProgressRef.current;
  useEffect(() => {
    prevProgressRef.current = progress ?? 0;
  }, [progress]);

  return (
    <div className={s.root}>
      {progress != null && (
        <div
          className={s.progressBar}
          style={{
            width: `${progress * 100}%`,
            opacity: paused ? 0.2 : 1,
            ...(isReset ? { transition: "opacity 0.3s ease" } : {}),
          }}
        />
      )}

      {recognized && <div className={s.correctFlash} />}
      {recognized && <div className={s.correctGlow} />}

      <div className={s.topBar}>
        <button className={s.learningLink} onClick={onShowLearning}>
          {t("session.details")}
        </button>
        <div className={s.timer}>{formatTime(practiceTime)}</div>
        <div className={s.countRow}>
          <span className={s.count} role="status" aria-label={t("session.card", { n: count })}>
            #{count}
          </span>
          {showStreak && streak > 0 && <span className={s.streak}>{streak} 🔥</span>}
        </div>
      </div>

      <div className={s.center}>{children}</div>

      <ControlBar buttons={buttons} />

      {interval != null && (
        <div className={s.keyHints}>{t("session.intervalHint", { secs: interval.toFixed(1) })}</div>
      )}
    </div>
  );
}
