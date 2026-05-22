"use client";

import React, { KeyboardEvent, useState } from "react";

type LandingVideoProps = {
  videoId?: string;
  title?: string;
  className?: string;
};

export default function LandingVideo({
  videoId = "1mu-9UXh1mg",
  title = "বিস্তারিত জানতে ভিডিওটি দেখুন",
  className = "",
}: LandingVideoProps) {
  const [playing, setPlaying] = useState(false);
  const [thumbnailSrc, setThumbnailSrc] = useState(
    `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
  );

  const start = () => setPlaying(true);

  const onKey: (e: KeyboardEvent<HTMLButtonElement>) => void = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      start();
    }
  };

  return (
    <div
      className={`w-full rounded-3xl border border-cyan-200/18 bg-gradient-to-br from-slate-900/85 via-[#162430]/88 to-[#102c31]/72 p-2 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-2 ${className}`}
    >
      <p className="mb-2 text-center text-sm font-bold text-amber-300 drop-shadow-[0_0_10px_rgba(251,191,36,0.25)] sm:mb-2.5 sm:text-base">
        {title}
      </p>

      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black">
        {!playing ? (
          <>
            <img
              src={thumbnailSrc}
              alt={title}
              className="absolute inset-0 h-full w-full object-cover"
              onError={() => {
                if (thumbnailSrc.includes("maxresdefault")) {
                  setThumbnailSrc(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`);
                }
              }}
            />

            <button
              type="button"
              aria-label="Play video"
              onClick={start}
              onKeyDown={onKey}
              className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-red-500/95 text-white shadow-lg transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 sm:h-14 sm:w-14"
            >
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path d="M5 3v18l15-9L5 3z" fill="currentColor" />
              </svg>
            </button>

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </>
        ) : (
          <iframe
            className="absolute left-0 top-0 h-full w-full border-0"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        )}
      </div>
    </div>
  );
}
