"use client";

import { useEffect, useRef, useState } from "react";

export default function CaseIntro({ onDone }: { onDone: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const finish = () => onDoneRef.current();
    video.addEventListener("ended", finish);
    video.play().catch(() => setFailed(true));
    return () => video.removeEventListener("ended", finish);
  }, []);

  useEffect(() => {
    if (failed) onDoneRef.current();
  }, [failed]);

  if (failed) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
      <video
        ref={videoRef}
        src="/assets/opening.mp4"
        className="max-h-[80vh] max-w-full rounded-xl shadow-2xl"
        playsInline
        preload="auto"
      />
      <button
        onClick={() => onDoneRef.current()}
        className="absolute bottom-6 right-6 rounded-lg border border-zinc-600 bg-zinc-800/80 hover:bg-zinc-700 px-4 py-2 text-sm font-bold text-zinc-200 transition cursor-pointer"
      >
        Überspringen ⏭
      </button>
    </div>
  );
}
