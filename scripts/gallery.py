#!/usr/bin/env python3
"""Laura salón — gallery pipeline. Spúšťa sa lokálne, výstup sa commituje."""
import csv, sys
from pathlib import Path
from PIL import Image, ImageFilter, ImageOps
from rembg import new_session, remove

RAW_DIR = Path("raw")
OUT_DIR = Path("public/gallery")
DATA_OUT = Path("data/gallery.json")
MANIFEST = RAW_DIR / "gallery.csv"          # stĺpce: id,breed,service[,featured]
MODEL = "birefnet-general"                   # fallback: "isnet-general-use"
CANVAS_W, CANVAS_H = 1080, 1350              # 4:5
BG = (246, 241, 231)                         # #F6F1E7
MARGIN_TOP, MARGIN_BOTTOM = 0.10, 0.07
MAX_WIDTH_FRAC = 0.86
SHADOW_OPACITY, SHADOW_BLUR = 0.22, 22
QUALITY = 88

def process(src: Path, dst: Path, session) -> bool:
    img = ImageOps.exif_transpose(Image.open(src)).convert("RGBA")
    cut = remove(img, session=session, alpha_matting=True,
                 alpha_matting_foreground_threshold=240,
                 alpha_matting_background_threshold=15,
                 alpha_matting_erode_size=8)
    bbox = cut.getbbox()
    if not bbox:
        print(f"  !! {src.name}: model nenašiel subjekt — preskakujem"); return False
    dog = cut.crop(bbox)
    avail_h = CANVAS_H * (1 - MARGIN_TOP - MARGIN_BOTTOM)
    avail_w = CANVAS_W * MAX_WIDTH_FRAC
    scale = min(avail_h / dog.height, avail_w / dog.width)
    dog = dog.resize((max(1, round(dog.width*scale)), max(1, round(dog.height*scale))), Image.LANCZOS)
    canvas = Image.new("RGBA", (CANVAS_W, CANVAS_H), BG + (255,))
    x = (CANVAS_W - dog.width) // 2
    y = CANVAS_H - dog.height - round(CANVAS_H * MARGIN_BOTTOM)
    shadow = Image.new("RGBA", (CANVAS_W, CANVAS_H), (0,0,0,0))
    alpha = dog.split()[3].point(lambda a: int(a * SHADOW_OPACITY))
    sh = Image.new("RGBA", dog.size, (60,50,40,255)); sh.putalpha(alpha)
    shadow.paste(sh, (x, y + round(dog.height*0.02)), sh)
    shadow = shadow.filter(ImageFilter.GaussianBlur(SHADOW_BLUR))
    canvas = Image.alpha_composite(canvas, shadow)
    canvas.paste(dog, (x, y), dog)
    dst.parent.mkdir(parents=True, exist_ok=True)
    canvas.convert("RGB").save(dst, quality=QUALITY, optimize=True)
    print(f"  ✓ {src.name} → {dst.name}"); return True

def main() -> None:
    if not MANIFEST.exists():
        sys.exit(f"Chýba {MANIFEST} (stĺpce: id,breed,service[,featured])")
    session = new_session(MODEL)
    entries, errors = [], []
    with open(MANIFEST, encoding="utf-8") as f:
        rows = [r for r in csv.DictReader(f) if r.get("id","").strip()]
    for r in rows:
        gid = r["id"].strip()
        breed, service = r.get("breed","").strip(), r.get("service","").strip()
        featured = r.get("featured","").strip().lower() in ("1","true","ano","áno","yes")
        pair = {}
        for kind in ("before","after"):
            src = next((RAW_DIR/f"{gid}-{kind}{e}" for e in (".jpg",".jpeg",".png",".webp")
                        if (RAW_DIR/f"{gid}-{kind}{e}").exists()), None)
            if not src:
                errors.append(f"{gid}: chýba {kind}"); continue
            dst = OUT_DIR/f"{gid}-{kind}.jpg"
            if not (dst.exists() and dst.stat().st_mtime >= src.stat().st_mtime):
                if not process(src, dst, session):
                    errors.append(f"{gid}: zlyhalo {kind}"); continue
            else:
                print(f"  · {dst.name} aktuálne, preskakujem")
            pair[kind] = f"/gallery/{dst.name}"
        if "before" in pair and "after" in pair:
            entries.append({
                "id": gid, "breed": breed, "service": service, "featured": featured,
                "before": pair["before"], "after": pair["after"],
                "alt": f"{breed} — {service}".strip(" —"),
            })
    DATA_OUT.parent.mkdir(parents=True, exist_ok=True)
    import json
    DATA_OUT.write_text(json.dumps(entries, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nHotovo: {len(entries)} párov v {DATA_OUT}.")
    if errors:
        print("CHYBY:"); [print("  -", e) for e in errors]

if __name__ == "__main__":
    main()
