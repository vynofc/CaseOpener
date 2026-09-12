"use client";

import { useState } from "react";
import { CaseData } from "@/lib/types";
import { caseImagePath } from "@/lib/case-images";
import CaseArt from "./CaseArt";

export default function CaseImage({
  caseData,
  className,
  eager = false,
}: {
  caseData: CaseData;
  className?: string;
  eager?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const src = caseImagePath(caseData.id);

  if (!src || failed) {
    return <CaseArt gradient={caseData.gradient} accent={caseData.accent} className={className} />;
  }

  return (
    <img
      src={src}
      alt={caseData.name}
      className={className}
      loading={eager ? "eager" : "lazy"}
      draggable={false}
      onError={() => setFailed(true)}
    />
  );
}
