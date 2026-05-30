import { NOTES, CHROMATIC_NOTES, NOTES_DISPLAY_ORDER } from "../constants";
import shared from "./shared.module.css";
import s from "./NotesPicker.module.css";

export default function NotesPicker({ enabled, setEnabled, selectedNoteCount }) {
  const toggle = (id) => setEnabled((p) => ({ ...p, [id]: !p[id] }));

  const preset = (kind) => {
    if (kind === "none") {
      setEnabled((prev) => ({
        ...prev,
        ...Object.fromEntries([...NOTES, ...CHROMATIC_NOTES].map((n) => [n.id, false])),
      }));
    } else if (kind === "naturals") {
      setEnabled((prev) => ({
        ...prev,
        ...Object.fromEntries(NOTES.map((n) => [n.id, true])),
        ...Object.fromEntries(CHROMATIC_NOTES.map((n) => [n.id, false])),
      }));
    } else if (kind === "all") {
      setEnabled((prev) => ({
        ...prev,
        ...Object.fromEntries([...NOTES, ...CHROMATIC_NOTES].map((n) => [n.id, true])),
      }));
    }
  };

  return (
    <div className={s.wrapper}>
      <div className={s.sectionHeader}>
        <span className={shared.eyebrow}>Notes · {selectedNoteCount} choisies</span>
        <div className={s.segmented}>
          <button className={s.seg} onClick={() => preset("none")}>Aucune</button>
          <button className={s.seg} onClick={() => preset("naturals")}>Naturelles</button>
          <button className={s.seg} onClick={() => preset("all")}>Toutes</button>
        </div>
      </div>

      <div className={s.keyboard}>
        {/* Accidentals row — one slot per natural key, empty spacer for Mi and Si */}
        <div className={s.accidentalsRow}>
          {NOTES_DISPLAY_ORDER.map(({ natural, chromatic }) => (
            <div key={natural.id} className={s.accidentalSlot}>
              {chromatic ? (
                <button
                  onClick={() => toggle(chromatic[0].id)}
                  className={`${s.accKey} ${enabled[chromatic[0].id] ? s.keyOn : ""}`}
                >
                  {chromatic[0].label}
                </button>
              ) : null}
            </div>
          ))}
        </div>

        {/* Naturals row */}
        <div className={s.naturalsRow}>
          {NOTES_DISPLAY_ORDER.map(({ natural }) => (
            <button
              key={natural.id}
              onClick={() => toggle(natural.id)}
              className={`${s.natKey} ${enabled[natural.id] ? s.keyOn : ""}`}
            >
              {natural.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
