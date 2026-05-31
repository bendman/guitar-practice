interface IconProps {
  name: string;
  size?: number;
}

export default function Icon({ name, size = 18 }: IconProps) {
  const p = {
    width: size, height: size, viewBox: "0 0 24 24",
    fill: "none", stroke: "currentColor", strokeWidth: 2,
    strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
    style: { display: "block", flexShrink: 0 },
  };
  switch (name) {
    case "pause":   return <svg {...p}><rect x="7" y="5" width="3.2" height="14" rx="1" fill="currentColor" stroke="none"/><rect x="13.8" y="5" width="3.2" height="14" rx="1" fill="currentColor" stroke="none"/></svg>;
    case "play":    return <svg {...p}><path d="M7 5l12 7-12 7V5z" fill="currentColor" stroke="none"/></svg>;
    case "stop":    return <svg {...p}><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none"/></svg>;
    case "next":    return <svg {...p}><path d="M5 12h13"/><path d="M13 6l6 6-6 6"/></svg>;
    case "check":   return <svg {...p} strokeWidth="2.6"><path d="M5 13l4.5 4.5L19 6"/></svg>;
    case "x":       return <svg {...p} strokeWidth="2.6"><path d="M6 6l12 12M18 6L6 18"/></svg>;
    case "eye":     return <svg {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>;
    case "eye-off": return <svg {...p}><path d="M9.9 4.2A10 10 0 0112 4c6.5 0 10 7 10 7a17 17 0 01-3 3.8M6.2 6.2A17 17 0 002 11s3.5 7 10 7a10 10 0 004-.8"/><path d="M3 3l18 18"/></svg>;
    case "chevL":   return <svg {...p}><path d="M15 6l-6 6 6 6"/></svg>;
    case "chevR":   return <svg {...p}><path d="M9 6l6 6-6 6"/></svg>;
    case "note":    return <svg {...p}><circle cx="7" cy="18" r="3"/><path d="M10 18V5l9-2v11"/><circle cx="16" cy="16" r="3"/></svg>;
    case "chord":   return <svg {...p} strokeWidth="1.5"><path d="M5 4v16M9.5 4v16M14.5 4v16M19 4v16M5 9h14M5 15h14"/></svg>;
    case "arrow":   return <svg {...p}><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg>;
    default: return null;
  }
}
