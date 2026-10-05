"""Étiquette exacte sur le bidon 20 L industriel (sans IA, sans quota).

Quand l'IA écorche le nom (ex. « SCHIEIDÖL »), on repart du bidon TURBINE
validé (ops/captures/photos-ia/turbine-oil.png, de face, étiquette plate) et
on réécrit au calcul les trois textes du produit aux mêmes places :
cartouche doré, sous-titre allemand, ligne principale.
Usage : python etiquette_bidon.py ID "NOM" "Sous-titre" "LIGNE PRINCIPALE"
"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

BRUT = Path('C:/SITE-SASOMA/ops/captures/photos-ia')
POLICES = Path('C:/Windows/Fonts')
CX = 608  # axe du cartouche sur l'étiquette


def police(nom, taille_max, texte, largeur, hauteur=None):
    for t in range(taille_max, 10, -1):
        f = ImageFont.truetype(str(POLICES / nom), t)
        x0, y0, x1, y1 = f.getbbox(texte)
        if x1 - x0 <= largeur and (hauteur is None or y1 - y0 <= hauteur):
            return f
    return f


def fond_etiquette(a):
    """Modèle lisse du fond crème de l'étiquette (surface du 2e degré par canal),
    ajusté sur les seuls pixels crème : les lettres sont ignorées."""
    y0, y1, x0, x1 = 540, 770, 360, 870
    z = a[y0:y1, x0:x1, :3].astype(float)
    ref = np.median(z.reshape(-1, 3), axis=0)
    m = np.abs(z - ref).sum(-1) < 40
    yy, xx = np.mgrid[y0:y1, x0:x1]
    def base(x, y):
        x, y = (x - 600) / 300, (y - 650) / 120
        return np.stack([np.ones_like(x), x, y, x * x, x * y, y * y], -1)
    coef, *_ = np.linalg.lstsq(base(xx[m], yy[m]), z[m], rcond=None)
    return lambda bx0, by0, bx1, by1: (base(*np.mgrid[bx0:bx1, by0:by1][::-1].transpose(0, 2, 1)) @ coef)


def effacer(im, modele, x0, y0, x1, y1):
    zone = modele(x0, y0, x1, y1).clip(0, 255).astype(np.uint8)
    # Bords fondus sur 8 px : pas de rectangle visible autour de la retouche.
    masque = Image.new('L', (x1 - x0, y1 - y0), 0)
    ImageDraw.Draw(masque).rectangle((8, 8, x1 - x0 - 9, y1 - y0 - 9), fill=255)
    masque = masque.filter(ImageFilter.GaussianBlur(4)).point(lambda v: min(255, v * 2))
    im.paste(Image.fromarray(zone, 'RGB'), (x0, y0), masque)


def main(i, nom, sous, ligne):
    im = Image.open(BRUT / 'turbine-oil.png').convert('RGBA')
    a = np.array(im)
    d = ImageDraw.Draw(im)
    modele = fond_etiquette(a)
    # Cartouche : fond sombre, filet doré, lettres dorées cerclées de sombre.
    f = police('ariblk.ttf', 54, nom, 460, 50)
    w = f.getlength(nom)
    bx0, bx1 = int(min(451, CX - w / 2 - 14)), int(max(766, CX + w / 2 + 14))
    d.rectangle((bx0, 572, bx1, 635), fill=(38, 33, 22, 255))
    d.rectangle((bx0 + 4, 576, bx1 - 4, 631), outline=(176, 146, 72, 255), width=2)
    d.text((CX, 604), nom, font=f, anchor='mm', fill=(214, 182, 96, 255), stroke_width=2, stroke_fill=(24, 20, 12, 255))
    # Sous-titre (allemand, comme sur les vrais bidons).
    effacer(im, modele, 410, 634, 810, 676)
    d.text((CX, 655), sous, font=police('arialbd.ttf', 24, sous, 360), anchor='mm', fill=(104, 86, 44, 255))
    # Ligne principale, alignée à gauche comme « TURBINE OIL ».
    effacer(im, modele, 362, 674, 872, 726)
    d.text((383, 700), ligne, font=police('arialbd.ttf', 40, ligne, 470, 34), anchor='lm', fill=(22, 22, 24, 255))
    # Même douceur que la photo autour (l'image IA n'est pas piquée au pixel).
    zone = (bx0 - 4, 568, 866, 726)
    im.paste(im.crop(zone).filter(ImageFilter.GaussianBlur(0.7)), zone[:2])
    im.putalpha(Image.fromarray(a[..., 3]))
    im.save(BRUT / f'{i}.png')
    print(i, 'OK')


if __name__ == '__main__':
    main(*sys.argv[1:5])
