#!/usr/bin/env python3
"""
Bead Photo Prep Script
-----------------------
Fixes the two issues flagged in the catalog review:
  1. Inconsistent framing/zoom across bead photos
  2. No standardized square crop for the app's bead grid

What this does NOT do: remove backgrounds. That step still needs
remove.bg or Cloudinary's auto-removal add-on (see notes at bottom) —
this script handles the crop/resize/CSV part only.

USAGE:
    pip install pillow --break-system-packages
    python scripts/bead_photo_prep.py /path/to/raw_photos /path/to/output_folder

INPUT:  a folder of bead photos (jpg/png), any size, any zoom level
OUTPUT: a folder of square-cropped, uniformly-sized PNGs, ready for
        background removal, plus a starter beads.csv with filenames
        pre-filled so you just fill in name/category/price/widthMm.
"""

import os
import sys
import csv
from PIL import Image, ImageOps

# ---- Settings ----------------------------------------------------
OUTPUT_SIZE = 500          # final square size in pixels (width = height)
SUBJECT_FILL_PERCENT = 0.55  # how much of the frame the bead should
                              # fill after crop — tune if beads look
                              # too small/large relative to the frame
SUPPORTED_EXT = font_ext = (".jpg", ".jpeg", ".png", ".webp")
# --------------------------------------------------------------------


def find_subject_bbox(img: Image.Image) -> tuple:
    """
    Estimate the bead's bounding box by finding non-background pixels.
    Works best when the background is a single flat color (as in your
    current photos). Falls back to a center-crop if detection fails.
    """
    gray = img.convert("L")
    # Sample the corner pixel as the background color reference
    bg_value = gray.getpixel((2, 2))
    threshold = 18  # how far a pixel can differ from bg and still
                     # count as "background" — raise if edges get cut

    width, height = gray.size
    pixels = gray.load()

    min_x, min_y, max_x, max_y = width, height, 0, 0
    found = False

    # Scan a downsampled grid for speed on large images
    step = max(1, width // 300)
    for x in range(0, width, step):
        for y in range(0, height, step):
            if abs(pixels[x, y] - bg_value) > threshold:
                found = True
                min_x, max_x = min(min_x, x), max(max_x, x)
                min_y, max_y = min(min_y, y), max(max_y, y)

    if not found:
        # Nothing detected — fall back to a safe center region
        cx, cy = width // 2, height // 2
        half = min(width, height) // 4
        return (cx - half, cy - half, cx + half, cy + half)

    return (min_x, min_y, max_x, max_y)


def process_image(path: str, output_path: str):
    img = Image.open(path).convert("RGBA")
    bg = Image.new("RGBA", img.size, img.getpixel((2, 2)))
    # flatten onto detected bg color to avoid alpha edge artifacts
    img = Image.alpha_composite(bg, img) if img.mode == "RGBA" else img

    left, top, right, bottom = find_subject_bbox(img)
    subj_w, subj_h = right - left, bottom - top
    cx, cy = (left + right) // 2, (top + bottom) // 2

    # Expand the crop box so the bead fills SUBJECT_FILL_PERCENT of frame
    subject_size = max(subj_w, subj_h)
    crop_size = int(subject_size / SUBJECT_FILL_PERCENT)

    half = crop_size // 2
    crop_box = (cx - half, cy - half, cx + half, cy + half)

    # Pad if the crop box goes outside the image bounds
    cropped = ImageOps.expand(
        img,
        border=max(0, half - min(cx, cy, img.width - cx, img.height - cy)),
        fill=img.getpixel((2, 2)),
    )
    # Recompute crop box after padding
    pad = max(0, half - min(cx, cy, img.width - cx, img.height - cy))
    crop_box = (
        cx - half + pad, cy - half + pad,
        cx + half + pad, cy + half + pad,
    )

    cropped = cropped.crop(crop_box)
    resized = cropped.resize((OUTPUT_SIZE, OUTPUT_SIZE), Image.LANCZOS)
    resized.convert("RGB").save(output_path, "PNG")


def main():
    if len(sys.argv) != 3:
        print("Usage: python bead_photo_prep.py <input_folder> <output_folder>")
        sys.exit(1)

    input_dir, output_dir = sys.argv[1], sys.argv[2]
    os.makedirs(output_dir, exist_ok=True)

    files = sorted(
        f for f in os.listdir(input_dir)
        if f.lower().endswith(SUPPORTED_EXT)
    )

    if not files:
        print(f"No images found in {input_dir}")
        sys.exit(1)

    csv_rows = []
    print(f"Processing {len(files)} images...\n")

    for i, filename in enumerate(files, 1):
        input_path = os.path.join(input_dir, filename)
        out_filename = f"bead_{i:03d}.png"
        output_path = os.path.join(output_dir, out_filename)

        try:
            process_image(input_path, output_path)
            print(f"  [{i}/{len(files)}] {filename} -> {out_filename}")
            csv_rows.append({
                "name": "",              # fill in: e.g. "Rose Quartz Sphere"
                "category": "",          # fill in: gold / silver / crystal / etc
                "price": "0",            # fill in: 0 if free-tier, else premium price
                "material": "",          # fill in: e.g. "glass", "resin"
                "isPremium": "false",    # fill in: true/false
                "rotationAllowed": "false",
                "widthMm": "",           # REQUIRED: measure with digital calipers
                "filename": out_filename,
            })
        except Exception as e:
            print(f"  [{i}/{len(files)}] FAILED on {filename}: {e}")

    csv_path = os.path.join(output_dir, "beads.csv")
    with open(csv_path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "name", "category", "price", "material",
            "isPremium", "rotationAllowed", "widthMm", "filename",
        ])
        writer.writeheader()
        writer.writerows(csv_rows)

    print(f"\nDone. {len(csv_rows)} images processed.")
    print(f"Cropped images: {output_dir}/")
    print(f"Starter CSV:    {csv_path}")
    print("\nNEXT STEPS:")
    print("1. Open beads.csv and fill in name/category/price/material/widthMm")
    print("   for each row (widthMm = real caliper measurement, in mm)")
    print("2. Run these images through remove.bg or Cloudinary's background")
    print("   removal add-on before final upload — this script does NOT")
    print("   remove backgrounds, only crops/resizes consistently")
    print("3. Feed the finished folder + beads.csv into bulk-upload-beads.ts")
    print("   from the bracelet-builder-starter project")


if __name__ == "__main__":
    main()
