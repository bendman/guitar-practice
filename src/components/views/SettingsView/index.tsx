import { useEffect, useState } from "react";
import { ALL, CHORDS, isSupportedVoiceLang, formatLocaleName, mergeCustomVoicings } from "../../../lib/constants";
import type { ChordItem } from "../../../lib/constants";
import { weightToLevel, sayAloud, pickRandom } from "../../../lib/util";
import type { NoteNaming } from "../../../lib/util";
import { useFormatLabel } from "../../../lib/noteNaming";
import { useSettings, useProgress, useVoicings } from "../../../AppState";
import ProgressDot from "../../ui/ProgressDot";
import ChordDiagram from "../../ui/ChordDiagram";
import shared from "../../shared.module.css";
import s from "./index.module.css";

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

interface SettingsViewProps {
  onBack: () => void;
  onCreateChord: () => void;
  onAddVoicing: (rootId: string, qualityId: string) => void;
  onShowDebug: () => void;
}

export default function SettingsView({
  onBack, onCreateChord, onAddVoicing, onShowDebug,
}: SettingsViewProps) {
  const {
    workingSetSize, setWorkingSetSize,
    noteNaming, setNoteNaming,
    spokenNaming, setSpokenNaming,
    voiceURI, setVoiceURI,
  } = useSettings();
  const { weights, resetAllWeights: onResetWeights } = useProgress();
  const {
    customVoicings,
    preferredVoicings,
    setPreferredVoicing: onVoicingChange,
    removeVoicing: onRemoveVoicing,
  } = useVoicings();
  const [openChordIds, setOpenChordIds] = useState<Set<string>>(new Set());
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voicingIndices, setVoicingIndices] = useState<Record<string, number>>({});
  const formatLabel = useFormatLabel();

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

  const allChords = mergeCustomVoicings(CHORDS, customVoicings);

  const sortedChords = [...allChords].sort((a, b) => {
    const levelA = weightToLevel(weights[a.id]);
    const levelB = weightToLevel(weights[b.id]);
    if (levelA !== levelB) return levelA - levelB;
    return formatLabel(a.label).localeCompare(formatLabel(b.label));
  });

  const toggleChord = (id: string) => setOpenChordIds((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const setVoicingIdx = (chordId: string, idx: number) => {
    setVoicingIndices((prev) => ({ ...prev, [chordId]: idx }));
    onVoicingChange?.(chordId, idx);
  };

  return (
    <div className={shared.screen}>
      <div className={shared.screenBody}>
        <div className={shared.screenBodyInner}>
          <h1 className={shared.title}>Paramètres</h1>
          <p className={shared.subtitle}>Préférences et progression</p>

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

          <div className={s.settingsSection}>
            <span className={shared.eyebrow}>Version</span>
            <div className={s.settingRow}>
              <span className={s.settingLabel}>Build</span>
              <button
                className={s.buildDate}
                onClick={onShowDebug ?? undefined}
                disabled={!onShowDebug}
              >
                {new Date(__BUILD_TIME__).toLocaleString()}
              </button>
            </div>
          </div>

          <div className={s.section}>
            <span className={shared.eyebrow}>Accords</span>
            <div className={s.list}>
              {sortedChords.map((chord) => {
                const level = weightToLevel(weights[chord.id]);
                const isOpen = openChordIds.has(chord.id);
                const voicings = chord.voicings;
                const voicingIdx = Math.min(
                  voicingIndices[chord.id] ?? (preferredVoicings[chord.id] ?? 0),
                  Math.max(0, voicings.length - 1),
                );
                const customForChord = customVoicings[chord.id] ?? [];
                return (
                  <div key={chord.id}>
                    <div
                      className={`${s.row} ${s.rowClickable}`}
                      onClick={() => toggleChord(chord.id)}
                    >
                      <ProgressDot level={level} size={12} />
                      <span className={s.label}>{formatLabel(chord.label)}</span>
                      <span className={s.chevron}>{isOpen ? "▲" : "▼"}</span>
                    </div>
                    {isOpen && (
                      <div className={s.accordionBody}>
                        {voicings.length > 0 ? (
                          <>
                            <ChordDiagram fingering={voicings[voicingIdx]} size={240} />
                            {voicings.length > 1 && (
                              <div className={s.voicingSwitcher} role="group" aria-label="Positions">
                                <button
                                  className={s.cycleBtn}
                                  aria-label="Position précédente"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setVoicingIdx(chord.id, (voicingIdx - 1 + voicings.length) % voicings.length);
                                  }}
                                >‹</button>
                                <span
                                  className={s.voicingCount}
                                  role="status"
                                  aria-label={`Position ${voicingIdx + 1} sur ${voicings.length}`}
                                >
                                  {voicingIdx + 1}/{voicings.length}
                                </span>
                                <button
                                  className={s.cycleBtn}
                                  aria-label="Position suivante"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setVoicingIdx(chord.id, (voicingIdx + 1) % voicings.length);
                                  }}
                                >›</button>
                              </div>
                            )}
                          </>
                        ) : (
                          <p className={s.noVoicing}>Aucune position</p>
                        )}
                        {customForChord.map((_v, customIdx) => (
                          onRemoveVoicing && (
                            <button
                              key={customIdx}
                              className={shared.resetLink}
                              aria-label={`Supprimer la position ${customIdx + 1} ${formatLabel(chord.label)}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                onRemoveVoicing(chord.id, customIdx);
                              }}
                            >
                              Supprimer la position {customIdx + 1}
                            </button>
                          )
                        ))}
                        {onAddVoicing && (
                          <button
                            className={shared.resetLink}
                            aria-label={`Ajouter une position ${formatLabel(chord.label)}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddVoicing((chord as ChordItem).rootId, (chord as ChordItem).qualityId);
                            }}
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

          {onCreateChord && (
            <div className={s.section}>
              <button className={shared.resetLink} onClick={onCreateChord}>
                + Créer un accord
              </button>
            </div>
          )}
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
