"use client";

import Link from "next/link";
import Image from "next/image";
import { SectionBeads } from "./SectionBeads";

export function HeroSection() {
  return (
    <section className="relative w-full bg-white flex flex-col items-center pt-8 pb-12 overflow-hidden">
      <SectionBeads variant="b" />
      {/* Wavy Banner Container */}
      <div className="relative z-10 w-full max-w-7xl mx-auto h-[400px] md:h-[500px] flex items-center justify-center">
        {/* Wavy Top SVG */}
        <div className="absolute top-0 left-0 w-full z-20 pointer-events-none">
          <svg viewBox="0 0 1440 120" className="w-full h-auto text-white fill-current" preserveAspectRatio="none">
            <path d="M0,0 C240,100 480,120 720,80 C960,40 1200,60 1440,0 L1440,0 L0,0 Z"></path>
          </svg>
        </div>

        {/* Wavy Bottom SVG */}
        <div className="absolute bottom-0 left-0 w-full z-20 pointer-events-none rotate-180">
          <svg viewBox="0 0 1440 120" className="w-full h-auto text-white fill-current" preserveAspectRatio="none">
            <path d="M0,0 C240,100 480,120 720,80 C960,40 1200,60 1440,0 L1440,0 L0,0 Z"></path>
          </svg>
        </div>

        {/* Background Image */}
        <Image
          src="/hero-artisan-crafts.jpg"
          alt="Beadu Artisanal Jewellery"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center z-0"
        />
        <div className="absolute inset-0 bg-white/20 z-[1] pointer-events-none" />

        {/* Text and Button Overlay */}
        <div className="relative z-30 flex flex-col items-center text-center px-4 max-w-3xl">
          <h1
            className="font-heading text-4xl md:text-5xl lg:text-6xl text-foreground mb-6 font-semibold tracking-wide"
            style={{ textShadow: "0 2px 8px rgba(255,255,255,0.9), 0 0 16px rgba(255,255,255,0.8)" }}
          >
            Handmade with Love, Crafted with Care
          </h1>
          <Link
            href="/shop"
            className="bg-primary text-white px-8 py-3 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-[transform,background-color] duration-150 ease-out active:scale-[0.96] shadow-md ring-1 ring-black/10 inline-block"
          >
            See What&apos;s New
          </Link>
        </div>
      </div>

      {/* Description Text Below Banner */}
      <div className="max-w-4xl mx-auto px-6 text-center mt-10">
        <p className="text-gray-600 font-medium leading-relaxed font-sans text-sm md:text-base">
          Discover handmade jewellery in India by Beadu. Shop wooden, glass & clay earrings, bracelets, keychains, necklaces, cute magnets, charms & trinkets— handmade with love by artisans ✨
        </p>
      </div>
    </section>
  );
}

