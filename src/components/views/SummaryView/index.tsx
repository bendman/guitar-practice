import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { formatTime, formatDuration, weightToLevel } from "../../../lib/util";
import { useFormatLabel } from "../../../lib/noteNaming";
import { mergeSessionIntoStats, accuracyPercent } from "../../../lib/stats";
import type { SessionSummary } from "../../../lib/stats";
import { useProgress, useSessionHandoff } from "../../../AppState";
import ProgressDot from "../../ui/ProgressDot";
import shared from "../../shared.module.css";
import s from "./index.module.css";
import { useCountUp, useDelayedLevel } from "./hooks";

interface AccuracyRingProps {
  accuracy: number;
}

function AccuracyRing({ accuracy }: AccuracyRingProps) {
  const { t } = useTranslation();
  const { display, animated } = useCountUp(accuracy);
  const radius = 64;
  const stroke = 7;
  const circ = 2 * Math.PI * radius;
  const offset = animated ? circ * (1 - accuracy / 100) : circ;

  const size = (radius + stroke) * 2;

  return (
    <div className={s.ringWrap}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--surface-2)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--success)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 1.2s var(--ease)" }}
        />
      </svg>
      <div className={s.ringCenter}>
        <div className={s.ringValue}>
          {display}
          <span className={s.ringPct}>%</span>
        </div>
        <span className={`${shared.eyebrow} ${s.ringLabel}`}>{t("summary.accuracy")}</span>
      </div>
    </div>
  );
}

interface ImpactRowProps {
  label: string;
  oldVal: string | number;
  newVal: string | number;
  improved: boolean;
}

function ImpactRow({ label, oldVal, newVal, improved }: ImpactRowProps) {
  const changed = oldVal !== newVal;
  return (
    <div className={s.impactRow}>
      <span className={s.impactLabel}>{label}</span>
      <div className={s.impactValues}>
        {changed && (
          <>
            <span className={s.impactOld}>{oldVal}</span>
            <span className={s.impactArrow}>→</span>
          </>
        )}
        <span className={`${s.impactNew} ${improved && changed ? s.impactImproved : ""}`}>
          {newVal}
        </span>
      </div>
    </div>
  );
}

function headline(t: TFunction, accuracy: number): string {
  if (accuracy >= 100) return t("summary.headlinePerfect");
  if (accuracy >= 93) return t("summary.headlineNearPerfect");
  if (accuracy >= 80) return t("summary.headlineGreat");
  if (accuracy >= 65) return t("summary.headlineGood");
  if (accuracy >= 50) return t("summary.headlineKeepGoing");
  return t("summary.headlineProgressing");
}

interface SummaryViewProps {
  summary: SessionSummary;
  onDismiss: () => void;
  onReplay: () => void;
}

interface ChordProgressRowProps {
  label: string;
  before: 0 | 1 | 2 | 3;
  after: 0 | 1 | 2 | 3;
  attempts: number;
  misses: number;
  index: number;
}

function ChordProgressRow({
  label,
  before,
  after,
  attempts,
  misses,
  index,
}: ChordProgressRowProps) {
  // Start the "after" dot at the old level, then animate up to the new level so
  // the user sees the gain fill in.
  const shown = useDelayedLevel(before, after, index);
  const improved = after > before;
  const regressed = after < before;
  const changed = after !== before;
  const successRate = attempts > 0 ? Math.round(((attempts - misses) / attempts) * 100) : 0;

  return (
    <div className={`${s.chordProgRow} ${improved ? s.chordProgUp : ""}`}>
      <span className={s.workonLabel}>{label}</span>
      <span className={s.chordProgStat}>
        {successRate}% · {attempts - misses}/{attempts}
      </span>
      <div className={s.chordProgDots}>
        {changed ? (
          <>
            <ProgressDot level={before} size={12} dim />
            <span
              className={`${s.chordProgArrow} ${improved ? s.chordProgArrowUp : regressed ? s.chordProgArrowDown : ""}`}
            >
              →
            </span>
            <ProgressDot level={shown} size={14} />
          </>
        ) : (
          <ProgressDot level={after} size={14} />
        )}
      </div>
    </div>
  );
}

export default function SummaryView({ summary, onDismiss, onReplay }: SummaryViewProps) {
  const { t } = useTranslation();
  const { weights } = useProgress();
  const { preSessionStats, preSessionWeights: preWeights } = useSessionHandoff();
  const {
    totalCount,
    correctCount,
    totalNotes,
    accuracy,
    bestStreak,
    practiceTime,
    wasListening,
    missedItems,
    wasManualChord,
    chordCorrectCount,
    totalChords,
    chordAccuracy,
    chordPracticedItems,
  } = summary;
  const formatLabel = useFormatLabel();

  // All chords practiced this session, sorted to surface gains first.
  const chordProgress = chordPracticedItems
    .map((c) => ({
      id: c.id,
      label: c.label,
      attempts: c.attempts,
      misses: c.misses,
      before: weightToLevel(preWeights[c.id]),
      after: weightToLevel(weights[c.id]),
    }))
    .sort((a, b) => b.after - b.before - (a.after - a.before) || b.after - a.after);

  const postStats = preSessionStats ? mergeSessionIntoStats(preSessionStats, summary) : null;

  const preAcc = preSessionStats ? accuracyPercent(preSessionStats) : null;
  const postAcc = postStats ? accuracyPercent(postStats) : null;

  return (
    <div className={shared.screen}>
      <div className={shared.screenBody}>
        <div className={shared.screenBodyInner}>
          {wasListening ? (
            <>
              <AccuracyRing accuracy={accuracy} />
              <h2 className={s.headline}>{headline(t, accuracy)}</h2>
              <p className={s.subCount}>
                {t("summary.correctCount", { correct: correctCount, total: totalNotes })}
              </p>
            </>
          ) : wasManualChord ? (
            <>
              <AccuracyRing accuracy={chordAccuracy} />
              <h2 className={s.headline}>{headline(t, chordAccuracy)}</h2>
              <p className={s.subCount}>
                {t("summary.foundCount", { correct: chordCorrectCount, total: totalChords })}
              </p>
            </>
          ) : (
            <div className={s.noMicHeader}>
              <div className={s.sessionDoneIcon}>✓</div>
              <h2 className={s.headline}>{t("summary.sessionDone")}</h2>
            </div>
          )}

          <div className={s.strip}>
            <div className={s.stripCell}>
              <div className={s.stripValue}>{formatTime(practiceTime)}</div>
              <span className={shared.eyebrow}>{t("summary.duration")}</span>
            </div>
            <div className={s.stripCell}>
              <div className={s.stripValue}>{totalCount}</div>
              <span className={shared.eyebrow}>{t("summary.cards")}</span>
            </div>
            <div className={s.stripCell}>
              <div className={s.stripValue}>{bestStreak}</div>
              <span className={shared.eyebrow}>{t("summary.streak")}</span>
            </div>
          </div>

          {postStats && preSessionStats && (
            <div className={s.progressionSection}>
              <span className={`${shared.eyebrow} ${s.sectionTitle}`}>
                {t("summary.globalProgress")}
              </span>
              <div className={s.impactList}>
                <ImpactRow
                  label={t("summary.totalTime")}
                  oldVal={formatDuration(preSessionStats.totalPracticeTime)}
                  newVal={formatDuration(postStats.totalPracticeTime)}
                  improved={postStats.totalPracticeTime > preSessionStats.totalPracticeTime}
                />
                <ImpactRow
                  label={t("summary.sessions")}
                  oldVal={preSessionStats.totalSessions}
                  newVal={postStats.totalSessions}
                  improved={postStats.totalSessions > preSessionStats.totalSessions}
                />
                {postAcc != null && (
                  <ImpactRow
                    label={t("summary.avgAccuracy")}
                    oldVal={preAcc != null ? `${preAcc}%` : "—"}
                    newVal={`${postAcc}%`}
                    improved={preAcc != null && postAcc > preAcc}
                  />
                )}
                <ImpactRow
                  label={t("summary.bestStreak")}
                  oldVal={preSessionStats.bestStreak}
                  newVal={postStats.bestStreak}
                  improved={postStats.bestStreak > preSessionStats.bestStreak}
                />
              </div>
            </div>
          )}

          {wasListening && missedItems.length > 0 && (
            <div className={s.workonSection}>
              <span className={`${shared.eyebrow} ${s.sectionTitle}`}>{t("summary.toRework")}</span>
              <div className={s.workonList}>
                {missedItems.map((item) => (
                  <div key={item.id} className={s.workonRow}>
                    <ProgressDot level={weightToLevel(weights[item.id])} size={12} />
                    <span className={s.workonLabel}>{formatLabel(item.label)}</span>
                    <span className={s.workonRate}>{100 - item.missRate}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {wasListening && missedItems.length === 0 && totalNotes > 0 && (
            <div className={s.perfectNote}>{t("summary.allCorrect")}</div>
          )}

          {wasManualChord && chordProgress.length > 0 && (
            <div className={s.workonSection}>
              <span className={`${shared.eyebrow} ${s.sectionTitle}`}>
                {t("summary.workedChords")}
              </span>
              <div className={s.chordProgList}>
                {chordProgress.map((c, i) => (
                  <ChordProgressRow
                    key={c.id}
                    label={formatLabel(c.label)}
                    before={c.before}
                    after={c.after}
                    attempts={c.attempts}
                    misses={c.misses}
                    index={i}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={shared.screenFooter}>
        <button onClick={onDismiss} className={shared.footerBtnSecondary}>
          {t("common.home")}
        </button>
        <button onClick={onReplay} className={shared.footerBtnPrimary}>
          {t("summary.replay")}
        </button>
      </div>
    </div>
  );
}
