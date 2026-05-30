import { useState } from "react";
import { ALL } from "../constants";
import { weightToLevel } from "../util";
import ProgressDot from "./ProgressDot";
import ChordDiagram from "./ChordDiagram";
import shared from "./shared.module.css";
import s from "./ProgressView.module.css";

const LEVEL_LABELS = ["", "Difficile", "Facile", "Maîtrisé"];

export default function ProgressView({ weights = {}, onBack, onResetWeights, workingSetSize, setWorkingSetSize }) {
  const [openChordIds, setOpenChordIds] = useState(new Set());
  const practiced = ALL.filter((item) => weights[item.id] != null);
  const notes = practiced.filter((i) => i.type === "note");
  const chords = practiced.filter((i) => i.type === "chord");

  const toggleChord = (id) => setOpenChordIds((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  return (
    <div className={shared.screen}>
      <div className={shared.screenBody}>
        <div className={shared.screenBodyInner}>
          <h1 className={shared.title}>Progression</h1>
          <p className={shared.subtitle}>Éléments pratiqués jusqu&apos;ici</p>

          {practiced.length === 0 && (
            <p className={s.empty}>Aucun élément pratiqué pour l&apos;instant.</p>
          )}

          {notes.length > 0 && (
            <Section title="Notes" items={notes} weights={weights} />
          )}
          {chords.length > 0 && (
            <Section
              title="Accords"
              items={chords}
              weights={weights}
              openIds={openChordIds}
              onToggle={toggleChord}
            />
          )}

          <div className={s.settingsSection}>
            <span className={shared.eyebrow}>Réglages</span>
            {setWorkingSetSize && (
              <div className={s.settingRow}>
                <span className={s.settingLabel}>Éléments actifs à la fois</span>
                <div className={s.stepper}>
                  <button className={s.stepBtn} onClick={() => setWorkingSetSize(Math.max(2, workingSetSize - 1))}>−</button>
                  <span className={s.stepValue}>{workingSetSize}</span>
                  <button className={s.stepBtn} onClick={() => setWorkingSetSize(Math.min(15, workingSetSize + 1))}>+</button>
                </div>
              </div>
            )}
            {onResetWeights && (
              <div className={s.settingRow}>
                <span className={s.settingLabel}>Progression</span>
                <button className={shared.resetLink} onClick={onResetWeights}>
                  Réinitialiser
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={shared.screenFooter}>
        <button onClick={onBack} className={shared.footerBtnSecondary}>
          Retour
        </button>
      </div>
    </div>
  );
}

function Section({ title, items, weights, openIds, onToggle }) {
  return (
    <div className={s.section}>
      <span className={shared.eyebrow}>{title}</span>
      <div className={s.list}>
        {items.map((item) => {
          const level = weightToLevel(weights[item.id]);
          const isOpen = openIds?.has(item.id);
          const isChord = item.type === "chord";
          return (
            <div key={item.id}>
              <div
                className={`${s.row} ${isChord ? s.rowClickable : ""}`}
                onClick={isChord ? () => onToggle(item.id) : undefined}
              >
                <ProgressDot level={level} size={12} />
                <span className={s.label}>{item.label}</span>
                <span className={s.levelLabel}>{LEVEL_LABELS[level]}</span>
              </div>
              {isOpen && item.voicings?.length > 0 && (
                <div className={s.diagramWrap}>
                  <ChordDiagram fingering={item.voicings[0]} size={240} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
