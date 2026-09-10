"use client";

import Image from "next/image";

interface SectionBeadsProps {
  variant: "a" | "b" | "c";
  className?: string;
}

export function SectionBeads({ variant, className = "" }: SectionBeadsProps) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none select-none z-20 ${className}`}>
      {variant === "a" && (
        <>
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 lg:left-12 w-8 h-8 sm:w-10 sm:h-10 md:w-14 md:h-14 md:animate-float-slow opacity-100 drop-shadow-sm rotate-12">
            <Image src="/beads/candy-bead-yellow-v2.png" alt="Decorative Bead" fill sizes="(max-width: 768px) 36px, 56px" className="object-contain" />
          </div>
          <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 lg:right-12 w-9 h-9 sm:w-11 sm:h-11 md:w-16 md:h-16 md:animate-float-medium opacity-100 drop-shadow-sm -rotate-45">
            <Image src="/beads/candy-bead-pink-v2.png" alt="Decorative Bead" fill sizes="(max-width: 768px) 40px, 64px" className="object-contain" />
          </div>
        </>
      )}

      {variant === "b" && (
        <>
          <div className="absolute top-3 right-3 sm:top-6 sm:right-6 lg:right-16 w-8 h-8 sm:w-10 sm:h-10 md:w-14 md:h-14 md:animate-float-fast opacity-100 drop-shadow-sm -rotate-12">
            <Image src="/beads/candy-bead-blue-v2.png" alt="Decorative Bead" fill sizes="(max-width: 768px) 36px, 56px" className="object-contain" />
          </div>
          <div className="absolute bottom-3 left-3 sm:bottom-6 sm:left-6 lg:left-16 w-9 h-9 sm:w-11 sm:h-11 md:w-16 md:h-16 md:animate-float-slow opacity-100 drop-shadow-sm rotate-[120deg]">
            <Image src="/beads/candy-bead-orange-v2.png" alt="Decorative Bead" fill sizes="(max-width: 768px) 40px, 64px" className="object-contain" />
          </div>
        </>
      )}

      {variant === "c" && (
        <>
          <div className="absolute top-3 left-3 sm:top-8 sm:left-8 lg:left-20 w-8 h-8 sm:w-10 sm:h-10 md:w-14 md:h-14 md:animate-float-medium opacity-100 drop-shadow-sm rotate-45">
            <Image src="/beads/candy-bead-green-v2.png" alt="Decorative Bead" fill sizes="(max-width: 768px) 36px, 56px" className="object-contain" />
          </div>
          <div className="absolute bottom-3 right-3 sm:bottom-8 sm:right-8 lg:right-20 w-9 h-9 sm:w-11 sm:h-11 md:w-16 md:h-16 md:animate-float-slow opacity-100 drop-shadow-sm -rotate-12">
            <Image src="/beads/candy-bead-yellow-v2.png" alt="Decorative Bead" fill sizes="(max-width: 768px) 40px, 64px" className="object-contain" />
          </div>
        </>
      )}
    </div>
  );
}
