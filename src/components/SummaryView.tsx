import { useEffect, useState } from "react";
import { formatTime, formatDuration, weightToLevel } from "../util";
import { mergeSessionIntoStats, accuracyPercent } from "../stats";
import type { Stats, SessionSummary, Weights } from "../stats";
import ProgressDot from "./ProgressDot";
import shared from "./shared.module.css";
import s from "./SummaryView.module.css";

interface AccuracyRingProps {
  accuracy: number;
}

function AccuracyRing({ accuracy }: AccuracyRingProps) {
  const [animated, setAnimated] = useState(false);
  const radius = 48;
  const stroke = 6;
  const circ = 2 * Math.PI * radius;
  const offset = animated ? circ * (1 - accuracy / 100) : circ;

  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimated(true));
    return () => cancelAnimationFrame(id);
  }, []);

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
          style={{ transition: "stroke-dashoffset 0.8s var(--ease)" }}
        />
      </svg>
      <div className={s.ringCenter}>
        <div className={s.ringValue}>{accuracy}</div>
        <span className={shared.eyebrow}>Précision</span>
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
  return (
    <div className={s.impactRow}>
      <span className={s.impactLabel}>{label}</span>
      <div className={s.impactValues}>
        <span className={s.impactOld}>{oldVal}</span>
        <span className={s.impactArrow}>→</span>
        <span className={`${s.impactNew} ${improved ? s.impactImproved : ""}`}>{newVal}</span>
      </div>
    </div>
  );
}

function headline(accuracy: number): string {
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
  onDismiss: () => void;
  onReplay: () => void;
}

export default function SummaryView({
  summary, preSessionStats, weights = {}, onDismiss, onReplay,
}: SummaryViewProps) {
  const {
    totalCount, correctCount, totalNotes, accuracy, bestStreak,
    practiceTime, wasListening, missedItems,
    wasManualChord, chordCorrectCount, totalChords, chordAccuracy, chordMissedItems,
  } = summary;

  const postStats = preSessionStats
    ? mergeSessionIntoStats(preSessionStats, summary)
    : null;

  const preAcc = preSessionStats ? accuracyPercent(preSessionStats) : null;
  const postAcc = postStats ? accuracyPercent(postStats) : null;

  return (
    <div className={shared.screen}>
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
                    <span className={s.workonLabel}>{item.label}</span>
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

          {wasManualChord && chordMissedItems.length > 0 && (
            <div className={s.workonSection}>
              <span className={`${shared.eyebrow} ${s.sectionTitle}`}>À retravailler</span>
              <div className={s.workonList}>
                {chordMissedItems.map((item) => (
                  <div key={item.id} className={s.workonRow}>
                    <ProgressDot level={weightToLevel(weights[item.id])} size={12} />
                    <span className={s.workonLabel}>{item.label}</span>
                    <span className={s.workonRate}>{100 - item.missRate}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {wasManualChord && chordMissedItems.length === 0 && totalChords > 0 && (
            <div className={s.perfectNote}>
              Tous les accords trouvés — excellent !
            </div>
          )}

        </div>
      </div>

      <div className={shared.screenFooter}>
        <button onClick={onReplay} className={shared.footerBtnSecondary}>
          Rejouer
        </button>
        <button onClick={onDismiss} className={shared.footerBtnPrimary}>
          Accueil
        </button>
      </div>
    </div>
  );
}
