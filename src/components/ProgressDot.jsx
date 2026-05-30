const FILLS = [
  'transparent',
  'linear-gradient(to top, var(--accent) 33%, transparent 33%)',
  'linear-gradient(to top, var(--accent) 67%, transparent 67%)',
  'var(--accent)',
];

const FILLS_DIM = [
  'transparent',
  'linear-gradient(to top, var(--text-faint) 33%, transparent 33%)',
  'linear-gradient(to top, var(--text-faint) 67%, transparent 67%)',
  'var(--text-faint)',
];

export default function ProgressDot({ level = 0, size = 12, dim = false }) {
  const fills = dim ? FILLS_DIM : FILLS;
  const ring = dim
    ? 'inset 0 0 0 1.5px var(--text-faint)'
    : level === 3
      ? 'inset 0 0 0 1.5px var(--accent), 0 0 5px var(--accent-glow)'
      : `inset 0 0 0 1.5px ${level > 0 ? 'var(--accent)' : 'var(--text-faint)'}`;
  return (
    <span style={{
      display: 'inline-block',
      width: size,
      height: size,
      borderRadius: '50%',
      flexShrink: 0,
      background: fills[level] ?? 'transparent',
      boxShadow: ring,
      transition: 'background 0.12s ease, box-shadow 0.12s ease',
      opacity: dim ? 0.45 : 1,
    }} />
  );
}
