"""images_cles.py — images de début/fin des vidéos, aux formats du hero (guide §8).

Entrée : assets/ai/E1.png, E2.png, E3.png (720×1280, non commitées).
Sortie : assets/ai/cles/E{n}-desktop.png (1344×768, 16:9) et E{n}-mobile.png (768×1344, 9:16).

Le moteur est recadré en carré (CARRES : E1 et E2 ont le même cadrage d'origine ; E3,
décalé, est recadré pour que son moteur ait la même taille), puis replacé au même
endroit dans les trois images : les vidéos partent et arrivent sur des cadrages proches. Les bords sont fondus dans un noir pur,
comme le studio du hero.
"""
import os

from PIL import Image, ImageDraw, ImageFilter

AI = os.path.normpath(os.path.join(os.path.dirname(__file__), '..', '..', 'assets', 'ai'))
SORTIE = os.path.join(AI, 'cles')
# Format : (largeur, hauteur, côté du moteur en fraction de la hauteur ou largeur, centre x, centre y)
FORMATS = {
    'desktop': (1344, 768, 0.92 * 768, 0.64, 0.52),  # moteur à droite, place à gauche pour le bidon et les textes
    'mobile': (768, 1344, 0.84 * 768, 0.5, 0.53),  # bidon en haut, textes en bas
}


# Carré (gauche, haut, côté) dans l'image 720×1280, mesuré sur les images retenues.
CARRES = {1: (0, 430, 720), 2: (0, 430, 720), 3: (40, 370, 620)}


def carre_moteur(img, n):
    x, y, c = CARRES[n]
    return img.crop((x, y, x + c, y + c))


def fondu(cote):
    m = Image.new('L', (cote, cote), 0)
    ImageDraw.Draw(m).ellipse((cote * 0.06, cote * 0.06, cote * 0.94, cote * 0.94), fill=255)
    return m.filter(ImageFilter.GaussianBlur(cote * 0.07))


os.makedirs(SORTIE, exist_ok=True)
for n in (1, 2, 3):
    img = Image.open(os.path.join(AI, f'E{n}.png')).convert('RGB')
    carre = carre_moteur(img, n)
    for nom, (l, h, cote, cx, cy) in FORMATS.items():
        cote = round(cote)
        toile = Image.new('RGB', (l, h), (0, 0, 0))
        toile.paste(carre.resize((cote, cote), Image.LANCZOS), (round(cx * l - cote / 2), round(cy * h - cote / 2)), fondu(cote))
        chemin = os.path.join(SORTIE, f'E{n}-{nom}.png')
        toile.save(chemin)
        print(chemin, toile.size)
