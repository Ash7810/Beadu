import os
import re
import cv2
import numpy as np
from rembg import remove
from PIL import Image, ImageEnhance

INPUT_DIR = r"C:\Users\Lenovo\Desktop\BEADU FINAL LIST"
PUBLIC_BEADS_DIR = r"c:\Users\Lenovo\Downloads\bracelet-builder-starter\bracelet-builder-starter\bracelet-builder\public\beads"
FINAL_BEADS_DIR = os.path.join(PUBLIC_BEADS_DIR, "final_beads")
CATALOG_PATH = r"c:\Users\Lenovo\Downloads\bracelet-builder-starter\bracelet-builder-starter\bracelet-builder\lib\catalog.ts"

os.makedirs(FINAL_BEADS_DIR, exist_ok=True)

def parse_bead_filename(filename):
    name_no_ext = os.path.splitext(filename)[0]
    
    size_match = re.search(r'-(\d+)mm\)', name_no_ext, re.IGNORECASE)
    size_mm = int(size_match.group(1)) if size_match else 8

    title_part = re.sub(r'^\(\d+P?cs?-\d+mm\)\s*', '', name_no_ext, flags=re.IGNORECASE).strip()
    
    price = 5
    price_match = re.search(r'[\.\s]?(\d+(?:\.\d+)?)\s*(?:rs)?$', title_part, re.IGNORECASE)
    if price_match:
        parsed_p = float(price_match.group(1))
        if parsed_p > 0:
            price = parsed_p
        clean_title = title_part[:price_match.start()].strip()
    else:
        clean_title = title_part

    clean_title = re.sub(r'\s*\(\d+\)$', '', clean_title)
    clean_title = clean_title.title()

    title_lower = clean_title.lower()
    if "glass" in title_lower or "holographic" in title_lower:
        category = "glass"
        material = "Hand-Crafted Glass"
    elif "wood" in title_lower or "ebony" in title_lower or "palm" in title_lower:
        category = "wood"
        material = "Natural Wood"
    elif "marble" in title_lower or "raw" in title_lower:
        category = "stone"
        material = "Natural Stone"
    elif "acrylic" in title_lower:
        category = "acrylic"
        material = "Premium Acrylic"
    elif "cat eye" in title_lower:
        category = "crystal"
        material = "Cat Eye Gemstone"
    else:
        category = "accent"
        material = "Artisan Bead"

    return {
        "raw_title": title_part,
        "clean_title": clean_title,
        "size_mm": size_mm,
        "price": int(price) if price.is_integer() else price,
        "category": category,
        "material": material
    }

print("Parsing & processing pure rembg output (no bottom row clipping)...")
files = [f for f in os.listdir(INPUT_DIR) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
files.sort()

beads_data = []

for idx, fn in enumerate(files, 1):
    parsed = parse_bead_filename(fn)
    bead_id = f"bead-final-{idx:03d}"
    out_filename = f"{bead_id}.png"
    out_path = os.path.join(FINAL_BEADS_DIR, out_filename)
    rel_image_url = f"/beads/final_beads/{out_filename}"

    inp_path = os.path.join(INPUT_DIR, fn)
    print(f"[{idx}/{len(files)}] Processing {fn} -> {out_filename}")

    raw = Image.open(inp_path).convert("RGBA")
    # Pure rembg without harsh bottom clipping
    no_bg = remove(raw)

    # Slight contrast enhancement only
    polished = ImageEnhance.Contrast(no_bg).enhance(1.05)
    polished = ImageEnhance.Color(polished).enhance(1.05)

    alpha = polished.split()[-1]
    bbox = alpha.getbbox()
    if bbox:
        cropped = polished.crop(bbox)
        w, h = cropped.size
        # Use generous padding so edges are never clipped
        side = int(max(w, h) / 0.70)
        canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
        canvas.paste(cropped, ((side - w) // 2, (side - h) // 2))
        final_500 = canvas.resize((500, 500), Image.LANCZOS)
        final_500.save(out_path, "PNG")

    width_mm = parsed['size_mm']
    bead_size_ratio = round(width_mm / 8.0, 2)

    beads_data.append({
        "id": bead_id,
        "name": parsed["clean_title"],
        "category": parsed["category"],
        "price": parsed["price"],
        "material": parsed["material"],
        "imageUrl": rel_image_url,
        "isPremium": parsed["price"] >= 10,
        "rotationAllowed": True,
        "size": bead_size_ratio,
        "sizeMm": width_mm,
        "widthMm": width_mm,
        "active": True
    })

import json
js_beads_json = json.dumps(beads_data, indent=2)

final_catalog_ts = f'''import {{ Bead, PresetDesign }} from "./types";

// Real photoshoot beads — updated from BEADU FINAL LIST
export const INITIAL_BEADS: Bead[] = {js_beads_json};

export const PRESET_DESIGNS: PresetDesign[] = [
  {{
    id: "marble-emerald",
    title: "Marble Emerald Elegance",
    subtitle: "Marble Green & Accent",
    price: 150,
    tag: "Bestseller",
    description: "Striking Marble Green spheres paired with Candy and Holographic accents.",
    wristInches: 7.0,
    cordType: "elastic",
    beadIds: [
      "{beads_data[4]['id']}",
      "{beads_data[8]['id']}",
      "{beads_data[4]['id']}",
      "{beads_data[24]['id']}",
      "{beads_data[4]['id']}",
      "{beads_data[8]['id']}",
      "{beads_data[4]['id']}",
    ],
    image: "{beads_data[4]['imageUrl']}",
  }},
  {{
    id: "ocean-breeze",
    title: "Ocean Breeze & Wood",
    subtitle: "Wooden Round & Blue Marble",
    price: 120,
    tag: "Artisan Select",
    description: "Deep Marble Blue combined with Handcrafted Wooden beads.",
    wristInches: 7.5,
    cordType: "elastic",
    beadIds: [
      "{beads_data[3]['id']}",
      "{beads_data[25]['id']}",
      "{beads_data[3]['id']}",
      "{beads_data[50]['id']}",
      "{beads_data[3]['id']}",
      "{beads_data[25]['id']}",
      "{beads_data[3]['id']}",
    ],
    image: "{beads_data[3]['imageUrl']}",
  }},
  {{
    id: "candy-pop",
    title: "Candy Pop Rainbow",
    subtitle: "Vibrant Candy & Acrylic",
    price: 90,
    tag: "Trending",
    description: "Playful colorful candy round beads with evil eye charm accents.",
    wristInches: 6.5,
    cordType: "elastic",
    beadIds: [
      "{beads_data[8]['id']}",
      "{beads_data[9]['id']}",
      "{beads_data[10]['id']}",
      "{beads_data[0]['id']}",
      "{beads_data[11]['id']}",
      "{beads_data[12]['id']}",
    ],
    image: "{beads_data[8]['imageUrl']}",
  }}
];
'''

with open(CATALOG_PATH, "w", encoding="utf-8") as f:
    f.write(final_catalog_ts)

print("catalog.ts updated successfully with clean full bead images!")
