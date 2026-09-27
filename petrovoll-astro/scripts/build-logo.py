"""build-logo.py — Produit tous les fichiers du logo SASOMA pour le site.

Entrée : assets-source/logo/sasoma-original.png (PNG sur fond blanc, logo empilé)
Sorties (public/) :
  images/logo/sasoma-horizontal.webp        barre de navigation (fond clair)
  images/logo/sasoma-horizontal-blanc.webp  pied de page (fond foncé)
  favicon.ico, apple-touch-icon.png, icon-192.png, icon-512.png
  images/og-default.png                     aperçu de partage (WhatsApp, Facebook)
et assets-source/logo/ : versions transparentes pleine résolution.

USAGE : python scripts/build-logo.py
"""
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter

RACINE = Path(__file__).resolve().parent.parent
SOURCE = RACINE / 'assets-source' / 'logo' / 'sasoma-original.png'
SORTIE_SRC = RACINE / 'assets-source' / 'logo'
SORTIE_WEB = RACINE / 'public' / 'images' / 'logo'
PUBLIC = RACINE / 'public'
MARINE = (0, 36, 74)  # #00244A, texte du logo


def detourer(src: Image.Image) -> Image.Image:
    """Rend transparent le blanc du FOND (connecté aux bords + intérieur des
    lettres), sans toucher au blanc du globe ni aux pointillés de la route."""
    W, H = src.size
    marque = src.copy()
    graines = [(0, 0), (W - 1, 0), (0, H - 1), (W - 1, H - 1), (W // 2, 0), (W // 2, H - 1), (0, H // 2), (W - 1, H // 2)]
    # Intérieur du « O » de SASOMA : blanc enfermé, invisible pour le flood fill des bords.
    graines.append((round(W * 0.55), round(H * 0.81)))
    for xy in graines:
        if min(src.getpixel(xy)) > 225:
            ImageDraw.floodfill(marque, xy, (255, 0, 255), thresh=28)
    diff = ImageChops.difference(marque, Image.new('RGB', (W, H), (255, 0, 255))).convert('L')
    fond = diff.point(lambda v: 255 if v < 3 else 0)
    # Bande de 3 px autour des formes : « color to alpha » (bords sans halo blanc).
    bande = ImageChops.subtract(fond.filter(ImageFilter.MaxFilter(7)), fond)
    rgba = src.convert('RGBA')
    p, pf, pb = rgba.load(), fond.load(), bande.load()
    for y in range(H):
        for x in range(W):
            if pf[x, y]:
                p[x, y] = (255, 255, 255, 0)
            elif pb[x, y]:
                r, g, b, _ = p[x, y]
                a = max(255 - r, 255 - g, 255 - b)
                if a == 0:
                    p[x, y] = (255, 255, 255, 0)
                else:
                    f = 255 / a
                    p[x, y] = tuple(max(0, min(255, round(255 - (255 - c) * f))) for c in (r, g, b)) + (a,)
    return rgba.crop(rgba.getbbox())


def separer(logo: Image.Image) -> tuple[Image.Image, Image.Image]:
    """Coupe le logo empilé en (symbole, nom) sur la bande vide qui les sépare."""
    W, H = logo.size
    alpha = logo.getchannel('A')
    vide = [alpha.crop((0, y, W, y + 1)).getextrema()[1] < 20 for y in range(H)]
    meilleur, debut = (0, 0), None
    for y in range(H // 2, H):
        if vide[y]:
            debut = y if debut is None else debut
            if y - debut > meilleur[1] - meilleur[0]:
                meilleur = (debut, y)
        else:
            debut = None
    coupe = sum(meilleur) // 2
    symbole, nom = logo.crop((0, 0, W, coupe)), logo.crop((0, coupe, W, H))
    return symbole.crop(symbole.getbbox()), nom.crop(nom.getbbox())


def horizontal(symbole: Image.Image, nom: Image.Image, hauteur: int = 400) -> Image.Image:
    s = symbole.resize((round(symbole.width * hauteur / symbole.height), hauteur), Image.LANCZOS)
    hn = round(hauteur * 0.42)
    n = nom.resize((round(nom.width * hn / nom.height), hn), Image.LANCZOS)
    esp = round(hauteur * 0.12)
    im = Image.new('RGBA', (s.width + esp + n.width, hauteur), (0, 0, 0, 0))
    im.paste(s, (0, 0), s)
    im.paste(n, (s.width + esp, (hauteur - hn) // 2), n)
    return im


def pour_fond_fonce(im: Image.Image) -> Image.Image:
    """Les bleus deviennent blancs ; l'orange et le globe restent reconnaissables."""
    im = im.copy()
    p = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = p[x, y]
            if a and b > r + 25:
                p[x, y] = (255, 255, 255, a)
    return im


def carre(symbole: Image.Image, cote: int, fond=None, marge=0.1) -> Image.Image:
    im = Image.new('RGBA', (cote, cote), fond or (0, 0, 0, 0))
    s = symbole.copy()
    s.thumbnail((round(cote * (1 - 2 * marge)),) * 2, Image.LANCZOS)
    im.paste(s, ((cote - s.width) // 2, (cote - s.height) // 2), s)
    return im


def main() -> None:
    if not SOURCE.exists():
        sys.exit(f'Source introuvable : {SOURCE}')
    SORTIE_WEB.mkdir(parents=True, exist_ok=True)

    logo = detourer(Image.open(SOURCE).convert('RGB'))
    symbole, nom = separer(logo)
    horiz = horizontal(symbole, nom)
    logo.save(SORTIE_SRC / 'sasoma-transparent.png')
    symbole.save(SORTIE_SRC / 'sasoma-symbole.png')
    horiz.save(SORTIE_SRC / 'sasoma-horizontal.png')

    # Barre de navigation : affiché à 40 px de haut → fichier en 2× (80 px) pour les écrans nets.
    for nom_fichier, im in (('sasoma-horizontal', horiz), ('sasoma-horizontal-blanc', pour_fond_fonce(horiz))):
        web = im.resize((round(im.width * 80 / im.height), 80), Image.LANCZOS)
        web.save(SORTIE_WEB / f'{nom_fichier}.webp', 'WEBP', quality=90, method=6)
        print(f'{nom_fichier}.webp {web.size} {(SORTIE_WEB / f"{nom_fichier}.webp").stat().st_size // 1024} Ko')

    # Icônes : iOS remplit la transparence en noir → fond blanc pour apple-touch-icon.
    carre(symbole, 256).save(PUBLIC / 'favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])
    carre(symbole, 180, (255, 255, 255, 255), 0.12).convert('RGB').save(PUBLIC / 'apple-touch-icon.png', optimize=True)
    for cote in (192, 512):
        carre(symbole, cote, (255, 255, 255, 255), 0.12).convert('RGB').save(PUBLIC / f'icon-{cote}.png', optimize=True)

    # Aperçu de partage 1200×630 (PNG : lu par WhatsApp et Facebook, contrairement au WebP).
    og = Image.new('RGB', (1200, 630), (255, 255, 255))
    l = logo.copy()
    l.thumbnail((900, 470), Image.LANCZOS)
    og.paste(l, ((1200 - l.width) // 2, (630 - l.height) // 2), l)
    ImageDraw.Draw(og).rectangle((0, 612, 1200, 630), fill=(230, 103, 17))
    og.save(PUBLIC / 'images' / 'og-default.png', optimize=True)
    print('icônes et og-default.png générés')


if __name__ == '__main__':
    main()
