"""maquette_hero_moteur.py — exemple de rendu du hero sur une photo de fond : moteur K1 détouré posé
sur la route, bidon Starck incliné qui verse l'huile dans le goulot (ordinateur 1440×810 + téléphone 390×844).

  python ops/scripts/maquette_hero_moteur.py DOSSIER A B C …
Photo X.jpg|png|webp (ou X-ordi.* + X-tel.*). Écrit DOSSIER/moteur-rendu-X.jpg et DOSSIER/moteur-planche.jpg.
Moteur : ops/captures/hero-client/moteur-k1-detoure.png (K1 + studio_photo, détouré rembg).
"""
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy.ndimage import binary_fill_holes

sys.path.insert(0, str(Path(__file__).parent))
from maquette_hero import BIDON, degrade, police, recadrer  # noqa: E402

RACINE = Path(__file__).resolve().parents[2]
GOULOT = (0.20, 0.015)   # goulot de remplissage dans le moteur détouré (fraction largeur, hauteur)
INCLINAISON = 58         # degrés, sens antihoraire : le bouchon descend vers la gauche


def moteur_plein():
    m = Image.open(RACINE / 'ops/captures/hero-client/moteur-k1-detoure.png').convert('RGBA')
    a = np.asarray(m.getchannel('A')) > 128
    plein = binary_fill_holes(a)
    trous = plein & ~a                              # jours de la coupe : fond sombre, pas la route
    px = np.asarray(m).copy()
    px[trous] = (10, 12, 16, 255)
    return Image.fromarray(px)


MOTEUR = moteur_plein()


def bouchon(im):
    """Point le plus bas du bouchon rouge (sortie de l'huile) dans l'image du bidon."""
    px = np.asarray(im).astype(int)
    rouge = (px[..., 0] > 150) & (px[..., 1] < 80) & (px[..., 2] < 80) & (px[..., 3] > 200)
    ys, xs = np.nonzero(rouge)
    i = ys.argmax()
    return xs[i], ys[i]


def coller(fond, img, x, y, ombre=0.5, flou=14, dx=10, dy=16):
    o = Image.new('RGBA', img.size, (0, 0, 0, 0))
    o.putalpha(img.getchannel('A').point(lambda v: int(v * ombre)))
    o = o.filter(ImageFilter.GaussianBlur(flou))
    fond.paste(o, (x + dx, y + dy), o)
    fond.paste(img, (x, y), img)


def filet(fond, a, b, largeur):
    """Filet d'huile doré de a vers b, avec halo."""
    calque = Image.new('RGBA', fond.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(calque)
    pts = []
    for i in range(41):
        t = i / 40
        # chute légèrement courbe (vitesse initiale vers la gauche)
        x = a[0] + (b[0] - a[0]) * (1 - (1 - t) ** 2)
        y = a[1] + (b[1] - a[1]) * t
        pts.append((x, y))
    d.line(pts, fill=(255, 170, 40, 120), width=largeur * 3)
    halo = calque.filter(ImageFilter.GaussianBlur(largeur * 1.5))
    fond.alpha_composite(halo)
    c = Image.new('RGBA', fond.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(c)
    d.line(pts, fill=(214, 140, 20, 255), width=largeur)
    d.line([(x - largeur * 0.2, y) for x, y in pts], fill=(255, 225, 140, 230), width=max(1, largeur // 3))
    fond.alpha_composite(c)


def scene(photo, l, h, telephone):
    fond, _ = recadrer(photo, l, h)
    fond = degrade(fond, haut=0.2, bas=0.42).convert('RGBA')
    # moteur posé sur la route
    hm = int(h * (0.42 if not telephone else 0.24))
    mo = MOTEUR.resize((int(MOTEUR.width * hm / MOTEUR.height), hm), Image.LANCZOS)
    mx = (l - mo.width) // 2 - (int(l * 0.06) if not telephone else 0)
    my = int(h * (0.88 if not telephone else 0.64)) - hm
    # ombre de contact elliptique sous le moteur
    ombre = Image.new('RGBA', fond.size, (0, 0, 0, 0))
    ImageDraw.Draw(ombre).ellipse((mx + mo.width * 0.04, my + hm * 0.9, mx + mo.width * 0.98, my + hm * 1.08), fill=(0, 0, 0, 170))
    fond.alpha_composite(ombre.filter(ImageFilter.GaussianBlur(hm * 0.05)))
    coller(fond, mo, mx, my, ombre=0.35, flou=18, dx=0, dy=8)
    goulot = (mx + mo.width * GOULOT[0], my + hm * GOULOT[1])
    # bidon incliné au-dessus, à droite du goulot
    hb = int(h * (0.30 if not telephone else 0.19))
    b = BIDON.resize((int(BIDON.width * hb / BIDON.height), hb), Image.LANCZOS).rotate(INCLINAISON, Image.BICUBIC, expand=True)
    bx, by = bouchon(b)
    ecart = h * (0.09 if not telephone else 0.07)   # hauteur de chute
    x = int(goulot[0] + l * (0.035 if not telephone else 0.05) - bx)
    y = int(goulot[1] - ecart - by)
    coller(fond, b, x, y, ombre=0.45)
    filet(fond, (x + bx, y + by + 2), goulot, max(3, int(h * 0.006)))
    fond = fond.convert('RGB')
    # menu et titre (mêmes éléments que la maquette simple)
    d = ImageDraw.Draw(fond)
    d.rectangle((0, 0, l, 56 if not telephone else 48), fill=(255, 255, 255))
    d.text((24, 12), 'SASOMA', font=police('bebas-neue-400.woff2', 34 if not telephone else 28), fill=(18, 40, 90))
    if not telephone:
        menu = police('inter-variable.woff2', 13)
        for i, t in enumerate(['PRODUITS', 'NOS MÉTIERS', 'À PROPOS', 'CONTACT']):
            d.text((l * 0.42 + i * 105, 21), t, font=menu, fill=(60, 60, 70))
        d.rectangle((l - 120, 10, l - 24, 46), fill=(204, 85, 0))
        d.text((l - 92, 20), 'DEVIS', font=police('inter-variable.woff2', 14), fill='white')
    sur = police('inter-variable.woff2', 13 if not telephone else 11)
    titre = police('bebas-neue-400.woff2', 70 if not telephone else 44)
    x0, y0 = (int(l * 0.60), int(h * 0.80)) if not telephone else (20, int(h * 0.70))
    lignes = ['PETROVÖLL AU', 'BURKINA FASO']
    d.text((x0, y0 - 28), 'LUBRIFIANTS ALLEMANDS DEPUIS 1999', font=sur, fill=(242, 190, 60))
    for i, t in enumerate(lignes):
        d.text((x0, y0 - 6 + i * titre.size * 0.92), t, font=titre, fill='white')
    return fond


def main(dossier, noms):
    dossier = Path(dossier)
    trouver = lambda b: next((dossier / f'{b}{e}' for e in ('.jpg', '.png', '.webp') if (dossier / f'{b}{e}').exists()), None)
    vignettes = []
    for n in noms:
        photo = Image.open(trouver(n) or trouver(f'{n}-ordi')).convert('RGB')
        photo_tel = Image.open(trouver(f'{n}-tel')).convert('RGB') if trouver(f'{n}-tel') else photo
        p = Image.new('RGB', (1440 + 20 + 390, 844), (30, 30, 30))
        p.paste(scene(photo, 1440, 810, False), (0, 17))
        p.paste(scene(photo_tel, 390, 844, True), (1460, 0))
        p.save(dossier / f'moteur-rendu-{n}.jpg', quality=88)
        v = p.resize((p.width // 3, p.height // 3), Image.LANCZOS)
        ImageDraw.Draw(v).text((8, 22), n, font=police('bebas-neue-400.woff2', 30), fill=(255, 220, 0))
        vignettes.append(v)
    w, h = vignettes[0].size
    tout = Image.new('RGB', (2 * (w + 8), ((len(vignettes) + 1) // 2) * (h + 8)), (15, 15, 15))
    for i, v in enumerate(vignettes):
        tout.paste(v, ((i % 2) * (w + 8), (i // 2) * (h + 8)))
    tout.save(dossier / 'moteur-planche.jpg', quality=85)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2:])
