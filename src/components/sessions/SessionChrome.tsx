import type { ReactNode } from "react";
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
  return (
    <div className={s.root}>
      {progress != null && (
        <div
          className={s.progressBar}
          style={{ width: `${progress * 100}%`, opacity: paused ? 0.2 : 1 }}
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
