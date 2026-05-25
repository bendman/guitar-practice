import { NOTES, CHROMATIC_NOTES, NOTES_DISPLAY_ORDER } from "../constants";
import shared from "./shared.module.css";
import s from "./ChipGroup.module.css";

export default function NotesPicker({ enabled, setEnabled }) {
  const toggle = (id) => setEnabled((p) => ({ ...p, [id]: !p[id] }));

  const setAll = (items, value) =>
    setEnabled((prev) => ({
      ...prev,
      ...Object.fromEntries(items.map((n) => [n.id, value])),
    }));

  const preset = (kind) => {
    if (kind === "none") setAll([...NOTES, ...CHROMATIC_NOTES], false);
    else if (kind === "naturals") {
      setEnabled((prev) => ({
        ...prev,
        ...Object.fromEntries(NOTES.map((n) => [n.id, true])),
        ...Object.fromEntries(CHROMATIC_NOTES.map((n) => [n.id, false])),
      }));
    } else if (kind === "all") setAll([...NOTES, ...CHROMATIC_NOTES], true);
  };

  const chipClass = (id) => `${s.chip} ${enabled[id] ? s.chipOn : ""}`;

  return (
    <div className={shared.section}>
      <div className={shared.sectionHeader}>
        <span className={shared.sectionLabel}>Notes</span>
        <div className={s.headerActions}>
          <button onClick={() => preset("none")} className={s.presetBtn}>Aucune</button>
          <span className={s.presetSep}>/</span>
          <button onClick={() => preset("naturals")} className={s.presetBtn}>Naturelles</button>
          <span className={s.presetSep}>/</span>
          <button onClick={() => preset("all")} className={s.presetBtn}>Toutes</button>
        </div>
      </div>
      <div className={`${s.grid} ${s.gridTight}`}>
        {NOTES_DISPLAY_ORDER.map(({ natural, chromatic }) => (
          <div key={natural.id} className={s.notesRow}>
            <button
              onClick={() => toggle(natural.id)}
              className={`${chipClass(natural.id)} ${s.chipNatural}`}
            >
              {natural.label}
            </button>
            {chromatic && (
              <div className={s.chromaticCol}>
                {chromatic.map((note) => (
                  <button
                    key={note.id}
                    onClick={() => toggle(note.id)}
                    className={`${chipClass(note.id)} ${s.chipChromatic}`}
                  >
                    {note.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
