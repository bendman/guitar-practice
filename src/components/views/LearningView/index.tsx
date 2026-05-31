import { ALL } from "../../../lib/constants";
import type { PracticeItem } from "../../../lib/constants";
import { weightToLevel } from "../../../lib/util";
import type { Weights } from "../../../lib/stats";
import ProgressDot from "../../ui/ProgressDot";
import shared from "../../shared.module.css";
import s from "./index.module.css";

interface LearningViewProps {
  pool: PracticeItem[];
  activePool: PracticeItem[];
  weights: Weights;
  workingSetSize: number;
  onBack: () => void;
}

const LEVEL_LABEL: Record<0 | 1 | 2 | 3, string> = {
  0: "New",
  1: "Easy",
  2: "Medium",
  3: "Mastered",
};

function weightBar(weight: number) {
  const clamped = Math.min(Math.max(weight, 0), 5);
  const pct = (clamped / 5) * 100;
  const level = weightToLevel(weight);
  const colors: Record<0 | 1 | 2 | 3, string> = {
    0: "var(--dim)",
    1: "var(--green)",
    2: "var(--accent)",
    3: "var(--accent)",
  };
  return { pct, color: colors[level] };
}

export default function LearningView({
  pool,
  activePool,
  weights,
  workingSetSize,
  onBack,
}: LearningViewProps) {
  const activeIds = new Set(activePool.map((i) => i.id));
  const poolIds = new Set(pool.map((i) => i.id));

  const masteredInPool = pool.filter((i) => weightToLevel(weights[i.id]) === 3);
  const unmasteredInPool = pool.filter((i) => weightToLevel(weights[i.id]) !== 3);
  const activeUnmastered = unmasteredInPool.filter((i) => activeIds.has(i.id));
  const waitingUnmastered = unmasteredInPool.filter((i) => !activeIds.has(i.id));

  const outsidePool = ALL.filter((i) => !poolIds.has(i.id));

  return (
    <div className={shared.screen} data-testid="learning">
      <div className={shared.screenBody}>
        <div className={shared.screenBodyInner}>
          <div className={s.header}>
            <button onClick={onBack} className={s.backBtn}>← Back</button>
            <span className={s.headerLabel}>Learning details</span>
          </div>

          <div className={s.poolSummary}>
            <Stat label="Pool size" value={pool.length} />
            <Stat label="Active" value={activePool.length} />
            <Stat label="Mastered" value={masteredInPool.length} />
            <Stat label="Working set" value={workingSetSize} dim />
          </div>

          {activeUnmastered.length > 0 && (
            <ItemSection
              title={`Active (${activeUnmastered.length})`}
              items={activeUnmastered}
              weights={weights}
              highlight
            />
          )}

          {masteredInPool.length > 0 && (
            <ItemSection
              title={`Mastered (${masteredInPool.length})`}
              items={masteredInPool}
              weights={weights}
            />
          )}

          {waitingUnmastered.length > 0 && (
            <ItemSection
              title={`Waiting (${waitingUnmastered.length})`}
              items={waitingUnmastered}
              weights={weights}
              muted
            />
          )}

          {outsidePool.length > 0 && (
            <ItemSection
              title={`Disabled (${outsidePool.length})`}
              items={outsidePool}
              weights={weights}
              muted
            />
          )}
        </div>
      </div>

      <div className={shared.screenFooter}>
        <button onClick={onBack} className={shared.footerBtnSecondary}>
          Back
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
  return (
    <div className={s.section}>
      <span className={`${shared.eyebrow} ${muted ? s.eyebrowMuted : ""}`}>{title}</span>
      <div className={s.list}>
        {items.map((item) => {
          const w = weights[item.id] ?? 1;
          const level = weightToLevel(weights[item.id]);
          const bar = weightBar(w);
          return (
            <div key={item.id} className={`${s.row} ${highlight ? s.rowHighlight : ""} ${muted ? s.rowMuted : ""}`}>
              <ProgressDot level={level} size={10} />
              <span className={s.itemLabel}>{item.label}</span>
              <span className={s.levelBadge}>{LEVEL_LABEL[level]}</span>
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
