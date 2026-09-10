"use client";

import Image from "next/image";

export function CandyBeadDivider() {
  return (
    <div className="absolute top-0 left-0 w-full h-12 md:h-20 -translate-y-1/2 overflow-hidden select-none pointer-events-none z-20">
      <div className="w-full h-full relative opacity-100">
        <Image
          src="/beads/footer-garland-ai.jpg"
          alt="Candy Bead Garland Divider"
          fill
          className="object-cover object-center drop-shadow-md mix-blend-multiply"
        />
      </div>
    </div>
  );
}
