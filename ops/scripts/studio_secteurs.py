"""studio_secteurs.py — images « studio » des métiers composées à partir des packshots du catalogue
(même plateau que studio_lubrifiants.py : bleu nuit, halo, sol brillant, reflets, ombres de contact).
Aucune IA : étiquettes et marquages intacts ; marges ≥ 7 % pour que rien ne soit rogné.

  python ops/scripts/studio_secteurs.py [pneumatiques] [distribution]
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, str(Path(__file__).parent))
from studio_lubrifiants import H, L, SOL, fond  # noqa: E402

RACINE = Path(__file__).resolve().parents[2]
NOUV = RACINE / 'petrovoll-astro/src/assets/produits/nouveaux'
SECTEURS = RACINE / 'petrovoll-astro/src/assets/secteurs'

# (fichier, hauteur relative, centre en fraction de L) — du fond vers l'avant
SCENES = {
    'pneumatiques': [
        ('pneu-double-road-dr638-1', 0.58, 0.20),
        ('pneu-longmarch-lm526-1', 0.58, 0.80),
        ('pneu-double-road-dr802-1', 0.62, 0.40),
        ('pneu-double-road-dr636-1', 0.62, 0.60),
    ],
    'distribution': [
        ('filtres-air-poids-lourds-1', 0.50, 0.12),
        ('filtre-scania-1852005-1', 0.40, 0.88),
        ('filtre-huile-cat-1r-1807-1', 0.44, 0.28),
        ('filtres-daf-1', 0.46, 0.72),
        ('filtre-carburant-perkins-1', 0.34, 0.42),
        ('filtre-separateur-pl420-1', 0.40, 0.585),
        ('filtre-carburant-cat-1r-0750-1', 0.30, 0.50),
    ],
}


def produit(nom, h):
    im = Image.open(NOUV / f'{nom}.webp').convert('RGBA')
    im = im.crop(im.getchannel('A').getbbox())
    return im.resize((round(im.width * h / im.height), h), Image.LANCZOS)


def composer(nom_scene):
    img = fond()
    for nom, hr, cx in SCENES[nom_scene]:
        p = produit(nom, int(H * hr))
        x, y = int(L * cx - p.width / 2), SOL - p.height
        ombre = Image.new('RGBA', img.size, (0, 0, 0, 0))
        e = Image.new('L', (int(p.width * 1.1), max(8, int(p.height * 0.08))), 0)
        ImageDraw.Draw(e).ellipse((0, 0, e.width, e.height), fill=210)
        ombre.paste((0, 0, 0, 255), (x - int(p.width * 0.05), SOL - e.height // 2), e)
        img.alpha_composite(ombre.filter(ImageFilter.GaussianBlur(10)))
        r = p.transpose(Image.FLIP_TOP_BOTTOM)
        a = np.asarray(r.getchannel('A'), np.float32) * np.linspace(0.26, 0, r.height)[:, None]
        r.putalpha(Image.fromarray(a.astype(np.uint8)))
        img.alpha_composite(r.filter(ImageFilter.GaussianBlur(1.5)), (x, SOL + 2))
        img.alpha_composite(p, (x, y))
    v = np.asarray(img.convert('RGB'), np.float32)
    yy, xx = np.mgrid[0:H, 0:L].astype(np.float32)
    vig = 1 - 0.28 * (((xx - L / 2) / (L / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2)
    v = v * np.clip(vig, 0.6, 1)[..., None] + np.random.default_rng(1).normal(0, 2.2, v.shape)
    sortie = SECTEURS / f'{nom_scene}-studio.jpg'
    Image.fromarray(np.clip(v, 0, 255).astype(np.uint8)).save(sortie, quality=90)
    print(sortie)


if __name__ == '__main__':
    for s in sys.argv[1:] or list(SCENES):
        composer(s)
