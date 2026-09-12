import { useId } from "react";

type WeaponKind = "rifle" | "sniper" | "pistol" | "smg" | "heavy" | "knife" | "taser";

function kindOf(weapon: string): WeaponKind {
  const w = weapon.toLowerCase();
  if (w.includes("knife") || w.includes("karambit") || w.includes("bayonet")) return "knife";
  if (w.includes("awp") || w.includes("ssg") || w.includes("scar-20") || w.includes("g3sg1")) return "sniper";
  if (w.includes("zeus")) return "taser";
  if (w.includes("glock") || w.includes("usp") || w.includes("p250") || w.includes("p2000") || w.includes("five-seven") || w.includes("tec-9") || w.includes("desert eagle") || w.includes("revolver") || w.includes("berettas")) return "pistol";
  if (w.includes("mp") || w.includes("mac-10") || w.includes("p90") || w.includes("ump") || w.includes("bizon")) return "smg";
  if (w.includes("nova") || w.includes("xm1014") || w.includes("sawed-off") || w.includes("mag-7") || w.includes("negev") || w.includes("m249")) return "heavy";
  return "rifle";
}

function Shape({ kind }: { kind: WeaponKind }) {
  const common = { stroke: "rgba(0,0,0,0.5)", strokeWidth: 1.5 };
  switch (kind) {
    case "knife":
      return (
        <g {...common}>
          <path d="M8 40 C30 34 52 26 78 10 L88 4 L84 14 C70 32 45 44 20 48 Z" />
          <rect x="6" y="42" width="22" height="10" rx="3" transform="rotate(-12 17 47)" />
          <rect x="24" y="36" width="6" height="16" rx="2" transform="rotate(-12 27 44)" />
        </g>
      );
    case "pistol":
      return (
        <g {...common}>
          <rect x="14" y="20" width="56" height="14" rx="3" />
          <rect x="60" y="16" width="8" height="4" rx="1" />
          <path d="M22 34 L40 34 L36 58 L20 58 Z" />
          <rect x="44" y="34" width="10" height="12" rx="2" />
        </g>
      );
    case "smg":
      return (
        <g {...common}>
          <rect x="10" y="24" width="62" height="13" rx="3" />
          <rect x="70" y="27" width="16" height="6" rx="2" />
          <path d="M16 37 L30 37 L27 54 L15 54 Z" />
          <rect x="40" y="37" width="9" height="16" rx="2" />
          <rect x="4" y="27" width="8" height="8" rx="2" />
        </g>
      );
    case "heavy":
      return (
        <g {...common}>
          <rect x="8" y="24" width="70" height="14" rx="3" />
          <rect x="76" y="27" width="14" height="7" rx="2" />
          <path d="M8 26 L2 30 L2 40 L8 40 Z" />
          <rect x="34" y="38" width="12" height="18" rx="3" />
          <path d="M14 38 L26 38 L23 52 L13 52 Z" />
        </g>
      );
    case "sniper":
      return (
        <g {...common}>
          <rect x="6" y="26" width="76" height="11" rx="3" />
          <rect x="80" y="29" width="14" height="5" rx="2" />
          <rect x="34" y="16" width="24" height="8" rx="4" />
          <rect x="42" y="24" width="4" height="5" />
          <path d="M6 28 L0 32 L0 40 L8 38 Z" />
          <rect x="24" y="37" width="8" height="12" rx="2" />
          <path d="M48 37 L56 37 L54 48 L47 48 Z" />
        </g>
      );
    case "taser":
      return (
        <g {...common}>
          <rect x="28" y="18" width="34" height="16" rx="4" />
          <rect x="56" y="20" width="10" height="4" rx="1" />
          <rect x="56" y="27" width="10" height="4" rx="1" />
          <path d="M34 34 L50 34 L46 56 L32 56 Z" />
        </g>
      );
    default:
      return (
        <g {...common}>
          <rect x="10" y="25" width="66" height="12" rx="3" />
          <rect x="74" y="28" width="16" height="5" rx="2" />
          <path d="M10 27 L2 31 L2 39 L10 39 Z" />
          <path d="M34 37 L44 37 L41 56 L32 56 Z" />
          <rect x="50" y="37" width="8" height="10" rx="2" />
          <rect x="58" y="19" width="6" height="6" rx="1" />
        </g>
      );
  }
}

export default function WeaponIcon({ weapon, gradient, className }: { weapon: string; gradient: [string, string]; className?: string }) {
  const id = useId();
  const kind = kindOf(weapon);
  return (
    <svg viewBox="0 0 96 64" className={className} aria-hidden>
      <defs>
        <linearGradient id={`wg-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={gradient[0]} />
          <stop offset="100%" stopColor={gradient[1]} />
        </linearGradient>
      </defs>
      <g fill={`url(#wg-${id})`}>
        <Shape kind={kind} />
      </g>
    </svg>
  );
}
