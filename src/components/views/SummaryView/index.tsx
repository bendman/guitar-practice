import { useEffect, useState } from "react";
import { formatTime, formatDuration, weightToLevel } from "../../../lib/util";
import { useFormatLabel } from "../../../lib/noteNaming";
import { mergeSessionIntoStats, accuracyPercent } from "../../../lib/stats";
import type { Stats, SessionSummary, Weights } from "../../../lib/stats";
import ProgressDot from "../../ui/ProgressDot";
import shared from "../../shared.module.css";
import s from "./index.module.css";

interface AccuracyRingProps {
  accuracy: number;
}

const RING_DURATION = 1200;

function AccuracyRing({ accuracy }: AccuracyRingProps) {
  const [animated, setAnimated] = useState(false);
  const [display, setDisplay] = useState(0);
  const radius = 64;
  const stroke = 7;
  const circ = 2 * Math.PI * radius;
  const offset = animated ? circ * (1 - accuracy / 100) : circ;

  useEffect(() => {
    const raf = requestAnimationFrame(() => setAnimated(true));
    let frame: number;
    let startTime: number | null = null;
    const tick = (now: number) => {
      if (startTime == null) startTime = now;
      const t = Math.min((now - startTime) / RING_DURATION, 1);
      setDisplay(Math.round(t * accuracy));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); cancelAnimationFrame(frame); };
  }, [accuracy]);

  const size = (radius + stroke) * 2;

  return (
    <div className={s.ringWrap}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke="var(--surface-2)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
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
        <div className={s.ringValue}>{display}<span className={s.ringPct}>%</span></div>
        <span className={`${shared.eyebrow} ${s.ringLabel}`}>Précision</span>
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
        <span className={`${s.impactNew} ${improved && changed ? s.impactImproved : ""}`}>{newVal}</span>
      </div>
    </div>
  );
}

function headline(accuracy: number): string {
  if (accuracy >= 100) return "Sans-faute, parfait !";
  if (accuracy >= 93) return "Sans-faute ou presque !";
  if (accuracy >= 80) return "Très bonne session !";
  if (accuracy >= 65) return "Bonne session !";
  if (accuracy >= 50) return "Continue comme ça !";
  return "On progresse !";
}

interface SummaryViewProps {
  summary: SessionSummary;
  preSessionStats: Stats | null;
  weights?: Weights;
  preWeights?: Weights;
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

function ChordProgressRow({ label, before, after, attempts, misses, index }: ChordProgressRowProps) {
  // Start the "after" dot at the old level, then animate up to the new level so
  // the user sees the gain fill in.
  const [shown, setShown] = useState<0 | 1 | 2 | 3>(before);
  const improved = after > before;
  const regressed = after < before;
  const changed = after !== before;
  const successRate = attempts > 0 ? Math.round(((attempts - misses) / attempts) * 100) : 0;

  useEffect(() => {
    if (!changed) return;
    const id = setTimeout(() => setShown(after), 250 + index * 120);
    return () => clearTimeout(id);
  }, [after, changed, index]);

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
            <span className={`${s.chordProgArrow} ${improved ? s.chordProgArrowUp : regressed ? s.chordProgArrowDown : ""}`}>→</span>
            <ProgressDot level={shown} size={14} />
          </>
        ) : (
          <ProgressDot level={after} size={14} />
        )}
      </div>
    </div>
  );
}

export default function SummaryView({
  summary, preSessionStats, weights = {}, preWeights = {}, onDismiss, onReplay,
}: SummaryViewProps) {
  const {
    totalCount, correctCount, totalNotes, accuracy, bestStreak,
    practiceTime, wasListening, missedItems,
    wasManualChord, chordCorrectCount, totalChords, chordAccuracy, chordPracticedItems,
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
    .sort((a, b) => (b.after - b.before) - (a.after - a.before) || b.after - a.after);

  const postStats = preSessionStats
    ? mergeSessionIntoStats(preSessionStats, summary)
    : null;

  const preAcc = preSessionStats ? accuracyPercent(preSessionStats) : null;
  const postAcc = postStats ? accuracyPercent(postStats) : null;

  return (
    <div className={shared.screen} data-testid="summary">
      <div className={shared.screenBody}>
        <div className={shared.screenBodyInner}>

          {wasListening ? (
            <>
              <AccuracyRing accuracy={accuracy} />
              <h2 className={s.headline}>{headline(accuracy)}</h2>
              <p className={s.subCount}>{correctCount} / {totalNotes} corrects</p>
            </>
          ) : wasManualChord ? (
            <>
              <AccuracyRing accuracy={chordAccuracy} />
              <h2 className={s.headline}>{headline(chordAccuracy)}</h2>
              <p className={s.subCount}>{chordCorrectCount} / {totalChords} trouvés</p>
            </>
          ) : (
            <div className={s.noMicHeader}>
              <div className={s.sessionDoneIcon}>✓</div>
              <h2 className={s.headline}>Session terminée</h2>
            </div>
          )}

          <div className={s.strip}>
            <div className={s.stripCell}>
              <div className={s.stripValue}>{formatTime(practiceTime)}</div>
              <span className={shared.eyebrow}>Durée</span>
            </div>
            <div className={s.stripCell}>
              <div className={s.stripValue}>{totalCount}</div>
              <span className={shared.eyebrow}>Cartes</span>
            </div>
            <div className={s.stripCell}>
              <div className={s.stripValue}>{bestStreak}</div>
              <span className={shared.eyebrow}>Série</span>
            </div>
          </div>

          {postStats && preSessionStats && (
            <div className={s.progressionSection}>
              <span className={`${shared.eyebrow} ${s.sectionTitle}`}>Ta progression globale</span>
              <div className={s.impactList}>
                <ImpactRow
                  label="Temps total"
                  oldVal={formatDuration(preSessionStats.totalPracticeTime)}
                  newVal={formatDuration(postStats.totalPracticeTime)}
                  improved={postStats.totalPracticeTime > preSessionStats.totalPracticeTime}
                />
                <ImpactRow
                  label="Sessions"
                  oldVal={preSessionStats.totalSessions}
                  newVal={postStats.totalSessions}
                  improved={postStats.totalSessions > preSessionStats.totalSessions}
                />
                {postAcc != null && (
                  <ImpactRow
                    label="Précision moyenne"
                    oldVal={preAcc != null ? `${preAcc}%` : "—"}
                    newVal={`${postAcc}%`}
                    improved={preAcc != null && postAcc > preAcc}
                  />
                )}
                <ImpactRow
                  label="Meilleure série"
                  oldVal={preSessionStats.bestStreak}
                  newVal={postStats.bestStreak}
                  improved={postStats.bestStreak > preSessionStats.bestStreak}
                />
              </div>
            </div>
          )}

          {wasListening && missedItems.length > 0 && (
            <div className={s.workonSection}>
              <span className={`${shared.eyebrow} ${s.sectionTitle}`}>À retravailler</span>
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
            <div className={s.perfectNote}>
              Toutes les notes correctes — excellent !
            </div>
          )}

          {wasManualChord && chordProgress.length > 0 && (
            <div className={s.workonSection}>
              <span className={`${shared.eyebrow} ${s.sectionTitle}`}>Accords travaillés</span>
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
          Accueil
        </button>
        <button onClick={onReplay} className={shared.footerBtnPrimary}>
          Rejouer
        </button>
      </div>
    </div>
  );
}
