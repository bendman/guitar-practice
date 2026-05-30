import { useEffect, useState } from "react";
import { formatTime, formatDuration } from "../util";
import { mergeSessionIntoStats, accuracyPercent } from "../stats";
import shared from "./shared.module.css";
import s from "./SummaryView.module.css";

// Animated SVG accuracy ring
function AccuracyRing({ accuracy }) {
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
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke="var(--surface-2)"
          strokeWidth={stroke}
        />
        {/* Progress arc */}
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

// Impact row: shows old → new, new value highlighted if improved
function ImpactRow({ label, oldVal, newVal, improved }) {
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

function headline(accuracy) {
  if (accuracy >= 93) return "Sans-faute ou presque !";
  if (accuracy >= 80) return "Très bonne session !";
  if (accuracy >= 65) return "Bonne session !";
  if (accuracy >= 50) return "Continue comme ça !";
  return "On progresse !";
}

export default function SummaryView({ summary, preSessionStats, onDismiss, onReplay }) {
  const {
    totalCount, correctCount, totalNotes, accuracy, bestStreak,
    practiceTime, wasListening, missedItems,
  } = summary;

  // Compute post-session stats from pre-session + summary
  const postStats = preSessionStats
    ? mergeSessionIntoStats(preSessionStats, summary)
    : null;

  const preAcc = preSessionStats ? accuracyPercent(preSessionStats) : null;
  const postAcc = postStats ? accuracyPercent(postStats) : null;

  return (
    <div className={shared.screen}>
      <div className={shared.screenBody}>
        <div className={shared.screenBodyInner}>

          {/* Accuracy ring */}
          {wasListening ? (
            <>
              <AccuracyRing accuracy={accuracy} />
              <h2 className={s.headline}>{headline(accuracy)}</h2>
              <p className={s.subCount}>{correctCount} / {totalNotes} corrects</p>
            </>
          ) : (
            <div className={s.noMicHeader}>
              <div className={s.sessionDoneIcon}>✓</div>
              <h2 className={s.headline}>Session terminée</h2>
            </div>
          )}

          {/* 3-cell strip */}
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

          {/* Progression block */}
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

          {/* À retravailler */}
          {wasListening && missedItems.length > 0 && (
            <div className={s.workonSection}>
              <span className={`${shared.eyebrow} ${s.sectionTitle}`}>À retravailler</span>
              <div className={s.workonList}>
                {missedItems.map((item) => (
                  <div key={item.id} className={s.workonRow}>
                    <span className={s.workonLabel}>{item.label}</span>
                    <div className={s.workonBar}>
                      <div
                        className={s.workonBarFill}
                        style={{ width: `${item.missRate}%` }}
                      />
                    </div>
                    <span className={s.workonRate}>{item.missRate}% d&apos;erreur</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {wasListening && missedItems.length === 0 && totalNotes > 0 && (
            <div className={s.perfectNote}>
              Toutes les notes correctes — excellent !
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
