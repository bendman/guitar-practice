import Icon from "../ui/Icon";
import s from "./session.module.css";

export type CtrlVariant = "primary" | "secondary" | "accent-line" | "danger-line" | "danger";

export interface BtnSpec {
  key: string;
  icon: string;
  label: string;
  variant?: CtrlVariant;
  onClick: () => void;
  disabled?: boolean;
}

const VARIANT_CLASS: Record<CtrlVariant, string> = {
  primary: s.ctrlBtnPrimary,
  secondary: s.ctrlBtnSecondary,
  "accent-line": s.ctrlBtnAccentLine,
  "danger-line": s.ctrlBtnDangerLine,
  danger: s.ctrlBtnDanger,
};

export default function ControlBar({ buttons }: { buttons: BtnSpec[] }) {
  return (
    <div className={s.controlBar}>
      {buttons.map(({ key, icon, label, variant = "secondary", onClick, disabled }) => (
        <button
          key={key}
          onClick={disabled ? undefined : onClick}
          disabled={disabled}
          className={`${s.ctrlBtn} ${VARIANT_CLASS[variant]}`}
        >
          <span className={s.ctrlIcon}>
            <Icon name={icon} size={20} />
          </span>
          <span className={s.ctrlLabel}>{label}</span>
        </button>
      ))}
    </div>
  );
}
