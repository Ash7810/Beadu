"use client";

import Link from "next/link";
import Image from "next/image";
import { SectionBeads } from "./SectionBeads";

const CATEGORIES = [
  {
    name: "BRACELETS",
    image: "/beads/cat_banner_bracelets.png",
    href: "/shop?category=Bracelets",
    isCustomGraphic: true,
  },
  {
    name: "EARRINGS",
    image: "/beads/cat_banner_earrings.png",
    href: "/shop?category=Earrings",
    isCustomGraphic: true,
  },
  {
    name: "CROCHET EARRINGS",
    image: "/beads/cat_banner_crochet_earrings.png",
    href: "/shop?category=Crochet Earrings",
    isCustomGraphic: true,
  },
  {
    name: "KEYCHAINS",
    image: "/beads/cat_banner_keychains.png",
    href: "/shop?category=Keychains",
    isCustomGraphic: true,
  },
  {
    name: "TRINKET TRAYS",
    image: "/beads/cat_banner_trinket_trays.png",
    href: "/shop?category=Trinket Trays",
    isCustomGraphic: true,
  },
];

export function CategoryMarquee() {
  return (
    <section className="relative py-12 bg-white flex justify-center overflow-hidden">
      <SectionBeads variant="a" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 w-full">
        <div className="flex flex-wrap justify-center gap-6">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.name}
              href={cat.href}
              className="relative w-40 h-40 md:w-48 md:h-48 rounded-2xl overflow-hidden border border-border/60 ring-1 ring-black/10 shadow-sm transition-[transform,border-color] duration-150 ease-out active:scale-[0.96] hover:border-primary/40 flex-shrink-0 bg-white"
            >
              <Image
                src={cat.image}
                alt={cat.name}
                fill
                sizes="(max-width: 768px) 160px, 192px"
                className="object-cover"
              />
              {!cat.isCustomGraphic && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-3 bg-white/15 backdrop-blur-[1px]">
                  <span className="font-heading text-xl md:text-2xl text-black font-bold text-center tracking-wider drop-shadow-sm bg-white/80 backdrop-blur-xs px-3 py-1 rounded-lg ring-1 ring-black/5 rotate-[-3deg]">
                    {cat.name}
                  </span>
                  <span className="mt-6 text-[9px] uppercase tracking-widest text-black/90 font-bold bg-white/60 px-2 py-0.5 rounded-md">
                    Shop Now
                  </span>
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
