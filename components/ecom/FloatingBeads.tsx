"use client";

import Image from "next/image";

export function FloatingBeads() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
      {/* Yellow Bead */}
      <div className="absolute top-[15%] left-[5%] w-8 h-8 sm:w-10 sm:h-10 md:w-16 md:h-16 md:animate-float-slow opacity-100 drop-shadow-sm rotate-12">
        <Image
          src="/beads/candy-bead-yellow-v2.png"
          alt="Yellow candy bead"
          fill
          sizes="(max-width: 768px) 36px, 64px"
          className="object-contain"
        />
      </div>

      {/* Blue Bead */}
      <div className="absolute top-[60%] left-[10%] w-8 h-8 sm:w-10 sm:h-10 md:w-14 md:h-14 md:animate-float-fast opacity-100 drop-shadow-sm -rotate-12">
        <Image
          src="/beads/candy-bead-blue-v2.png"
          alt="Blue candy bead"
          fill
          sizes="(max-width: 768px) 36px, 56px"
          className="object-contain"
        />
      </div>

      {/* Pink Bead */}
      <div className="absolute top-[25%] right-[8%] w-9 h-9 sm:w-11 sm:h-11 md:w-20 md:h-20 md:animate-float-medium opacity-100 drop-shadow-sm rotate-45">
        <Image
          src="/beads/candy-bead-pink-v2.png"
          alt="Pink candy bead"
          fill
          sizes="(max-width: 768px) 40px, 80px"
          className="object-contain"
        />
      </div>

      {/* Green Bead */}
      <div className="absolute top-[75%] right-[15%] w-8 h-8 sm:w-10 sm:h-10 md:w-16 md:h-16 md:animate-float-slow opacity-100 drop-shadow-sm -rotate-45">
        <Image
          src="/beads/candy-bead-green-v2.png"
          alt="Green candy bead"
          fill
          sizes="(max-width: 768px) 36px, 64px"
          className="object-contain"
        />
      </div>
      
      {/* Orange Bead */}
      <div className="absolute top-[85%] left-[25%] w-8 h-8 sm:w-10 sm:h-10 md:w-14 md:h-14 md:animate-float-fast opacity-100 drop-shadow-sm rotate-[120deg]">
        <Image
          src="/beads/candy-bead-orange-v2.png"
          alt="Orange candy bead"
          fill
          sizes="(max-width: 768px) 36px, 56px"
          className="object-contain"
        />
      </div>

      {/* Extra Pink Bead (scattered) */}
      <div className="absolute top-[45%] left-[45%] w-8 h-8 md:w-10 md:h-10 animate-float-medium opacity-60 drop-shadow-sm rotate-90 hidden md:block">
        <Image
          src="/beads/candy-bead-pink-v2.png"
          alt="Pink candy bead"
          fill
          sizes="40px"
          className="object-contain"
        />
      </div>
    </div>
  );
}
