import { CHORDS } from "../constants";
import { formatTime } from "../util";
import { accuracyPercent } from "../stats";
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
  return (
    <div className={shared.section}>
      <div className={shared.sectionHeader}>
        <span className={shared.sectionLabel}>Accords</span>
        <button onClick={toggleAll} className={s.toggleAllBtn}>
          {allOn ? "Tout désélectionner" : "Tout sélectionner"}
        </button>
      </div>
      <div className={chip.grid}>
        {CHORDS.map((item) => (
          <button
            key={item.id}
            onClick={() => setEnabled((p) => ({ ...p, [item.id]: !p[item.id] }))}
            className={`${chip.chip} ${enabled[item.id] ? chip.chipOn : ""}`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ConfigView({
  interval, setInterval,
  enabled, setEnabled,
  tts, setTts,
  listening, setListening,
  pool, practiceTime, resetPracticeTime,
  stats, resetStats,
  onStart, showDebugLink, onShowDebug,
}) {
  const hasNotes = pool.some((item) => item.type === "note");
  const acc = accuracyPercent(stats);
  const hasStats = stats.totalSessions > 0;

  return (
    <div className={shared.configRoot}>
      {showDebugLink && (
        <button onClick={onShowDebug} className={s.debugBtn}>debug</button>
      )}
      <div className={shared.configInner}>
        <h1 className={shared.title}>Exercice Guitare</h1>
        <p className={shared.subtitle}>Trouve les notes et accords sur le manche</p>

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

        <NotesPicker enabled={enabled} setEnabled={setEnabled} />
        <ChordsGroup enabled={enabled} setEnabled={setEnabled} />

        <Toggle label="Annoncer à voix haute" value={tts} onChange={setTts} />
        <Toggle
          label="Détecter les notes (micro)"
          value={listening}
          onChange={setListening}
          disabled={!hasNotes}
        />
        {listening && hasNotes && (
          <div className={s.listenHint}>
            Notes uniquement · le texte change de couleur quand la bonne note est jouée
          </div>
        )}

        <button
          onClick={onStart}
          disabled={pool.length === 0}
          className={shared.startBtn}
        >
          {pool.length === 0
            ? "Sélectionne au moins un élément"
            : `Commencer (${pool.length} élément${pool.length > 1 ? "s" : ""})`}
        </button>

        {practiceTime > 0 && (
          <div className={s.practiceTimeBox}>
            <div className={s.practiceTimeValue}>{formatTime(practiceTime)}</div>
            <div className={s.practiceTimeSubRow}>
              <span className={s.practiceTimeLabel}>Temps de pratique</span>
              <button onClick={resetPracticeTime} className={shared.resetBtn}>
                Réinitialiser
              </button>
            </div>
          </div>
        )}

        {hasStats && (
          <div className={s.statsBox}>
            <div className={s.statsGrid}>
              <div className={s.statCell}>
                <div className={s.statValue}>{stats.bestStreak}</div>
                <div className={s.statLabel}>Meilleure série</div>
              </div>
              <div className={s.statCell}>
                <div className={s.statValue}>{stats.totalSessions}</div>
                <div className={s.statLabel}>Sessions</div>
              </div>
              <div className={s.statCell}>
                <div className={s.statValue}>{stats.totalCorrect}</div>
                <div className={s.statLabel}>Notes réussies</div>
              </div>
              <div className={s.statCell}>
                <div className={s.statValue}>{acc != null ? `${acc}%` : "—"}</div>
                <div className={s.statLabel}>Précision</div>
              </div>
            </div>
            <div className={s.statsFooter}>
              <span className={s.practiceTimeLabel}>Statistiques globales</span>
              <button onClick={resetStats} className={shared.resetBtn}>
                Réinitialiser
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
