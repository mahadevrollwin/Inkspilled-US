"use client";

import { useEffect, useRef, useState } from "react";
import { REELS } from "@/lib/reels";

export function ReelsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [active, setActive] = useState(0);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    scrollerRef.current?.scrollTo(0, 0);
    setActive(0);
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    const root = scrollerRef.current;
    if (!open || !root) return;
    const slides = [...root.querySelectorAll<HTMLElement>("[data-reel-slide]")];
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const index = slides.indexOf(visible.target as HTMLElement);
        if (index >= 0) setActive(index);
      },
      { root, threshold: [0.6, 0.8] },
    );
    slides.forEach((slide) => observer.observe(slide));
    return () => observer.disconnect();
  }, [open]);

  return (
    <div
      id="reel"
      role="dialog"
      aria-modal="true"
      aria-label="Reels"
      aria-hidden={!open}
      inert={!open}
      className={`fixed inset-0 z-[25] bg-ink text-cream transition duration-500 ease-ink motion-reduce:transition-none ${open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
    >
      <div ref={scrollerRef} className={`h-full snap-y snap-mandatory overflow-y-auto overscroll-contain [scrollbar-width:none] transition duration-500 ease-ink motion-reduce:transition-none motion-reduce:transform-none [&::-webkit-scrollbar]:hidden ${open ? "translate-y-0" : "translate-y-6"}`}>
        {REELS.map((reel, index) => (
          <ReelSlide key={reel.id} reel={reel} index={index} count={REELS.length} playing={open && active === index} muted={muted} />
        ))}
      </div>
      <button ref={closeRef} type="button" className="font-mono fixed top-[calc(22px+env(safe-area-inset-top,0px))] right-[max(24px,env(safe-area-inset-right,0px))] z-[2] cursor-pointer rounded-full border-0 bg-cream px-6 py-4 text-[11.5px] font-medium tracking-[0.14em] text-ink uppercase" onClick={onClose}>
        Close
      </button>
      <button
        type="button"
        className="font-mono fixed bottom-[calc(22px+env(safe-area-inset-bottom,0px))] left-[max(24px,env(safe-area-inset-left,0px))] z-[2] cursor-pointer rounded-full border border-cream/40 bg-ink/40 px-4 py-2.5 text-[11px] font-medium tracking-[0.14em] text-cream uppercase backdrop-blur-md"
        onClick={() => setMuted((value) => !value)}
      >
        {muted ? "Sound off" : "Sound on"}
      </button>
    </div>
  );
}

function ReelSlide({
  reel,
  index,
  count,
  playing,
  muted,
}: {
  reel: (typeof REELS)[number];
  index: number;
  count: number;
  playing: boolean;
  muted: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = muted;
    if (!playing || paused) {
      video.pause();
      return;
    }
    video.play().catch(() => undefined);
  }, [playing, muted, paused]);

  useEffect(() => {
    if (!playing) setPaused(false);
  }, [playing]);

  return (
    <section data-reel-slide className="flex h-full snap-start snap-always items-center justify-center">
      <div className="relative h-full w-full overflow-hidden bg-black min-[901px]:h-[min(92%,860px)] min-[901px]:w-auto min-[901px]:aspect-[9/16] min-[901px]:rounded-[28px]">
        <video
          ref={videoRef}
          src={reel.src}
          playsInline
          loop
          muted={muted}
          preload="metadata"
          className="absolute inset-0 h-full w-full object-cover"
          onClick={() => {
            if (!playing) return;
            setPaused((value) => !value);
          }}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-[linear-gradient(transparent,rgba(12,10,11,.82))] px-5 pt-24 pb-8">
          <p className="label mb-2 text-cream/70">Inkspilled · {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}</p>
          <h2 className="font-display m-0 text-[clamp(22px,4.2vh,40px)] leading-[0.9] font-extrabold tracking-[-0.04em] text-balance uppercase">{reel.title}</h2>
          <p className="m-0 mt-2 max-w-[18em] text-[15px] text-cream/80">{reel.caption}</p>
          {index < count - 1 ? <p className="label mt-5 text-cream/60">Scroll for the next reel</p> : null}
        </div>
        {paused && playing ? (
          <span className="pointer-events-none absolute top-1/2 left-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-cream/90 text-ink">
            <span className="ml-1 block h-0 w-0 border-y-[9px] border-l-[14px] border-y-transparent border-l-ink" />
          </span>
        ) : null}
      </div>
    </section>
  );
}
