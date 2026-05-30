const FILLS = [
  'transparent',
  'linear-gradient(to top, var(--accent) 33%, transparent 33%)',
  'linear-gradient(to top, var(--accent) 67%, transparent 67%)',
  'var(--accent)',
];

export default function ProgressDot({ level = 0, size = 10 }) {
  return (
    <span style={{
      display: 'inline-block',
      width: size,
      height: size,
      borderRadius: '50%',
      flexShrink: 0,
      background: FILLS[level] ?? 'transparent',
      boxShadow: level === 3
        ? 'inset 0 0 0 1.5px var(--accent), 0 0 5px var(--accent-glow)'
        : `inset 0 0 0 1.5px ${level > 0 ? 'var(--accent)' : 'var(--text-faint)'}`,
      transition: 'background 0.12s ease, box-shadow 0.12s ease',
    }} />
  );
}
