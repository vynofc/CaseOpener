"use client";

import { useState } from "react";

export default function MenuBackdrop() {
  const [src, setSrc] = useState("/assets/img/menu-bg.webp");

  return (
    <div className="fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <img
        src={src}
        alt=""
        onError={() => {
          if (src !== "/assets/img/menu-bg.svg") setSrc("/assets/img/menu-bg.svg");
        }}
        className="h-full w-full object-cover scale-105 blur-[2px]"
        draggable={false}
      />
      <div className="absolute inset-0 bg-cs-950/72" />
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse 90% 70% at 50% 30%, transparent 40%, rgba(6,8,12,0.75) 100%)" }}
      />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/60 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/70 to-transparent" />
    </div>
  );
}
