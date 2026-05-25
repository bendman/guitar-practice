import { formatTime } from "../util";
import shared from "./shared.module.css";
import s from "./SummaryView.module.css";

function missRateClass(rate) {
  if (rate >= 70) return s.missRateHigh;
  if (rate >= 40) return s.missRateMid;
  return s.missRateLow;
}

export default function SummaryView({ summary, onDismiss }) {
  const {
    totalCount, correctCount, totalNotes, accuracy, avgResponseTime,
    bestStreak, practiceTime, wasListening, missedItems,
  } = summary;

  return (
    <div className={shared.configRoot}>
      <div className={shared.configInner}>
        <h1 className={shared.title}>Résumé de session</h1>
        <p className={shared.subtitle}>Voici les résultats de ta session</p>

        <div className={shared.section}>
          <div className={s.statRow}>
            <span className={s.statLabel}>Durée</span>
            <span className={s.statValue}>{formatTime(practiceTime)}</span>
          </div>
          <div className={s.statRow}>
            <span className={s.statLabel}>Éléments présentés</span>
            <span className={s.statValue}>{totalCount}</span>
          </div>
          {wasListening && (
            <>
              <div className={s.statRow}>
                <span className={s.statLabel}>Notes correctes</span>
                <span className={s.statValue}>
                  {correctCount} / {totalNotes}
                  <span className={s.accuracyPct}>{accuracy}%</span>
                </span>
              </div>
              {avgResponseTime !== null && (
                <div className={s.statRow}>
                  <span className={s.statLabel}>Temps de réponse moy.</span>
                  <span className={s.statValue}>{avgResponseTime.toFixed(1)}s</span>
                </div>
              )}
              {bestStreak > 0 && (
                <div className={s.statRow}>
                  <span className={s.statLabel}>Meilleure série</span>
                  <span className={s.statValue}>{bestStreak} 🔥</span>
                </div>
              )}
            </>
          )}
        </div>

        {wasListening && missedItems.length > 0 && (
          <div className={shared.section}>
            <span className={shared.sectionLabel}>Notes à travailler</span>
            <table className={s.table}>
              <thead>
                <tr>
                  <th className={`${s.th} ${s.thLeft}`}>Note</th>
                  <th className={s.th}>Tentatives</th>
                  <th className={s.th}>Correctes</th>
                  <th className={s.th}>Taux d'erreur</th>
                  <th className={s.th}>Temps moy.</th>
                </tr>
              </thead>
              <tbody>
                {missedItems.map((item) => (
                  <tr key={item.id}>
                    <td className={`${s.td} ${s.tdNote}`}>{item.label}</td>
                    <td className={`${s.td} ${s.tdCenter}`}>{item.attempts}</td>
                    <td className={`${s.td} ${s.tdCenter}`}>{item.attempts - item.misses}</td>
                    <td className={`${s.td} ${s.tdCenter} ${missRateClass(item.missRate)}`}>
                      {item.missRate}%
                    </td>
                    <td className={`${s.td} ${s.tdCenter}`}>
                      {item.avgResponseTime !== null ? `${item.avgResponseTime.toFixed(1)}s` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {wasListening && missedItems.length === 0 && totalNotes > 0 && (
          <div className={`${shared.section} ${s.perfect}`}>
            Parfait — toutes les notes correctes !
          </div>
        )}

        {!wasListening && (
          <div className={`${shared.section} ${s.noStats}`}>
            Détection désactivée<br /> (aucune statistique de précision disponible)
          </div>
        )}

        <button onClick={onDismiss} className={shared.startBtn}>
          Nouvelle session
        </button>
      </div>
    </div>
  );
}
