import { useState } from "react";
import { CHORDS, CHORD_ROOTS, CHORD_QUALITIES, CHORD_PRESETS, CHORD_PROGRESSIONS, NOTES, CHROMATIC_NOTES, NOTES_DISPLAY_ORDER } from "../constants";
import { weightToLevel } from "../util";
import NotesPicker from "./NotesPicker";
import Toggle from "./Toggle";
import Icon from "./Icon";
import ProgressDot from "./ProgressDot";
import shared from "./shared.module.css";
import s from "./ConfigView.module.css";

// ── Interval control ──────────────────────────────────────────────────────────
function IntervalControl({ interval, setInterval }) {
  return (
    <div className={s.intervalSection}>
      <div className={s.intervalHeader}>
        <span className={shared.eyebrow}>Intervalle</span>
        <span className={s.intervalValue}>{interval.toFixed(1)}s</span>
      </div>
      <div className={s.sliderWrap}>
        <input
          type="range"
          min="0.5"
          max="10"
          step="0.1"
          value={interval}
          onChange={(e) => setInterval(parseFloat(e.target.value))}
          className={s.slider}
        />
      </div>
      <div className={s.sliderLabels}>
        <span>0.5s</span>
        <span>10.0s</span>
      </div>
    </div>
  );
}

// ── En cours chip ─────────────────────────────────────────────────────────────
function EnCoursChip({ weights, enabled, setEnabled }) {
  const enCours = CHORDS.filter((c) => weightToLevel(weights[c.id]) === 2);
  if (enCours.length === 0) return null;
  const isActive =
    enCours.every((c) => enabled[c.id]) &&
    CHORDS.filter((c) => enabled[c.id]).length === enCours.length;
  const apply = () => {
    setEnabled((prev) => {
      const next = { ...prev };
      CHORDS.forEach((c) => { next[c.id] = weightToLevel(weights[c.id]) === 2; });
      return next;
    });
  };
  return (
    <button onClick={apply} className={`${s.chip} ${isActive ? s.chipActive : ""}`}>
      En cours
    </button>
  );
}

// ── Chord builder ─────────────────────────────────────────────────────────────
function ChordsBuilder({ enabled, setEnabled, chordPreset, chordProgression, onPreset, onProgression, weights = {} }) {
  const [showMatrix, setShowMatrix] = useState(false);
  const totalEnabled = CHORDS.filter((c) => enabled[c.id]).length;

  const clearAll = () => {
    setEnabled((prev) => {
      const next = { ...prev };
      CHORDS.forEach((c) => (next[c.id] = false));
      return next;
    });
  };

  const toggleQuality = (qualityId) => {
    setEnabled((prev) => {
      const next = { ...prev };
      const anyOn = CHORD_ROOTS.some((r) => prev[`${r.id}_${qualityId}`]);
      CHORD_ROOTS.forEach((r) => { next[`${r.id}_${qualityId}`] = !anyOn; });
      return next;
    });
  };

  const isQualityActive = (qualityId) =>
    CHORD_ROOTS.some((r) => enabled[`${r.id}_${qualityId}`]);

  const toggleRoot = (rootId) => {
    setEnabled((prev) => {
      const next = { ...prev };
      const anyOn = CHORD_QUALITIES.some((q) => prev[`${rootId}_${q.id}`]);
      CHORD_QUALITIES.forEach((q) => { next[`${rootId}_${q.id}`] = !anyOn; });
      return next;
    });
  };

  const isRootActive = (rootId) =>
    CHORD_QUALITIES.some((q) => enabled[`${rootId}_${q.id}`]);

  const rootPreset = (kind) => {
    if (kind === "none") {
      setEnabled((prev) => {
        const next = { ...prev };
        CHORDS.forEach((c) => (next[c.id] = false));
        return next;
      });
    } else if (kind === "naturals") {
      // Enable Mi and La (the original natural-position roots)
      setEnabled((prev) => {
        const next = { ...prev };
        CHORDS.forEach((c) => { next[c.id] = c.rootId === "mi" || c.rootId === "la"; });
        return next;
      });
    } else if (kind === "all") {
      setEnabled((prev) => {
        const next = { ...prev };
        CHORDS.forEach((c) => (next[c.id] = true));
        return next;
      });
    }
  };

  return (
    <>
      {/* Total + clear */}
      <div className={s.chordHeader}>
        <span className={shared.eyebrow}>Accords · {totalEnabled} au total</span>
        <button className={shared.resetLink} onClick={clearAll}>tout effacer</button>
      </div>

      {/* Preset chips */}
      <div className={s.chipRow} style={{ flexWrap: "wrap" }}>
        {CHORD_PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => onPreset(p.id)}
            className={`${s.chip} ${chordPreset === p.id ? s.chipActive : ""}`}
          >
            {p.label}
          </button>
        ))}
        <EnCoursChip weights={weights} enabled={enabled} setEnabled={setEnabled} />
      </div>

      {/* Progression chips */}
      <div className={s.subsectionHeader}>
        <span className={shared.eyebrow}>Tonalités &amp; progressions</span>
      </div>
      <div className={s.chipRow} style={{ flexWrap: "wrap" }}>
        {CHORD_PROGRESSIONS.map((p) => (
          <button
            key={p.id}
            onClick={() => onProgression(p.id)}
            className={`${s.chip} ${chordProgression === p.id ? s.chipActive : ""}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Quality chips */}
      <div className={s.subsectionHeader}>
        <span className={shared.eyebrow}>Qualités</span>
      </div>
      <div className={s.chipRow}>
        {CHORD_QUALITIES.map((q) => (
          <button
            key={q.id}
            onClick={() => toggleQuality(q.id)}
            className={`${s.chip} ${isQualityActive(q.id) ? s.chipActive : ""}`}
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* Root keyboard */}
      <div className={s.subsectionHeader}>
        <span className={shared.eyebrow}>Toniques</span>
        <div className={s.presetLinks}>
          <button className={shared.resetLink} onClick={() => rootPreset("none")}>aucune</button>
          <span className={s.presetSep}>|</span>
          <button className={shared.resetLink} onClick={() => rootPreset("naturals")}>naturelles</button>
          <span className={s.presetSep}>|</span>
          <button className={shared.resetLink} onClick={() => rootPreset("all")}>toutes</button>
        </div>
      </div>
      <div className={s.rootKeyboard}>
        {NOTES_DISPLAY_ORDER.map(({ natural }) => {
          const root = CHORD_ROOTS.find((r) => r.id === natural.id);
          if (!root) return <div key={natural.id} className={s.rootKeyPlaceholder} />;
          return (
            <button
              key={root.id}
              onClick={() => toggleRoot(root.id)}
              className={`${s.rootKey} ${isRootActive(root.id) ? s.rootKeyOn : ""}`}
            >
              {root.label}
            </button>
          );
        })}
      </div>

      {/* Affiner par tonique — fine-grained root×quality matrix */}
      {(() => {
        const activeRoots = CHORD_ROOTS.filter((r) => isRootActive(r.id));
        const activeQualities = CHORD_QUALITIES.filter((q) => isQualityActive(q.id));
        if (activeRoots.length === 0 || activeQualities.length === 0) return null;
        const exCount = activeRoots.reduce(
          (n, r) => n + activeQualities.filter((q) => !enabled[`${r.id}_${q.id}`]).length, 0
        );
        const toggleCell = (rootId, qualityId) => {
          const id = `${rootId}_${qualityId}`;
          setEnabled((prev) => ({ ...prev, [id]: !prev[id] }));
        };
        return (
          <div className={s.matrixWrap}>
            <button className={s.matrixToggle} onClick={() => setShowMatrix((v) => !v)}>
              <span className={s.matrixToggleLabel}>
                <Icon name={showMatrix ? "eye-off" : "eye"} size={14} />
                Affiner par tonique{exCount > 0 ? ` · ${exCount} exclus` : ""}
              </span>
              <Icon name={showMatrix ? "chevL" : "chevR"} size={15} />
            </button>
            {showMatrix && (
              <div className={s.matrixScroll}>
                <div
                  className={s.matrix}
                  style={{ gridTemplateColumns: `48px repeat(${activeQualities.length}, 1fr)` }}
                >
                  <div />
                  {activeQualities.map((q) => (
                    <div key={q.id} className={s.mxCol}>{q.label}</div>
                  ))}
                  {activeRoots.map((r) => (
                    <>
                      <div key={r.id} className={s.mxRow}>{r.label}</div>
                      {activeQualities.map((q) => {
                        const id = `${r.id}_${q.id}`;
                        const on = !!enabled[id];
                        const level = on ? weightToLevel(weights[id]) : 0;
                        return (
                          <button
                            key={q.id}
                            className={`${s.mxCell} ${on ? s.mxCellOn : ""}`}
                            onClick={() => toggleCell(r.id, q.id)}
                            aria-label={`${r.label} ${q.label}`}
                          >
                            <ProgressDot level={level} size={10} />
                          </button>
                        );
                      })}
                    </>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}
    </>
  );
}

// ── Main ConfigView ───────────────────────────────────────────────────────────
export default function ConfigView({
  mode,
  interval, setInterval,
  enabled, setEnabled,
  tts, setTts,
  listening, setListening,
  pool,
  chordPreset, chordProgression,
  onPreset, onProgression,
  chordAuto, setChordAuto,
  onStart, onBack,
  weights = {},
  showDebugLink, onShowDebug,
}) {
  const isNotesMode = mode !== "chords";
  const title = isNotesMode ? "Notes" : "Accords";
  const subtitle = isNotesMode
    ? "Configure ta session de notes"
    : "Configure ta session d'accords";

  const noteCount = [...NOTES, ...CHROMATIC_NOTES].filter((n) => enabled[n.id]).length;

  return (
    <div className={shared.screen}>
      {showDebugLink && (
        <button onClick={onShowDebug} className={s.debugBtn}>debug</button>
      )}
      <div className={shared.screenBody}>
        <div className={shared.screenBodyInner}>
          <h1 className={shared.title}>{title}</h1>
          <p className={shared.subtitle}>{subtitle}</p>

          <IntervalControl interval={interval} setInterval={setInterval} />

          {isNotesMode ? (
            <>
              <NotesPicker
                enabled={enabled}
                setEnabled={setEnabled}
                selectedNoteCount={noteCount}
              />
              <Toggle
                label="Annoncer à voix haute"
                sublabel="Lit le nom au début de chaque carte"
                value={tts}
                onChange={setTts}
              />
              <Toggle
                label="Détecter les notes (micro)"
                sublabel="Valide automatiquement quand tu joues juste"
                value={listening}
                onChange={setListening}
              />
            </>
          ) : (
            <>
              <ChordsBuilder
                enabled={enabled}
                setEnabled={setEnabled}
                chordPreset={chordPreset}
                chordProgression={chordProgression}
                onPreset={onPreset}
                onProgression={onProgression}
                weights={weights}
              />

              {/* Progression mode */}
              <div className={s.toggleRow}>
                <div>
                  <div className={s.toggleLabel}>Progression</div>
                  <div className={s.toggleSublabel}>
                    {chordAuto
                      ? "Auto · pratique la vitesse de transition"
                      : "Manuelle · mémorise, évalue Trouvé / Raté"}
                  </div>
                </div>
                <div className={s.segmented}>
                  <button
                    className={`${s.seg} ${!chordAuto ? s.segOn : ""}`}
                    onClick={() => setChordAuto(false)}
                  >
                    Manuelle
                  </button>
                  <button
                    className={`${s.seg} ${chordAuto ? s.segOn : ""}`}
                    onClick={() => setChordAuto(true)}
                  >
                    Auto
                  </button>
                </div>
              </div>

              <Toggle
                label="Annoncer à voix haute"
                sublabel="Lit le nom au début de chaque carte"
                value={tts}
                onChange={setTts}
              />
            </>
          )}
        </div>
      </div>

      <div className={shared.screenFooter}>
        <button onClick={onBack} className={`${shared.footerBtnSecondary} ${s.backBtn}`}>
          Retour
        </button>
        <button
          onClick={onStart}
          disabled={pool.length === 0}
          className={`${shared.footerBtnPrimary} ${s.startBtn}`}
        >
          {pool.length === 0 ? "Choisis un élément" : `Commencer · ${pool.length}`}
        </button>
      </div>
    </div>
  );
}
