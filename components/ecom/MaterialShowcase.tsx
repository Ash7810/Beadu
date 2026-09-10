"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { SectionBeads } from "./SectionBeads";

export function MaterialShowcase() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  const materials = [
    {
      title: "Sustainable Indian Wood",
      description: "Hand-turned Indian rosewood, ebony, and natural timber beads coated in organic protective wax.",
      tag: "Eco-Friendly Wood",
      image: "/beads/pomelli_photoshoot_image_9_16_0726 (2).png",
    },
    {
      title: "Fired Terracotta Clay",
      description: "Artisan clay disc and sphere beads molded by hand and kiln-fired in Jaipur pottery tradition.",
      tag: "Earth & Clay",
      image: "/beads/pomelli_photoshoot_image_9_16_0726 (4).png",
    },
    {
      title: "Luminescent Gemstones",
      description: "Natural green jade, cat's eye spheres, and crystal beads that catch light with every gesture.",
      tag: "Natural Stones",
      image: "/beads/pomelli_photoshoot_image_1_1_0726.png",
    },
  ];

  // Auto-swipe horizontal carousel timer for Authentic Craftsmanship cards
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      if (scrollRef.current && typeof window !== "undefined" && window.innerWidth < 768) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          scrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          scrollRef.current.scrollBy({ left: clientWidth * 0.8, behavior: "smooth" });
        }
      }
    }, 3200);

    return () => clearInterval(interval);
  }, [isPaused]);

  return (
    <section className="relative py-16 bg-white overflow-hidden">
      <SectionBeads variant="c" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <span className="text-xs uppercase font-bold tracking-widest text-primary font-heading">
            Authentic Craftsmanship
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl text-foreground font-normal">
            Pure Natural &amp; Sustainable Materials
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Every Beadu piece is handcrafted with love and care using natural materials—designed to celebrate individuality and emotion.
          </p>
        </div>

        {/* Auto-Swiping Authentic Craftsmanship Cards */}
        <div
          ref={scrollRef}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
          className="flex md:grid overflow-x-auto snap-x snap-mandatory md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 pb-4 no-scrollbar scroll-smooth"
        >
          {materials.map((mat, idx) => (
            <div
              key={idx}
              className="clay-panel p-6 flex flex-col justify-between shadow-sm w-[85vw] sm:w-[320px] md:w-auto shrink-0 snap-center bg-white rounded-3xl"
            >
              <div className="space-y-3 z-10 relative">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full inline-block">
                  {mat.tag}
                </span>
                <h3 className="font-heading text-xl text-foreground">{mat.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{mat.description}</p>
              </div>

              {/* Clean Image Container with inset outline for depth */}
              <div className="relative w-full aspect-square rounded-2xl overflow-hidden mt-6 bg-gray-50 z-0">
                <Image
                  src={mat.image}
                  alt={mat.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-black/[0.1] pointer-events-none" />
              </div>
            </div>
          ))}
        </div>

        {/* Custom Builder Banner */}
        <div className="mt-12 clay-panel relative overflow-hidden bg-gradient-to-r from-[#faf6f2]/80 via-[#f5e5b8]/50 to-[#faf6f2]/80 backdrop-blur-md p-8 sm:p-12 text-center space-y-4 border border-primary/20 ring-1 ring-black/[0.05] rounded-[2.5rem] shadow-sm">
          <div className="relative z-10">
            <h3 className="font-heading text-2xl sm:text-3xl text-foreground">
              Want to create your own signature bracelet?
            </h3>
            <p className="text-xs sm:text-sm text-foreground/80 font-medium max-w-xl mx-auto mb-6">
              Use our interactive digital customizer to arrange your choice of beads, spacers, and charms in real-time.
            </p>
            <div className="pt-2">
              <Link
                href="/builder"
                className="gold-shimmer text-on-primary-container font-bold text-xs sm:text-sm px-8 py-4 rounded-2xl inline-block shadow-md transition-transform duration-150 ease-out active:scale-[0.96]"
              >
                Open Custom Bracelet Builder →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
