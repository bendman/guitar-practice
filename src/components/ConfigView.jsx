import { CHORDS, CHORD_ROOTS, CHORD_QUALITIES } from "../constants";
import NotesPicker from "./NotesPicker";
import Toggle from "./Toggle";
import shared from "./shared.module.css";
import chip from "./ChipGroup.module.css";
import s from "./ConfigView.module.css";

function ChordsGroup({ enabled, setEnabled }) {
  const allOn = CHORDS.every((item) => enabled[item.id]);
  const toggleAll = () => {
    setEnabled((prev) => {
      const next = { ...prev };
      CHORDS.forEach((item) => (next[item.id] = !allOn));
      return next;
    });
  };
  const toggle = (id) => setEnabled((p) => ({ ...p, [id]: !p[id] }));
  return (
    <div className={shared.section}>
      <div className={shared.sectionHeader}>
        <span className={shared.sectionLabel}>Accords</span>
        <button onClick={toggleAll} className={s.toggleAllBtn}>
          {allOn ? "Tout désélectionner" : "Tout sélectionner"}
        </button>
      </div>
      <div className={s.chordGrid}>
        {CHORD_ROOTS.map((root) => (
          <div key={root.id} className={s.chordRow}>
            <div className={s.chordRoot}>{root.label}</div>
            <div className={s.chordQualities}>
              {CHORD_QUALITIES.map((q) => {
                const id = `${root.id}_${q.id}`;
                return (
                  <button
                    key={id}
                    onClick={() => toggle(id)}
                    className={`${chip.chip} ${enabled[id] ? chip.chipOn : ""} ${s.chordChip}`}
                  >
                    {q.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ConfigView({
  mode,
  interval, setInterval,
  enabled, setEnabled,
  tts, setTts,
  listening, setListening,
  pool,
  onStart, onBack,
  showDebugLink, onShowDebug,
}) {
  const isNotesMode = mode !== "chords";
  const title = isNotesMode ? "Notes" : "Accords";
  const startLabel = pool.length === 0
    ? "Sélectionne au moins un élément"
    : "Commencer";

  return (
    <div className={shared.screen}>
      {showDebugLink && (
        <button onClick={onShowDebug} className={s.debugBtn}>debug</button>
      )}
      <div className={shared.screenBody}>
        <div className={shared.screenBodyInner}>
          <h1 className={shared.title}>{title}</h1>
          <p className={shared.subtitle}>
            {isNotesMode
              ? "Configure ta session de notes"
              : "Configure ta session d'accords"}
          </p>

          <div className={shared.section}>
            <label className={shared.sectionLabel}>
              Intervalle : <span className={s.intervalValue}>{interval.toFixed(1)}s</span>
            </label>
            <input
              type="range"
              min="0.5"
              max="5"
              step="0.1"
              value={interval}
              onChange={(e) => setInterval(parseFloat(e.target.value))}
              className={s.slider}
            />
            <div className={s.sliderLabels}>
              <span>0.5s</span>
              <span>5.0s</span>
            </div>
          </div>

          {isNotesMode
            ? <NotesPicker enabled={enabled} setEnabled={setEnabled} />
            : <ChordsGroup enabled={enabled} setEnabled={setEnabled} />}

          <Toggle label="Annoncer à voix haute" value={tts} onChange={setTts} />
          {isNotesMode && (
            <Toggle
              label="Détecter les notes (micro)"
              value={listening}
              onChange={setListening}
            />
          )}
          {isNotesMode && listening && (
            <div className={s.listenHint}>
              Le texte change de couleur quand la bonne note est jouée
            </div>
          )}
        </div>
      </div>

      <div className={shared.screenFooter}>
        <button onClick={onBack} className={shared.footerBtnSecondary}>
          Retour
        </button>
        <button
          onClick={onStart}
          disabled={pool.length === 0}
          className={shared.footerBtnPrimary}
        >
          {startLabel}
        </button>
      </div>
    </div>
  );
}
