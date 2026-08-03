"use client";

import { useEffect, useRef, useState } from "react";
import { PauseIcon, PlayIcon } from "@/components/ui/icons";

function fmt(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function AudioPlayer({
  src,
  durationSec,
}: {
  src: string;
  durationSec: number | null;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(durationSec ?? 0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setPosition(audio.currentTime);
    const onMeta = () => {
      // Chrome-recorded webm blobs report Infinity; keep the stored duration.
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };
    const onEnd = () => {
      setPlaying(false);
      setPosition(0);
    };
    // Track play state from the element's own events so OS-level interruptions
    // (calls, Siri, another player grabbing the session) stay in sync.
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnd);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnd);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
    };
  }, []);

  const progress = duration > 0 ? Math.min(position / duration, 1) : 0;

  return (
    <div className="flex items-center gap-3">
      <audio ref={audioRef} src={src} preload="metadata" />
      <button
        type="button"
        aria-label={playing ? "Pause" : "Play"}
        onClick={() => {
          const audio = audioRef.current;
          if (!audio) return;
          if (playing) audio.pause();
          else void audio.play().catch(() => {});
        }}
        className="pressable flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-tint-soft text-tint"
      >
        {playing ? <PauseIcon size={16} /> : <PlayIcon size={16} className="ml-0.5" />}
      </button>
      <div
        className="h-[5px] flex-1 cursor-pointer overflow-hidden rounded-full bg-fill"
        onClick={(e) => {
          const audio = audioRef.current;
          if (!audio || duration <= 0) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const ratio = (e.clientX - rect.left) / rect.width;
          audio.currentTime = ratio * duration;
          setPosition(audio.currentTime);
        }}
      >
        <div
          className="h-full rounded-full bg-tint transition-[width]"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <span className="tnum shrink-0 text-[12px] text-label-2">
        {playing || position > 0 ? fmt(position) : fmt(duration)}
      </span>
    </div>
  );
}
