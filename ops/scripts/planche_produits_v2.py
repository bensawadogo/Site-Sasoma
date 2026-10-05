"""Planche contact des photos produits (fond damier + étiquette). Sortie :
assets/catalogues/petrovoll/photos-v2/planche-contact.png
"""
from pathlib import Path
from PIL import Image, ImageDraw
ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "petrovoll-astro/src/assets/produits"
OUT = ROOT / "assets/catalogues/petrovoll/photos-v2/planche-contact.png"
fs = sorted(SRC.glob("*.webp"))
W, H, COLS = 300, 300, 7
rows = (len(fs) + COLS - 1) // COLS
S = Image.new("RGB", (COLS * W, rows * (H + 18)), (225, 228, 232))
d = ImageDraw.Draw(S)
for i, f in enumerate(fs):
    im = Image.open(f).convert("RGBA").resize((W, H), Image.LANCZOS)
    x, y = (i % COLS) * W, (i // COLS) * (H + 18)
    S.paste(im, (x, y + 18), im)
    d.text((x + 3, y + 3), f.stem, fill=(180, 0, 0))
S.save(OUT)
print(OUT, S.size)
