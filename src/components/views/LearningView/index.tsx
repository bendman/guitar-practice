import { useTranslation } from "react-i18next";
import { ALL } from "../../../lib/constants";
import type { PracticeItem } from "../../../lib/constants";
import type { Weights } from "../../../lib/stats";
import { weightToLevel } from "../../../lib/util";
import { useFormatLabel } from "../../../lib/noteNaming";
import { useSettings, useProgress } from "../../../AppState";
import { usePracticePool } from "../../../hooks/useChordConfig";
import { flowForMode, usesWorkingSet } from "../../../hooks/flows/types";
import LevelPicker from "../../ui/LevelPicker";
import shared from "../../shared.module.css";
import s from "./index.module.css";

interface LearningViewProps {
  mode: "notes" | "chords";
  onBack: () => void;
}

export default function LearningView({ mode, onBack }: LearningViewProps) {
  const { t } = useTranslation();
  const { workingSetSize, chordMode } = useSettings();
  const { weights } = useProgress();
  const { pool, activePool } = usePracticePool(mode);
  // Without a working set every selected item is active, so the "active" and
  // "at a time" tiles would just restate the selection count.
  const bucketed = usesWorkingSet(mode, flowForMode(mode, chordMode));
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
            {bucketed && <Stat label={t("learning.active")} value={activePool.length} />}
            <Stat label={t("learning.mastered")} value={masteredInPool.length} />
            {bucketed && <Stat label={t("learning.simultaneous")} value={workingSetSize} dim />}
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
  const { setLevel } = useProgress();
  return (
    <section className={s.section} aria-label={title}>
      <span className={`${shared.eyebrow} ${muted ? s.eyebrowMuted : ""}`}>{title}</span>
      <div className={s.list}>
        {items.map((item) => {
          const label = formatLabel(item.label);
          return (
            <div
              key={item.id}
              className={`${s.row} ${highlight ? s.rowHighlight : ""} ${muted ? s.rowMuted : ""}`}
            >
              {/* The picker is the whole level display. A dot, a text badge and a
                  raw weight alongside it were three copies of one fact — and the
                  weight bar ran backwards, filling up as a note got *worse*. */}
              <span className={s.itemLabel}>{label}</span>
              <LevelPicker
                value={weightToLevel(weights[item.id])}
                onChange={(next) => setLevel(item.id, next)}
                label={label}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
