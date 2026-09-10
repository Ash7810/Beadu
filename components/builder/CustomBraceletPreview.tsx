"use client";

import { useMemo } from "react";
import { PlacedBead } from "@/lib/types";

export const FALLBACK_BRACELET_IMAGE = "/beads/pomelli_photoshoot_image_1_1_0726.png";

export function generateBraceletPreviewSvg(beads: PlacedBead[], size = 280): string {
  if (!beads || beads.length === 0) return FALLBACK_BRACELET_IMAGE;

  const centerX = size / 2;
  const centerY = size / 2;
  const rx = size * 0.38;
  const ry = size * 0.18; // Realistic 3D angled ellipse perspective
  const beadCount = beads.length;

  const beadElements = beads
    .map((bead, idx) => {
      const angle = (idx / beadCount) * (2 * Math.PI) - Math.PI / 2;
      const bx = centerX + rx * Math.cos(angle);
      const by = centerY + ry * Math.sin(angle);
      const dx = -rx * Math.sin(angle);
      const dy = ry * Math.cos(angle);
      const tangentAngle = (Math.atan2(dy, dx) * (180 / Math.PI)).toFixed(1);
      const beadSize = Math.max(26, Math.min(size * 0.25, 42));

      return `<g transform="translate(${bx.toFixed(1)}, ${by.toFixed(1)}) rotate(${tangentAngle})">
      <image href="${bead.imageUrl}" x="${(-beadSize / 2).toFixed(1)}" y="${(-beadSize / 2).toFixed(1)}" width="${beadSize.toFixed(1)}" height="${beadSize.toFixed(1)}" />
    </g>`;
    })
    .join("");

  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" rx="20" fill="#ffffff" />
    <ellipse cx="${centerX}" cy="${centerY}" rx="${rx}" ry="${ry}" fill="none" stroke="#d4af37" stroke-width="2" stroke-dasharray="4 3" opacity="0.6" />
    <g filter="drop-shadow(0 6px 10px rgba(0, 0, 0, 0.18))">
      ${beadElements}
    </g>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
}

export function CustomBraceletPreview({
  beads = [],
  previewImage,
  size = 64,
}: {
  beads?: PlacedBead[];
  previewImage?: string;
  size?: number;
}) {
  // useMemo MUST be called unconditionally (rules-of-hooks)
  const imgSrc = useMemo(() => {
    // If previewImage exists and is NOT a blank/empty SVG data URI
    if (
      previewImage &&
      previewImage.startsWith("data:image/svg+xml") &&
      (previewImage.includes("%3Cg%20filter%3D%22drop-shadow%22%3E%0A%20%20%20%20%20%20%3C%2Fg%3E") ||
        previewImage.includes("%3Cg%20filter%3D%22drop-shadow%22%3E%3C%2Fg%3E") ||
        !previewImage.includes("href="))
    ) {
      return FALLBACK_BRACELET_IMAGE;
    }

    if (previewImage && previewImage.length > 0 && !previewImage.startsWith("data:image/svg+xml")) {
      return previewImage;
    }

    return FALLBACK_BRACELET_IMAGE;
  }, [previewImage]);

  // If beads array is passed and has items, render live React SVG DOM directly for 100% reliable image rendering
  if (beads && beads.length > 0) {
    const centerX = 140;
    const centerY = 140;
    const rx = 106;
    const ry = 50;
    const beadCount = beads.length;

    return (
      <div
        style={{ width: size, height: size }}
        className="relative rounded-2xl overflow-hidden border border-border/80 ring-1 ring-black/10 bg-white shrink-0 shadow-xs flex items-center justify-center p-1 group"
      >
        <svg viewBox="0 0 280 280" className="w-full h-full object-contain">
          <rect width="280" height="280" rx="20" fill="#ffffff" />
          <ellipse
            cx={centerX}
            cy={centerY}
            rx={rx}
            ry={ry}
            fill="none"
            stroke="#d4af37"
            strokeWidth="2"
            strokeDasharray="4 3"
            opacity="0.6"
          />
          <g className="drop-shadow-md">
            {beads.map((bead, idx) => {
              const angle = (idx / beadCount) * (2 * Math.PI) - Math.PI / 2;
              const bx = centerX + rx * Math.cos(angle);
              const by = centerY + ry * Math.sin(angle);
              const dx = -rx * Math.sin(angle);
              const dy = ry * Math.cos(angle);
              const tangentAngle = (Math.atan2(dy, dx) * (180 / Math.PI)).toFixed(1);
              const beadSize = Math.max(26, Math.min(280 * 0.25, 42));

              return (
                <g
                  key={idx}
                  transform={`translate(${bx.toFixed(1)}, ${by.toFixed(1)}) rotate(${tangentAngle})`}
                >
                  <image
                    href={bead.imageUrl}
                    x={-beadSize / 2}
                    y={-beadSize / 2}
                    width={beadSize}
                    height={beadSize}
                  />
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className="relative rounded-2xl overflow-hidden border border-border/80 ring-1 ring-black/10 bg-white shrink-0 shadow-xs flex items-center justify-center p-1 group"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imgSrc}
        alt="Custom Bracelet Strand Preview"
        className="w-full h-full object-cover"
      />
    </div>
  );
}
