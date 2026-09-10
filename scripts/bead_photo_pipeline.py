#!/usr/bin/env python3
"""
Master Bead Photo Pipeline — Shadow Blob Stripper & Studio Polish
------------------------------------------------------------------
1. AI Background Removal (rembg u2net model)
2. Bottom-Up Ground Shadow Blob Stripping (color discontinuity & luminance profiling)
3. Studio Color Vibrancy (+15%), Contrast (+12%), and Edge Sharpness (+15%)
4. Shape-Preserving Bounding Box Centering (fill ratio 65%)
5. Uniform 500x500 Transparent PNG Output
6. Starter beads.csv Metadata Generation

USAGE:
    python scripts/bead_photo_pipeline.py <input_folder> <output_folder>
"""

import os
import sys
import csv
import cv2
import numpy as np
from rembg import remove
from PIL import Image, ImageEnhance

if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# ---- Global Configuration -------------------------------------------
OUTPUT_SIZE = 500            # Final square canvas size in pixels (500x500)
SUBJECT_FILL_PERCENT = 0.65  # Proportion of 500px frame occupied by bead
SUPPORTED_EXT = (".jpg", ".jpeg", ".png", ".webp")
# --------------------------------------------------------------------


def remove_ground_shadow_blob(img_rgba: Image.Image) -> Image.Image:
    """
    Detects and eliminates cast ground shadow blobs at the bottom of beads.
    Scans rows upward in the lower portion of the object using color discontinuity.
    """
    arr = np.array(img_rgba, dtype=np.uint8)
    h_img, w_img, _ = arr.shape
    r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]

    mask = (a > 20).astype(np.uint8) * 255
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return img_rgba

    c = max(contours, key=cv2.contourArea)
    bx, by, bw, bh = cv2.boundingRect(c)

    lum = (0.299 * r + 0.587 * g + 0.114 * b).astype(np.float32)

    # Upper/middle body average color & luminance (top 50%)
    body_y_end = by + int(bh * 0.50)
    body_m = (mask[by:body_y_end, bx:bx+bw] > 0)
    if np.any(body_m):
        body_r = np.mean(r[by:body_y_end, bx:bx+bw][body_m])
        body_g = np.mean(g[by:body_y_end, bx:bx+bw][body_m])
        body_b = np.mean(b[by:body_y_end, bx:bx+bw][body_m])
    else:
        body_r, body_g, body_b = 120, 120, 120

    scan_y_start = by + int(bh * 0.62)
    cut_y = by + bh

    # Scan upwards row by row from bottom
    for y in range(by + bh - 1, scan_y_start, -1):
        row_m = (mask[y, bx:bx+bw] > 0)
        if not np.any(row_m):
            continue

        r_row = r[y, bx:bx+bw][row_m]
        g_row = g[y, bx:bx+bw][row_m]
        b_row = b[y, bx:bx+bw][row_m]
        lum_row = lum[y, bx:bx+bw][row_m]

        avg_r_row = np.mean(r_row)
        avg_g_row = np.mean(g_row)
        avg_b_row = np.mean(b_row)
        avg_lum_row = np.mean(lum_row)

        color_diff = np.sqrt((avg_r_row - body_r)**2 + (avg_g_row - body_g)**2 + (avg_b_row - body_b)**2)

        # Shadow blob condition:
        # Dark luminance (lum < 80) OR significant color deviation from bead body (color_diff > 45 & lum < 110)
        is_shadow_row = (avg_lum_row < 80) or (color_diff > 45 and avg_lum_row < 110)

        if is_shadow_row:
            cut_y = y
        else:
            break

    new_a = a.copy()
    if cut_y < by + bh:
        new_a[cut_y:, :] = 0

    arr[:, :, 3] = new_a
    cleaned = Image.fromarray(arr, mode="RGBA")

    # Polish contrast (+12%), color saturation (+15%), sharpness (+15%)
    polished = ImageEnhance.Contrast(cleaned).enhance(1.12)
    polished = ImageEnhance.Color(polished).enhance(1.15)
    polished = ImageEnhance.Sharpness(polished).enhance(1.15)

    return polished


def crop_to_alpha_bounds(img: Image.Image) -> Image.Image:
    """
    Crops cleanly to alpha bounding box and centers in a 500x500 square frame.
    """
    alpha = img.split()[-1]
    bbox = alpha.getbbox()

    if bbox is None:
        return img.resize((OUTPUT_SIZE, OUTPUT_SIZE), Image.LANCZOS)

    left, top, right, bottom = bbox
    subj_w, subj_h = right - left, bottom - top
    cx, cy = (left + right) // 2, (top + bottom) // 2

    subject_size = max(subj_w, subj_h)
    crop_size = int(subject_size / SUBJECT_FILL_PERCENT)
    half = crop_size // 2

    crop_box = [cx - half, cy - half, cx + half, cy + half]

    pad_left = max(0, -crop_box[0])
    pad_top = max(0, -crop_box[1])
    pad_right = max(0, crop_box[2] - img.width)
    pad_bottom = max(0, crop_box[3] - img.height)

    if any([pad_left, pad_top, pad_right, pad_bottom]):
        padded = Image.new(
            "RGBA",
            (img.width + pad_left + pad_right, img.height + pad_top + pad_bottom),
            (0, 0, 0, 0),
        )
        padded.paste(img, (pad_left, pad_top))
        crop_box[0] += pad_left
        crop_box[1] += pad_top
        crop_box[2] += pad_left
        crop_box[3] += pad_top
        img = padded

    cropped = img.crop(tuple(crop_box))
    return cropped.resize((OUTPUT_SIZE, OUTPUT_SIZE), Image.LANCZOS)


def process_image(input_path: str, output_path: str):
    """Full single image pipeline."""
    original = Image.open(input_path).convert("RGBA")
    no_bg = remove(original)                         # 1. AI BG Removal
    shadow_free = remove_ground_shadow_blob(no_bg)  # 2. Shadow Blob Stripper & Polish
    cropped = crop_to_alpha_bounds(shadow_free)      # 3. Silhouette Bbox Crop & 500x500 resize
    cropped.save(output_path, "PNG")


def main():
    if len(sys.argv) != 3:
        print("Usage: python bead_photo_pipeline.py <input_folder> <output_folder>")
        sys.exit(1)

    input_dir, output_dir = sys.argv[1], sys.argv[2]
    os.makedirs(output_dir, exist_ok=True)

    files = sorted(
        f for f in os.listdir(input_dir)
        if f.lower().endswith(SUPPORTED_EXT)
    )

    if not files:
        print(f"[ERROR] No images found in {input_dir}")
        sys.exit(1)

    print(f"Master Bead Pipeline: Processing {len(files)} photos (Shadow-Free & Polished)...")

    csv_rows = []
    failed = []

    for i, filename in enumerate(files, 1):
        input_path = os.path.join(input_dir, filename)
        out_filename = f"bead_{i:03d}.png"
        output_path = os.path.join(output_dir, out_filename)

        try:
            process_image(input_path, output_path)
            print(f"  [{i}/{len(files)}] [OK] {filename} -> {out_filename}")
            csv_rows.append({
                "name": "",
                "category": "",
                "price": "0",
                "material": "",
                "isPremium": "false",
                "rotationAllowed": "false",
                "widthMm": "",
                "filename": out_filename,
                "original_filename": filename,
            })
        except Exception as e:
            print(f"  [{i}/{len(files)}] [FAILED] {filename}: {e}")
            failed.append(filename)

    csv_path = os.path.join(output_dir, "beads.csv")
    with open(csv_path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "name", "category", "price", "material",
            "isPremium", "rotationAllowed", "widthMm",
            "filename", "original_filename",
        ])
        writer.writeheader()
        writer.writerows(csv_rows)

    print(f"\nDone! {len(csv_rows)} of {len(files)} images processed successfully.")
    if failed:
        print(f"Failed files: {', '.join(failed)}")
    print(f"Output Images: {output_dir}/")
    print(f"Starter CSV:   {csv_path}")


if __name__ == "__main__":
    main()
