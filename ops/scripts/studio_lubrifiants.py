"""studio_lubrifiants.py — image « studio » du secteur Huile moteur & lubrifiants (1600×900) :
packshots détourés du catalogue posés sur un fond de studio (dégradé, halo, sol brillant avec
reflet et ombres de contact). Composition exacte (étiquettes intactes, aucune IA), marges ≥ 7 %
pour que rien ne soit rogné, même avec le zoom au survol de la carte.

  python ops/scripts/studio_lubrifiants.py
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

RACINE = Path(__file__).resolve().parents[2]
PROD = RACINE / 'petrovoll-astro/src/assets/produits'
SORTIE = RACINE / 'petrovoll-astro/src/assets/secteurs/lubrifiants-studio.jpg'
L, H = 1600, 900
SOL = int(H * 0.80)          # ligne de pose des produits
# (fichier, hauteur relative, décalage horizontal du centre en fraction de L) — du fond vers l'avant
RANG = [
    ('hydkon-hydraulic', 0.40, 0.165),
    ('d-tec-mineral', 0.44, 0.835),
    ('motpro-4t', 0.44, 0.33),
    ('stark-semi-synthetic', 0.44, 0.67),
    ('stark-fully-synthetic', 0.52, 0.50),
]


def fond():
    y, x = np.mgrid[0:H, 0:L].astype(np.float32)
    haut = np.array([22, 30, 46], np.float32)        # bleu nuit (charte du site)
    bas = np.array([8, 11, 18], np.float32)
    t = np.clip(y / H, 0, 1)[..., None]
    img = haut * (1 - t) + bas * t
    halo = np.exp(-(((x - L * 0.5) / (L * 0.42)) ** 2 + ((y - H * 0.42) / (H * 0.45)) ** 2))[..., None]
    img += halo * np.array([70, 78, 92], np.float32)     # lumière douce derrière les produits
    sol = (y > SOL - 2)[..., None] * np.clip((y - SOL) / (H - SOL), 0, 1)[..., None]
    img = img * (1 - 0.35 * sol)
    return Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).convert('RGBA')


def produit(nom, h):
    im = Image.open(PROD / f'{nom}.webp').convert('RGBA')
    im = im.crop(im.getchannel('A').getbbox())
    return im.resize((round(im.width * h / im.height), h), Image.LANCZOS)


def main():
    img = fond()
    for nom, hr, cx in RANG:
        p = produit(nom, int(H * hr))
        x, y = int(L * cx - p.width / 2), SOL - p.height
        # ombre de contact
        ombre = Image.new('RGBA', img.size, (0, 0, 0, 0))
        e = Image.new('L', (int(p.width * 1.1), int(p.height * 0.08)), 0)
        from PIL import ImageDraw
        ImageDraw.Draw(e).ellipse((0, 0, e.width, e.height), fill=200)
        ombre.paste((0, 0, 0, 255), (x - int(p.width * 0.05), SOL - e.height // 2), e)
        img.alpha_composite(ombre.filter(ImageFilter.GaussianBlur(10)))
        # reflet sur le sol brillant (retourné, fondu)
        r = p.transpose(Image.FLIP_TOP_BOTTOM)
        a = np.asarray(r.getchannel('A'), np.float32) * np.linspace(0.28, 0, r.height)[:, None]
        r.putalpha(Image.fromarray(a.astype(np.uint8)))
        img.alpha_composite(r.filter(ImageFilter.GaussianBlur(1.5)), (x, SOL + 2))
        img.alpha_composite(p, (x, y))
    # vignette légère + grain très fin (rendu photo)
    v = np.asarray(img.convert('RGB'), np.float32)
    yy, xx = np.mgrid[0:H, 0:L].astype(np.float32)
    vig = 1 - 0.28 * (((xx - L / 2) / (L / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2)
    v = v * np.clip(vig, 0.6, 1)[..., None] + np.random.default_rng(1).normal(0, 2.2, v.shape)
    Image.fromarray(np.clip(v, 0, 255).astype(np.uint8)).save(SORTIE, quality=90)
    print(SORTIE, Image.open(SORTIE).size)


if __name__ == '__main__':
    main()
