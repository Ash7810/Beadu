"use client";

import { useEffect, useRef } from "react";
import { MOCK_REVIEWS } from "@/lib/ecomData";
import { SectionBeads } from "./SectionBeads";

export function CustomerReviews() {
  const marqueeRef = useRef<HTMLDivElement>(null);
  const isPausedRef = useRef(false);

  // Smooth continuous requestAnimationFrame flow loop (Flows continuously like water)
  useEffect(() => {
    const el = marqueeRef.current;
    if (!el) return;

    let animId: number;

    const scroll = () => {
      if (!isPausedRef.current && el) {
        el.scrollLeft += 0.6; // Continuous sub-pixel water flow speed
        if (el.scrollLeft >= el.scrollWidth / 3) {
          el.scrollLeft = 0;
        }
      }
      animId = requestAnimationFrame(scroll);
    };

    animId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Triple review array for infinite seamless water flow loop
  const tripleReviews = [...MOCK_REVIEWS, ...MOCK_REVIEWS, ...MOCK_REVIEWS];

  return (
    <section className="relative py-16 bg-white font-sans select-none overflow-hidden border-t border-border/40">
      <SectionBeads variant="a" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
        <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
          <span className="text-xs uppercase font-bold tracking-widest text-primary font-heading">
            Community Love
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl text-foreground font-normal">
            Loved by Jewelry Enthusiasts
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Read what our verified buyers say about Beadu pieces.
          </p>
        </div>

        {/* Continuous Flowing Reviews Ribbon (Flows continuously like water on ALL screens) */}
        <div
          ref={marqueeRef}
          onMouseEnter={() => (isPausedRef.current = true)}
          onMouseLeave={() => (isPausedRef.current = false)}
          onTouchStart={() => (isPausedRef.current = true)}
          onTouchEnd={() => {
            setTimeout(() => {
              isPausedRef.current = false;
            }, 1200);
          }}
          className="flex overflow-x-auto no-scrollbar gap-6 py-4 px-2 cursor-grab active:cursor-grabbing"
        >
          {tripleReviews.map((rev, idx) => (
            <div
              key={`${rev.id}-${idx}`}
              className="clay-panel p-6 bg-white flex flex-col justify-between space-y-4 w-[280px] sm:w-[320px] md:w-[360px] shrink-0 border border-border/60 ring-1 ring-black/10 shadow-xs"
            >
              {/* Star Rating Bar */}
              <div className="flex items-center justify-between tabular-nums">
                <div className="flex text-amber-500 text-sm tracking-widest">
                  {"★".repeat(rev.rating)}
                </div>
                <span className="text-[10px] text-muted-foreground font-semibold">
                  {rev.date}
                </span>
              </div>

              {/* Title & Comment */}
              <div className="space-y-2 flex-1">
                <h4 className="font-heading text-base font-medium text-foreground text-balance">
                  &ldquo;{rev.title}&rdquo;
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed italic text-pretty">
                  &ldquo;{rev.comment}&rdquo;
                </p>
              </div>

              {/* User Meta */}
              <div className="pt-4 border-t border-border/40 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-foreground">{rev.userName}</p>
                  <p className="text-[10px] text-muted-foreground truncate max-w-[180px]">
                    Verified: {rev.productName}
                  </p>
                </div>
                <span className="bg-green-500/10 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  ✓ Verified
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
