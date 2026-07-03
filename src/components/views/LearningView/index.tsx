import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { ALL } from "../../../lib/constants";
import type { PracticeItem } from "../../../lib/constants";
import type { Weights } from "../../../lib/stats";
import { weightToLevel } from "../../../lib/util";
import { useFormatLabel } from "../../../lib/noteNaming";
import { useSettings, useProgress } from "../../../AppState";
import { usePracticePool } from "../../../hooks/useChordConfig";
import ProgressDot from "../../ui/ProgressDot";
import shared from "../../shared.module.css";
import s from "./index.module.css";

interface LearningViewProps {
  mode: "notes" | "chords";
  onBack: () => void;
}

const LEVEL_LABEL_KEY = {
  0: "learning.levelNew",
  1: "learning.levelEasy",
  2: "learning.levelMedium",
  3: "learning.levelMastered",
} as const;

function levelLabel(t: TFunction, level: 0 | 1 | 2 | 3): string {
  return t(LEVEL_LABEL_KEY[level]);
}

function weightBar(weight: number) {
  const clamped = Math.min(Math.max(weight, 0), 5);
  const pct = (clamped / 5) * 100;
  const level = weightToLevel(weight);
  const colors: Record<0 | 1 | 2 | 3, string> = {
    0: "var(--text-faint)",
    1: "var(--success)",
    2: "var(--accent)",
    3: "var(--accent)",
  };
  return { pct, color: colors[level] };
}

export default function LearningView({ mode, onBack }: LearningViewProps) {
  const { t } = useTranslation();
  const { workingSetSize } = useSettings();
  const { weights } = useProgress();
  const { pool, activePool } = usePracticePool(mode);
  const activeIds = new Set(activePool.map((i) => i.id));
  const poolIds = new Set(pool.map((i) => i.id));

  const masteredInPool = pool.filter((i) => weightToLevel(weights[i.id]) === 3);
  const unmasteredInPool = pool.filter((i) => weightToLevel(weights[i.id]) !== 3);
  const activeUnmastered = unmasteredInPool.filter((i) => activeIds.has(i.id));
  const waitingUnmastered = unmasteredInPool.filter((i) => !activeIds.has(i.id));

  const outsidePool = ALL.filter((i) => !poolIds.has(i.id));

  return (
    <div className={shared.screen}>
      <div className={shared.screenBody}>
        <div className={shared.screenBodyInner}>
          <div className={s.header}>
            <button onClick={onBack} className={s.backBtn}>
              {t("learning.backArrow")}
            </button>
            <span className={s.headerLabel}>{t("learning.title")}</span>
          </div>

          <div className={s.poolSummary}>
            <Stat label={t("learning.selection")} value={pool.length} />
            <Stat label={t("learning.active")} value={activePool.length} />
            <Stat label={t("learning.mastered")} value={masteredInPool.length} />
            <Stat label={t("learning.simultaneous")} value={workingSetSize} dim />
          </div>

          {activeUnmastered.length > 0 && (
            <ItemSection
              title={t("learning.activeSection", { n: activeUnmastered.length })}
              items={activeUnmastered}
              weights={weights}
              highlight
            />
          )}

          {masteredInPool.length > 0 && (
            <ItemSection
              title={t("learning.masteredSection", { n: masteredInPool.length })}
              items={masteredInPool}
              weights={weights}
            />
          )}

          {waitingUnmastered.length > 0 && (
            <ItemSection
              title={t("learning.waitingSection", { n: waitingUnmastered.length })}
              items={waitingUnmastered}
              weights={weights}
              muted
            />
          )}

          {outsidePool.length > 0 && (
            <ItemSection
              title={t("learning.disabledSection", { n: outsidePool.length })}
              items={outsidePool}
              weights={weights}
              muted
            />
          )}
        </div>
      </div>

      <div className={shared.screenFooter}>
        <button onClick={onBack} className={shared.footerBtnSecondary}>
          {t("common.back")}
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value, dim }: { label: string; value: number; dim?: boolean }) {
  return (
    <div className={s.stat}>
      <span className={`${s.statValue} ${dim ? s.statValueDim : ""}`}>{value}</span>
      <span className={s.statLabel}>{label}</span>
    </div>
  );
}

interface ItemSectionProps {
  title: string;
  items: PracticeItem[];
  weights: Weights;
  highlight?: boolean;
  muted?: boolean;
}

function ItemSection({ title, items, weights, highlight, muted }: ItemSectionProps) {
  const { t } = useTranslation();
  const formatLabel = useFormatLabel();
  return (
    <div className={s.section}>
      <span className={`${shared.eyebrow} ${muted ? s.eyebrowMuted : ""}`}>{title}</span>
      <div className={s.list}>
        {items.map((item) => {
          const w = weights[item.id] ?? 1;
          const level = weightToLevel(weights[item.id]);
          const bar = weightBar(w);
          return (
            <div
              key={item.id}
              className={`${s.row} ${highlight ? s.rowHighlight : ""} ${muted ? s.rowMuted : ""}`}
            >
              <ProgressDot level={level} size={10} />
              <span className={s.itemLabel}>{formatLabel(item.label)}</span>
              <span className={s.levelBadge}>{levelLabel(t, level)}</span>
              <div className={s.weightCell}>
                <div className={s.weightTrack}>
                  <div
                    className={s.weightFill}
                    style={{ width: `${bar.pct}%`, background: bar.color }}
                  />
                </div>
                <span className={s.weightNum}>{w.toFixed(2)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
