"""couvertures_secteurs.py — couvertures des métiers (cartes de l'accueil + pages secteurs), 21/10 : photos Pinterest choisies par Ben.

  python ops/scripts/couvertures_secteurs.py
Entrées dans ops/pinterest-secteurs/ : NOM.(jpg|png) et, si l'original est petit, NOM-x4.png (RealESRGAN deAPI, deapi.py agrandir-image).
Sortie : petrovoll-astro/src/assets/secteurs/NOM-studio.jpg, 2048×1152 (16:9, recadrage centré sur FOCALE).
"""
import glob
from pathlib import Path

import cv2
import numpy as np

RACINE = Path(__file__).resolve().parents[2]
SRC = RACINE / 'ops' / 'pinterest-secteurs'
SORTIE = RACINE / 'petrovoll-astro' / 'src' / 'assets' / 'secteurs'
FOCALE = {'transport': 0.5}   # position verticale du recadrage (0 haut, 1 bas) quand l'image est plus haute que 16:9
L, H = 2048, 1152


def recadrer(im, fy=0.5):
    h, l = im.shape[:2]
    hc = round(l * 9 / 16)
    if hc <= h:
        y0 = int((h - hc) * fy)
        return im[y0:y0 + hc]
    lc = round(h * 16 / 9)
    x0 = (l - lc) // 2
    return im[:, x0:x0 + lc]


for nom in ['lubrifiants', 'transport', 'distribution', 'pneumatiques', 'fournitures']:
    f = next(Path(p) for p in glob.glob(str(SRC / f'{nom}.*')) if p.endswith(('.jpg', '.png')) and not p.endswith('-x4.png'))
    im = recadrer(cv2.imread(str(f)), FOCALE.get(nom, 0.5))
    lanczos = cv2.resize(im, (L, H), interpolation=cv2.INTER_LANCZOS4).astype(np.float32)
    x4 = SRC / f'{nom}-x4.png'
    if x4.exists():
        g = cv2.resize(recadrer(cv2.imread(str(x4)), FOCALE.get(nom, 0.5)), (L, H), interpolation=cv2.INTER_AREA).astype(np.float32)
        lanczos = g * 0.65 + lanczos * 0.35
    cv2.imwrite(str(SORTIE / f'{nom}-studio.jpg'), np.clip(lanczos, 0, 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 88])
    print(nom, f.name, 'x4' if x4.exists() else '')
