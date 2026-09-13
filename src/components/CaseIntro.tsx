"use client";

import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";

export default function CaseIntro({ onDone, children }: { onDone: () => void; children?: ReactNode }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  const [ended, setEnded] = useState(false);
  const onDoneRef = useRef(onDone);
  const doneRef = useRef(false);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    setEnded(true);
    onDoneRef.current();
  }, []);

  const skip = useCallback(() => {
    if (doneRef.current) return;
    const video = videoRef.current;
    if (video && Number.isFinite(video.duration) && video.duration > 0) {
      try {
        video.currentTime = video.duration;
      } catch {}
      video.pause();
    }
    finish();
  }, [finish]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onTimeUpdate = () => {
      if (Number.isFinite(video.duration) && video.duration > 0 && video.currentTime >= video.duration - 1.5) {
        finish();
      }
    };
    video.addEventListener("ended", finish);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.play().catch(() => setFailed(true));
    return () => {
      video.removeEventListener("ended", finish);
      video.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, [finish]);

  useEffect(() => {
    if (failed) onDoneRef.current();
  }, [failed]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (doneRef.current) return;
      if (e.code === "Space" || e.key === "Escape") {
        e.preventDefault();
        skip();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [skip]);

  if (failed) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black">
        {children && <div className="overlay-rise w-full">{children}</div>}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 bg-black">
      <video
        ref={videoRef}
        src="/assets/video/opening.mp4"
        className="absolute inset-0 h-full w-full object-contain"
        playsInline
        preload="auto"
      />

      <div
        className={`pointer-events-none absolute inset-0 bg-black transition-opacity duration-700 ${
          ended ? "opacity-60" : "opacity-0"
        }`}
      />

      {ended && children && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <div className="overlay-rise w-full">{children}</div>
        </div>
      )}

      {!ended && (
        <button
          onClick={skip}
          className="absolute bottom-6 right-6 rounded-sm border border-white/25 bg-cs-800/80 hover:bg-cs-700 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-zinc-200 transition cursor-pointer"
        >
          Skip <kbd className="ml-1 rounded-sm border border-white/25 bg-black/40 px-1.5 py-0.5 text-[9px] font-bold">Space</kbd>
        </button>
      )}
    </div>
  );
}
