import { formatDuration } from "../../../lib/util";
import { accuracyPercent } from "../../../lib/stats";
import type { Stats } from "../../../lib/stats";
import Icon from "../../ui/Icon";
import shared from "../../shared.module.css";
import s from "./index.module.css";

interface WelcomeViewProps {
  stats: Stats;
  onPickNotes: () => void;
  onPickChords: () => void;
  onShowProgress: () => void;
  showDebugLink: boolean;
  onShowDebug: () => void;
}

export default function WelcomeView({
  stats,
  onPickNotes,
  onPickChords,
  onShowProgress,
  showDebugLink,
  onShowDebug,
}: WelcomeViewProps) {
  const acc = accuracyPercent(stats);

  return (
    <div className={shared.screen}>
      {showDebugLink && (
        <button onClick={onShowDebug} className={s.debugBtn}>debug</button>
      )}
      <div className={shared.screenBody}>
        <div className={shared.screenBodyInner}>

          <header className={s.appHeader}>
            <h1 className={s.appTitle}>Exercice Guitare</h1>
            <p className={s.appSubtitle}>Trouve les notes et accords sur le manche</p>
          </header>

          <div className={s.statHero}>
            <span className={shared.eyebrow}>Temps total d&apos;entraînement</span>
            <div className={s.heroValue}>
              {formatDuration(stats.totalPracticeTime || 0)}
            </div>
            <div className={s.statsGrid}>
              <div className={s.statCell}>
                <div className={s.statValue}>{stats.bestStreak ?? "—"}</div>
                <span className={shared.eyebrow}>Meilleure série</span>
              </div>
              <div className={s.statCell}>
                <div className={s.statValue}>{stats.totalSessions ?? "—"}</div>
                <span className={shared.eyebrow}>Sessions</span>
              </div>
              <div className={s.statCell}>
                <div className={s.statValue}>{stats.totalCorrect ?? "—"}</div>
                <span className={shared.eyebrow}>Notes réussies</span>
              </div>
              <div className={s.statCell}>
                <div className={s.statValue}>{acc != null ? `${acc}%` : "—"}</div>
                <span className={shared.eyebrow}>Précision</span>
              </div>
            </div>
          </div>

          {onShowProgress && (
            <div className={s.progressLink}>
              <button className={shared.resetLink} onClick={onShowProgress}>
                Ma progression
              </button>
            </div>
          )}

        </div>
      </div>

      <div className={s.modeFooter}>
        <span className={`${shared.eyebrow} ${s.modeLabel}`}>Choisis un mode</span>
        <div className={s.modeCards}>
          <button className={s.modeCard} onClick={onPickNotes}>
            <span className={s.modeGlyph}><Icon name="note" size={22} /></span>
            <span className={s.modeTitle}>Notes</span>
            <span className={s.modeDesc}>Reconnais les notes sur le manche</span>
            <span className={s.modeArrow}><Icon name="arrow" size={18} /></span>
          </button>
          <button className={s.modeCard} onClick={onPickChords}>
            <span className={s.modeGlyph}><Icon name="chord" size={22} /></span>
            <span className={s.modeTitle}>Accords</span>
            <span className={s.modeDesc}>Mémorise les positions d&apos;accords</span>
            <span className={s.modeArrow}><Icon name="arrow" size={18} /></span>
          </button>
        </div>
      </div>
    </div>
  );
}
