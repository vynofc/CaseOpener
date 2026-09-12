"use client";

import { useState } from "react";
import { Skin } from "@/lib/types";
import WeaponIcon from "./WeaponIcon";

const FALLBACK_GRADIENT: [string, string] = ["#3a4a6b", "#1c2438"];

export default function SkinImage({ skin, className, eager = false }: { skin: Skin; className?: string; eager?: boolean }) {
  const [failed, setFailed] = useState(false);

  if (!skin.image || failed) {
    return <WeaponIcon weapon={skin.weapon} gradient={skin.gradient ?? FALLBACK_GRADIENT} className={className} />;
  }

  return (
    <img
      src={skin.image}
      alt={`${skin.weapon} | ${skin.name}`}
      className={className}
      loading={eager ? "eager" : "lazy"}
      draggable={false}
      onError={() => setFailed(true)}
    />
  );
}
