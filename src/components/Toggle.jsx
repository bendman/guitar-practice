import s from "./Toggle.module.css";

export default function Toggle({ label, value, onChange, disabled = false }) {
  const on = value && !disabled;
  return (
    <div className={`${s.row} ${disabled ? s.rowDisabled : ""}`}>
      <span className={s.label}>{label}</span>
      <button
        onClick={() => !disabled && onChange(!value)}
        disabled={disabled}
        className={`${s.track} ${on ? s.trackOn : ""}`}
      >
        <div className={`${s.knob} ${on ? s.knobOn : ""}`} />
      </button>
    </div>
  );
}
