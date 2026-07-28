import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { PracticeItem } from "../../../lib/constants";
import type { Weights } from "../../../lib/stats";
import { weightToLevel } from "../../../lib/util";
import type { Level } from "../../../lib/util";
import { useFormatLabel } from "../../../lib/noteNaming";
import LevelPicker from "../LevelPicker";
import s from "./index.module.css";

interface LevelsPanelProps {
  /** Drive from the session's paused state — this *is* the pause screen. */
  open: boolean;
  /** The session's pool — every item the user could be asked, in pool order. */
  items: PracticeItem[];
  weights: Weights;
  onSetLevel: (itemId: string, level: Level) => void;
}

/**
 * The notes pause screen: set every item's mastery in one pass without leaving
 * the session. The moment you notice a note is harder than the app thinks is
 * while you are practising it, not afterwards — so pausing goes straight here
 * rather than costing a second tap.
 *
 * Shown non-modally (`show()`, not `showModal()`) on purpose — it has no close
 * control of its own, and resuming the session is what dismisses it, so the
 * control bar underneath has to stay interactive rather than going inert.
 */
export default function LevelsPanel({ open, items, weights, onSetLevel }: LevelsPanelProps) {
  const { t } = useTranslation();
  const formatLabel = useFormatLabel();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.show();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog ref={dialogRef} className={s.dialog} aria-labelledby="note-levels-title">
      <div className={s.panel}>
        <h2 id="note-levels-title" className={s.title}>
          {t("modals.noteLevelsTitle")}
        </h2>
        <p className={s.subtitle}>{t("modals.noteLevelsSubtitle")}</p>

        <div className={s.list}>
          {items.map((item) => {
            const label = formatLabel(item.label);
            return (
              <div key={item.id} className={s.row}>
                <span className={s.label}>{label}</span>
                <LevelPicker
                  value={weightToLevel(weights[item.id])}
                  onChange={(level) => onSetLevel(item.id, level)}
                  label={label}
                />
              </div>
            );
          })}
        </div>

        <p className={s.hint}>{t("modals.noteLevelsHint")}</p>
      </div>
    </dialog>
  );
}
