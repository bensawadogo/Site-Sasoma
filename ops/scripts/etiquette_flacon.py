"""Étiquette exacte sur le flacon 250 ml des nettoyants (sans IA, sans quota).

Repart de la vraie photo du Fuel Injector Cleaner et réécrit au calcul le titre
jaune (sur un cartouche rouge sombre) et les trois rubans bleus.
Usage : python etiquette_flacon.py ID "LIGNE 1|LIGNE 2" "RUBAN 1|RUBAN 2|RUBAN 3"
"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

SRC = Path('C:/SITE-SASOMA/petrovoll-astro/src/assets/produits/fuel-injector-cleaner.webp')
BRUT = Path('C:/SITE-SASOMA/ops/captures/photos-ia')
POLICES = Path('C:/Windows/Fonts')
CX = 603  # axe de l'étiquette


def police(nom, taille_max, texte, largeur, hauteur):
    for t in range(taille_max, 8, -1):
        f = ImageFont.truetype(str(POLICES / nom), t)
        x0, y0, x1, y1 = f.getbbox(texte)
        if x1 - x0 <= largeur and y1 - y0 <= hauteur:
            return f
    return f


def main(i, titre, rubans):
    im = Image.open(SRC).convert('RGBA')
    alpha = im.getchannel('A')
    d = ImageDraw.Draw(im)
    # Cartouche rouge sombre (dégradé vertical) à la place du titre d'origine.
    x0, y0, x1, y1 = 478, 838, 728, 966
    haut, bas = np.array([120, 22, 20]), np.array([70, 10, 12])
    t = np.linspace(0, 1, y1 - y0)[:, None, None]
    zone = (haut * (1 - t) + bas * t).repeat(x1 - x0, axis=1).astype(np.uint8)
    masque = Image.new('L', (x1 - x0, y1 - y0), 0)
    ImageDraw.Draw(masque).rounded_rectangle((0, 0, x1 - x0 - 1, y1 - y0 - 1), radius=10, fill=255)
    im.paste(Image.fromarray(zone, 'RGB'), (x0, y0), masque.filter(ImageFilter.GaussianBlur(2)))
    lignes = titre.split('|')
    h = (y1 - y0 - 16) / len(lignes)
    for k, l in enumerate(lignes):
        f = police('ariblk.ttf', 60, l, x1 - x0 - 24, h - 6)
        d.text((CX, y0 + 8 + h * (k + 0.5)), l, font=f, anchor='mm', fill=(255, 196, 38, 255),
               stroke_width=3, stroke_fill=(60, 8, 8, 255))
    # Trois rubans bleus (parallélogrammes) avec leur texte blanc.
    for k, r in enumerate(rubans.split('|')):
        ya = 971 + 22 * k
        d.polygon([(486, ya + 20), (498, ya - 1), (724, ya - 1), (712, ya + 20)], fill=(28, 160, 210, 255))
        d.text((607, ya + 10), r, font=police('arialbd.ttf', 15, r, 180, 14), anchor='mm', fill=(255, 255, 255, 255))
    zone = (470, 832, 736, 1040)
    im.paste(im.crop(zone).filter(ImageFilter.GaussianBlur(0.6)), zone[:2])
    im.putalpha(alpha)
    im.save(BRUT / f'{i}.png')
    print(i, 'OK')


if __name__ == '__main__':
    main(*sys.argv[1:4])
