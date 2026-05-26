import { formatTime, formatDuration } from "../util";
import { accuracyPercent } from "../stats";
import shared from "./shared.module.css";
import s from "./WelcomeView.module.css";

export default function WelcomeView({
  stats, resetStats,
  practiceTime, resetPracticeTime,
  onPickNotes, onPickChords,
  showDebugLink, onShowDebug,
}) {
  const acc = accuracyPercent(stats);
  const hasStats = stats.totalSessions > 0;

  return (
    <div className={shared.screen}>
      {showDebugLink && (
        <button onClick={onShowDebug} className={s.debugBtn}>debug</button>
      )}
      <div className={shared.screenBody}>
        <div className={shared.screenBodyInner}>
          <h1 className={shared.title}>Exercice Guitare</h1>
          <p className={shared.subtitle}>Trouve les notes et accords sur le manche</p>

          {practiceTime > 0 && (
            <div className={s.practiceTimeBox}>
              <div className={s.practiceTimeValue}>{formatTime(practiceTime)}</div>
              <div className={s.practiceTimeSubRow}>
                <span className={s.practiceTimeLabel}>Temps de pratique</span>
                <button onClick={resetPracticeTime} className={shared.resetBtn}>
                  Réinitialiser
                </button>
              </div>
            </div>
          )}

          {hasStats && (
            <div className={s.statsBox}>
              <div className={s.totalTimeRow}>
                <div className={s.totalTimeValue}>{formatDuration(stats.totalPracticeTime)}</div>
                <div className={s.totalTimeLabel}>Temps total d'entraînement</div>
              </div>
              <div className={s.statsGrid}>
                <div className={s.statCell}>
                  <div className={s.statValue}>{stats.bestStreak}</div>
                  <div className={s.statLabel}>Meilleure série</div>
                </div>
                <div className={s.statCell}>
                  <div className={s.statValue}>{stats.totalSessions}</div>
                  <div className={s.statLabel}>Sessions</div>
                </div>
                <div className={s.statCell}>
                  <div className={s.statValue}>{stats.totalCorrect}</div>
                  <div className={s.statLabel}>Notes réussies</div>
                </div>
                <div className={s.statCell}>
                  <div className={s.statValue}>{acc != null ? `${acc}%` : "—"}</div>
                  <div className={s.statLabel}>Précision</div>
                </div>
              </div>
              <div className={s.statsFooter}>
                <span className={s.practiceTimeLabel}>Statistiques globales</span>
                <button onClick={resetStats} className={shared.resetBtn}>
                  Réinitialiser
                </button>
              </div>
            </div>
          )}

          {!hasStats && (
            <div className={s.emptyHint}>
              Choisis un mode pour commencer ta première session.
            </div>
          )}
        </div>
      </div>

      <div className={shared.screenFooter}>
        <button onClick={onPickNotes} className={shared.footerBtnPrimary}>
          Notes
        </button>
        <button onClick={onPickChords} className={shared.footerBtnPrimary}>
          Accords
        </button>
      </div>
    </div>
  );
}
