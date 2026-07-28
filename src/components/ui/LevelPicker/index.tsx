import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { LEVELS } from "../../../lib/util";
import type { Level } from "../../../lib/util";
import ProgressDot from "../ProgressDot";
import s from "./index.module.css";

const LEVEL_LABEL_KEY = {
  0: "learning.levelNew",
  1: "learning.levelHard",
  2: "learning.levelMedium",
  3: "learning.levelMastered",
} as const;

export function levelLabel(t: TFunction, level: Level): string {
  return t(LEVEL_LABEL_KEY[level]);
}

interface LevelPickerProps {
  value: Level;
  onChange: (level: Level) => void;
  /** Names the group for screen readers — pass the item this row is about. */
  label: string;
}

/**
 * The mastery rung for one item, as a row of dots you pick from. Each rung
 * renders the same ProgressDot the rest of the app reads levels from, so the
 * control and the display are the same vocabulary.
 */
export default function LevelPicker({ value, onChange, label }: LevelPickerProps) {
  const { t } = useTranslation();

  return (
    <div className={s.group} role="radiogroup" aria-label={label}>
      {LEVELS.map((level) => {
        const selected = level === value;
        return (
          <button
            key={level}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={levelLabel(t, level)}
            title={levelLabel(t, level)}
            className={`${s.rung} ${selected ? s.rungSelected : ""}`}
            onClick={() => onChange(level)}
          >
            <ProgressDot level={level} size={12} dim={!selected} />
          </button>
        );
      })}
    </div>
  );
}
