import { useEffect, useState } from "react";
import { ALL, CHORDS, isSupportedVoiceLang, formatLocaleName } from "../../../lib/constants";
import type { PracticeItem, ChordItem, Voicing } from "../../../lib/constants";
import type { CustomVoicings } from "../../../hooks/useCustomVoicings";
import { weightToLevel, sayAloud, pickRandom } from "../../../lib/util";
import type { NoteNaming } from "../../../lib/util";
import { useFormatLabel } from "../../../lib/noteNaming";
import type { Weights } from "../../../lib/stats";
import ProgressDot from "../../ui/ProgressDot";
import ChordDiagram from "../../ui/ChordDiagram";
import shared from "../../shared.module.css";
import s from "./index.module.css";

const LEVEL_LABELS = ["", "Difficile", "Facile", "Maîtrisé"];

/** Group voices by their full locale (e.g. "fr-FR", "fr-CA"), locales sorted. */
function groupVoicesByLocale(
  voices: SpeechSynthesisVoice[],
): [string, SpeechSynthesisVoice[]][] {
  const groups = new Map<string, SpeechSynthesisVoice[]>();
  for (const v of voices) {
    const list = groups.get(v.lang) ?? [];
    list.push(v);
    groups.set(v.lang, list);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
}

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
  voiceURI?: string | null;
  setVoiceURI?: (uri: string | null) => void;
  customVoicings?: CustomVoicings;
  onCreateChord?: () => void;
  onAddVoicing?: (rootId: string, qualityId: string) => void;
  onRemoveVoicing?: (chordId: string, index: number) => void;
}

export default function ProgressView({
  weights = {}, onBack, onResetWeights, workingSetSize, setWorkingSetSize,
  noteNaming = "solfege", setNoteNaming,
  spokenNaming = "solfege", setSpokenNaming,
  voiceURI = null, setVoiceURI,
  customVoicings = {}, onCreateChord, onAddVoicing, onRemoveVoicing,
}: ProgressViewProps) {
  const [openChordIds, setOpenChordIds] = useState<Set<string>>(new Set());
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof speechSynthesis === "undefined") return;
    const load = () => setVoices(speechSynthesis.getVoices().filter((v) => isSupportedVoiceLang(v.lang)));
    load();
    speechSynthesis.addEventListener("voiceschanged", load);
    return () => speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);

  const previewVoice = () => {
    const sample = pickRandom(ALL, null);
    if (sample) sayAloud(sample, spokenNaming, voiceURI);
  };

  const practiced = ALL.filter((item) => weights[item.id] != null);
  const notes = practiced.filter((i) => i.type === "note");
  const chords = CHORDS.filter((c) => weights[c.id] != null || customVoicings[c.id]?.length);

  const toggleChord = (id: string) => setOpenChordIds((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  return (
    <div className={shared.screen}>
      <div className={shared.screenBody}>
        <div className={shared.screenBodyInner}>
          <h1 className={shared.title}>Paramètres</h1>
          <p className={shared.subtitle}>Préférences et progression</p>

          {practiced.length === 0 && chords.length === 0 && (
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
              customVoicings={customVoicings}
              onAddVoicing={onAddVoicing}
              onRemoveVoicing={onRemoveVoicing}
            />
          )}
          {onCreateChord && (
            <div className={s.section}>
              <button className={shared.resetLink} onClick={onCreateChord}>
                + Créer un accord
              </button>
            </div>
          )}

          <div className={s.settingsSection}>
            <span className={shared.eyebrow}>Réglages</span>
            {setNoteNaming && (
              <NamingControl
                label="Notes écrites"
                value={noteNaming}
                onChange={setNoteNaming}
              />
            )}
            {setSpokenNaming && (
              <NamingControl
                label="Notes parlées"
                value={spokenNaming}
                onChange={setSpokenNaming}
              />
            )}
            {setVoiceURI && (
              <div className={s.settingRow}>
                <span className={s.settingLabel}>Voix</span>
                <div className={s.voiceControl}>
                  <select
                    className={s.voiceSelect}
                    aria-label="Voix"
                    value={voiceURI ?? ""}
                    onChange={(e) => setVoiceURI(e.target.value || null)}
                  >
                    <option value="">Par défaut</option>
                    {groupVoicesByLocale(voices).map(([locale, localeVoices]) => (
                      <optgroup key={locale} label={formatLocaleName(locale)}>
                        {localeVoices.map((v) => (
                          <option key={v.voiceURI} value={v.voiceURI}>
                            {v.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <button
                    className={s.previewBtn}
                    onClick={previewVoice}
                    aria-label="Écouter un aperçu"
                    title="Écouter un aperçu"
                  >
                    ▶
                  </button>
                </div>
              </div>
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
  value: NoteNaming;
  onChange: (naming: NoteNaming) => void;
}

function NamingControl({ label, value, onChange }: NamingControlProps) {
  return (
    <div className={s.settingRow}>
      <span className={s.settingLabel}>{label}</span>
      <div className={s.segmented} role="radiogroup" aria-label={label}>
        <button
          className={`${s.segBtn} ${value === "solfege" ? s.segBtnActive : ""}`}
          role="radio"
          aria-checked={value === "solfege"}
          onClick={() => onChange("solfege")}
        >
          Do Re Mi
        </button>
        <button
          className={`${s.segBtn} ${value === "letters" ? s.segBtnActive : ""}`}
          role="radio"
          aria-checked={value === "letters"}
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
  customVoicings?: CustomVoicings;
  onAddVoicing?: (rootId: string, qualityId: string) => void;
  onRemoveVoicing?: (chordId: string, index: number) => void;
}

function Section({
  title, items, weights, openIds, onToggle,
  customVoicings = {}, onAddVoicing, onRemoveVoicing,
}: SectionProps) {
  const formatLabel = useFormatLabel();
  return (
    <div className={s.section}>
      <span className={shared.eyebrow}>{title}</span>
      <div className={s.list}>
        {items.map((item) => {
          const level = weightToLevel(weights[item.id]);
          const isOpen = openIds?.has(item.id);
          const isChord = item.type === "chord";
          const chord = item as ChordItem;
          const custom = customVoicings[item.id] ?? [];
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
              {isOpen && isChord && (
                <div className={s.diagramWrap}>
                  {chord.voicings.length > 0 && (
                    <ChordDiagram fingering={chord.voicings[0]} size={240} />
                  )}
                  {custom.map((v: Voicing, idx: number) => (
                    <div key={idx} className={s.customVoicing}>
                      <ChordDiagram fingering={v} size={200} />
                      <button
                        className={shared.resetLink}
                        aria-label={`Supprimer la position ${idx + 1} ${formatLabel(item.label)}`}
                        onClick={() => onRemoveVoicing?.(item.id, idx)}
                      >
                        Supprimer
                      </button>
                    </div>
                  ))}
                  {onAddVoicing && (
                    <button
                      className={shared.resetLink}
                      aria-label={`Ajouter une position ${formatLabel(item.label)}`}
                      onClick={() => onAddVoicing(chord.rootId, chord.qualityId)}
                    >
                      + Ajouter une position
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
