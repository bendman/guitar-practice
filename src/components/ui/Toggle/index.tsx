import s from "./index.module.css";

interface ToggleProps {
  label: string;
  sublabel?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

export default function Toggle({ label, sublabel, value, onChange, disabled = false }: ToggleProps) {
  const on = value && !disabled;
  return (
    <div className={`${s.row} ${disabled ? s.rowDisabled : ""}`}>
      <div className={s.labelGroup}>
        <span className={s.label}>{label}</span>
        {sublabel && <span className={s.sublabel}>{sublabel}</span>}
      </div>
      <button
        onClick={() => !disabled && onChange(!value)}
        disabled={disabled}
        aria-label={label}
        role="switch"
        aria-checked={value}
        className={`${s.track} ${on ? s.trackOn : ""}`}
      >
        <div className={`${s.knob} ${on ? s.knobOn : ""}`} />
      </button>
    </div>
  );
}
