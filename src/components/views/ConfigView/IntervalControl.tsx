import shared from "../../shared.module.css";
import s from "./index.module.css";

interface IntervalControlProps {
  interval: number;
  setInterval: (v: number) => void;
}

export default function IntervalControl({ interval, setInterval }: IntervalControlProps) {
  return (
    <div className={s.intervalSection}>
      <div className={s.intervalHeader}>
        <span className={shared.eyebrow}>Intervalle</span>
        <span className={s.intervalValue}>{interval.toFixed(1)}s</span>
      </div>
      <div className={s.sliderWrap}>
        <input
          type="range"
          aria-label="Intervalle"
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
