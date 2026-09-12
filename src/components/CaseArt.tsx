import { useId } from "react";

export default function CaseArt({
  gradient,
  accent,
  className,
}: {
  gradient: [string, string];
  accent: string;
  className?: string;
}) {
  const id = useId();
  return (
    <svg viewBox="0 0 64 48" className={className} aria-hidden>
      <defs>
        <linearGradient id={`cg-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={gradient[0]} />
          <stop offset="100%" stopColor={gradient[1]} />
        </linearGradient>
      </defs>
      <rect x="8" y="12" width="48" height="28" rx="4" fill={`url(#cg-${id})`} />
      <rect x="8" y="12" width="48" height="10" rx="4" fill="rgba(255,255,255,0.16)" />
      <rect x="26" y="6" width="12" height="10" rx="2" fill={accent} />
      <rect x="8" y="24" width="48" height="3" fill="rgba(0,0,0,0.3)" />
      <rect x="8" y="12" width="48" height="28" rx="4" fill="none" stroke={accent} strokeOpacity="0.6" />
    </svg>
  );
}
