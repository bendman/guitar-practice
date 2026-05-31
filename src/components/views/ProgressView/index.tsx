import { useState } from "react";
import { ALL } from "../../../lib/constants";
import type { PracticeItem, ChordItem } from "../../../lib/constants";
import { weightToLevel } from "../../../lib/util";
import type { NoteNaming } from "../../../lib/util";
import { useFormatLabel } from "../../../lib/noteNaming";
import type { Weights } from "../../../lib/stats";
import ProgressDot from "../../ui/ProgressDot";
import ChordDiagram from "../../ui/ChordDiagram";
import shared from "../../shared.module.css";
import s from "./index.module.css";

const LEVEL_LABELS = ["", "Difficile", "Facile", "Maîtrisé"];

interface ProgressViewProps {
  weights?: Weights;
  onBack: () => void;
  onResetWeights?: () => void;
  workingSetSize: number;
  setWorkingSetSize?: (size: number) => void;
  noteNaming?: NoteNaming;
  setNoteNaming?: (naming: NoteNaming) => void;
  spokenNaming?: NoteNaming;
  setSpokenNaming?: (naming: NoteNaming) => void;
}

export default function ProgressView({
  weights = {}, onBack, onResetWeights, workingSetSize, setWorkingSetSize,
  noteNaming = "solfege", setNoteNaming,
  spokenNaming = "solfege", setSpokenNaming,
}: ProgressViewProps) {
  const [openChordIds, setOpenChordIds] = useState<Set<string>>(new Set());
  const practiced = ALL.filter((item) => weights[item.id] != null);
  const notes = practiced.filter((i) => i.type === "note");
  const chords = practiced.filter((i) => i.type === "chord");

  const toggleChord = (id: string) => setOpenChordIds((prev) => {
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
            {setNoteNaming && (
              <NamingControl
                label="Notes écrites"
                testidPrefix="note-naming"
                value={noteNaming}
                onChange={setNoteNaming}
              />
            )}
            {setSpokenNaming && (
              <NamingControl
                label="Notes parlées"
                testidPrefix="spoken-naming"
                value={spokenNaming}
                onChange={setSpokenNaming}
              />
            )}
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

interface NamingControlProps {
  label: string;
  testidPrefix: string;
  value: NoteNaming;
  onChange: (naming: NoteNaming) => void;
}

function NamingControl({ label, testidPrefix, value, onChange }: NamingControlProps) {
  return (
    <div className={s.settingRow}>
      <span className={s.settingLabel}>{label}</span>
      <div className={s.segmented} role="radiogroup" aria-label={label}>
        <button
          className={`${s.segBtn} ${value === "solfege" ? s.segBtnActive : ""}`}
          role="radio"
          aria-checked={value === "solfege"}
          data-testid={`${testidPrefix}-solfege`}
          onClick={() => onChange("solfege")}
        >
          Do Re Mi
        </button>
        <button
          className={`${s.segBtn} ${value === "letters" ? s.segBtnActive : ""}`}
          role="radio"
          aria-checked={value === "letters"}
          data-testid={`${testidPrefix}-letters`}
          onClick={() => onChange("letters")}
        >
          C D E
        </button>
      </div>
    </div>
  );
}

interface SectionProps {
  title: string;
  items: PracticeItem[];
  weights: Weights;
  openIds?: Set<string>;
  onToggle?: (id: string) => void;
}

function Section({ title, items, weights, openIds, onToggle }: SectionProps) {
  const formatLabel = useFormatLabel();
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
                onClick={isChord ? () => onToggle?.(item.id) : undefined}
              >
                <ProgressDot level={level} size={12} />
                <span className={s.label}>{formatLabel(item.label)}</span>
                <span className={s.levelLabel}>{LEVEL_LABELS[level]}</span>
              </div>
              {isOpen && item.type === "chord" && (item as ChordItem).voicings.length > 0 && (
                <div className={s.diagramWrap}>
                  <ChordDiagram fingering={(item as ChordItem).voicings[0]} size={240} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
