"""Planche contact des photos v3 : fond gris moyen, 6 colonnes, objets grands."""
import sys
from pathlib import Path
from PIL import Image, ImageDraw
ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "petrovoll-astro/src/assets/produits"
OUT = ROOT / "assets/catalogues/petrovoll/photos-v3/planche-contact.png"
T, COLS = 400, 6
fs = sorted(SRC.glob("*.webp"))
rows = (len(fs) + COLS - 1) // COLS
sh = Image.new("RGB", (COLS * T, rows * (T + 22)), (128, 128, 128))
d = ImageDraw.Draw(sh)
for k, f in enumerate(fs):
    im = Image.open(f).convert("RGBA").resize((T, T), Image.LANCZOS)
    x, y = (k % COLS) * T, (k // COLS) * (T + 22)
    sh.paste(im, (x, y + 22), im)
    d.text((x + 4, y + 5), f.stem, fill=(255, 255, 255))
OUT.parent.mkdir(parents=True, exist_ok=True)
sh.save(OUT)
