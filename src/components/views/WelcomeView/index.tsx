import { useTranslation } from "react-i18next";
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
}

export default function WelcomeView({
  stats,
  onPickNotes,
  onPickChords,
  onShowProgress,
}: WelcomeViewProps) {
  const { t } = useTranslation();
  const acc = accuracyPercent(stats);

  return (
    <div className={shared.screen}>
      {onShowProgress && (
        <button onClick={onShowProgress} className={s.settingsBtn}>
          {t("common.settings")}
        </button>
      )}
      <div className={shared.screenBody}>
        <div className={shared.screenBodyInner}>
          <header className={s.appHeader}>
            <h1 className={s.appTitle}>{t("welcome.title")}</h1>
            <p className={s.appSubtitle}>{t("welcome.subtitle")}</p>
          </header>

          <div className={s.statHero}>
            <span className={shared.eyebrow}>{t("welcome.totalPracticeTime")}</span>
            <div className={s.heroValue}>{formatDuration(stats.totalPracticeTime || 0)}</div>
            <div className={s.statsGrid}>
              <div className={s.statCell}>
                <div className={s.statValue}>{stats.bestStreak ?? "—"}</div>
                <span className={shared.eyebrow}>{t("welcome.bestStreak")}</span>
              </div>
              <div className={s.statCell}>
                <div className={s.statValue}>{stats.totalSessions ?? "—"}</div>
                <span className={shared.eyebrow}>{t("welcome.sessions")}</span>
              </div>
              <div className={s.statCell}>
                <div className={s.statValue}>{stats.totalCorrect ?? "—"}</div>
                <span className={shared.eyebrow}>{t("welcome.correctNotes")}</span>
              </div>
              <div className={s.statCell}>
                <div className={s.statValue}>{acc != null ? `${acc}%` : "—"}</div>
                <span className={shared.eyebrow}>{t("welcome.accuracy")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={s.modeFooter}>
        <span className={`${shared.eyebrow} ${s.modeLabel}`}>{t("welcome.chooseMode")}</span>
        <div className={s.modeCards}>
          <button className={s.modeCard} onClick={onPickNotes}>
            <span className={s.modeGlyph}>
              <Icon name="note" size={22} />
            </span>
            <span className={s.modeTitle}>{t("welcome.notesTitle")}</span>
            <span className={s.modeDesc}>{t("welcome.notesDesc")}</span>
            <span className={s.modeArrow}>
              <Icon name="arrow" size={18} />
            </span>
          </button>
          <button className={s.modeCard} onClick={onPickChords}>
            <span className={s.modeGlyph}>
              <Icon name="chord" size={22} />
            </span>
            <span className={s.modeTitle}>{t("welcome.chordsTitle")}</span>
            <span className={s.modeDesc}>{t("welcome.chordsDesc")}</span>
            <span className={s.modeArrow}>
              <Icon name="arrow" size={18} />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
