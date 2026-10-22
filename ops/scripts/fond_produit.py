"""fond_produit.py — fond de la section « bidon qui tourne » (accueil), 22/10 : studio gris argent à faisceau de lumière + podium (Pinterest, choix n°13 de Ben).

  python ops/scripts/fond_produit.py
Entrée : ops/pinterest-fond/f13-x4.png (carré 2504 px, RealESRGAN de f13.jpg 626 px).
Sortie : petrovoll-astro/src/assets/univers/studio-large.webp (16:9, podium sous le bidon à 32 % de la largeur)
         et studio-haut.webp (9:16, podium sous le bidon, cartes dessous).
Le carré est placé puis prolongé par répétition des bords floutée (mur et sol unis).
"""
from pathlib import Path

import cv2
import numpy as np

RACINE = Path(__file__).resolve().parents[2]
SRC = RACINE / 'ops' / 'pinterest-fond' / 'f13-x4.png'
SORTIE = RACINE / 'petrovoll-astro' / 'src' / 'assets' / 'univers'
POD_X, POD_Y = 0.54, 0.745   # centre et dessus du podium dans le carré


def etendre(carre, L, H, hauteur_carre, px_cible, py_cible):
    """Place le carré (redimensionné à hauteur_carre) pour que le podium tombe en (px_cible, py_cible), puis prolonge."""
    s = cv2.resize(carre, (hauteur_carre, hauteur_carre), interpolation=cv2.INTER_AREA)
    x0 = round(px_cible - POD_X * hauteur_carre)
    y0 = round(py_cible - POD_Y * hauteur_carre)
    # fenêtre du carré dans le canevas (peut déborder : on recadre)
    sx0, sy0 = max(0, -x0), max(0, -y0)
    cx0, cy0 = max(0, x0), max(0, y0)
    w = min(hauteur_carre - sx0, L - cx0)
    h = min(hauteur_carre - sy0, H - cy0)
    patch = s[sy0:sy0 + h, sx0:sx0 + w]
    haut, bas, gauche, droite = cy0, H - (cy0 + h), cx0, L - (cx0 + w)
    out = cv2.copyMakeBorder(patch, haut, bas, gauche, droite, cv2.BORDER_REPLICATE)
    # les zones prolongées sont floutées fortement, avec un raccord progressif sur 120 px
    flou = cv2.GaussianBlur(out, (0, 0), 90)
    masque = np.zeros((H, L), np.float32)
    masque[:, :] = 1
    # le raccord empiète de 30 px sur le carré (côtés qui touchent un bord prolongé) pour ne pas laisser de couture
    ig = 30 if gauche else 0
    id_ = 30 if droite else 0
    it = 160 if haut else 0
    ib = 160 if bas else 0
    masque[cy0 + it:cy0 + h - ib, cx0 + ig:cx0 + w - id_] = 0
    masque = cv2.GaussianBlur(masque, (0, 0), 70)
    masque = np.clip(masque * 1.8, 0, 1)[..., None]
    return (out * (1 - masque) + flou * masque).astype(np.uint8)


def teinte(im):
    """Acier légèrement bleuté, un peu moins brillant : le texte blanc reste lisible partout."""
    f = im.astype(np.float32)
    f *= np.array([1.06, 0.99, 0.93], np.float32)   # BGR : plus de bleu
    f *= 0.9
    return np.clip(f, 0, 255).astype(np.uint8)


carre = cv2.imread(str(SRC))
large = teinte(etendre(carre, 2048, 1152, 1152, 0.32 * 2048, 0.80 * 1152))
haut = teinte(etendre(carre, 648, 1152, 1000, 0.5 * 648, 0.60 * 1152))
cv2.imwrite(str(SORTIE / 'studio-large.webp'), large, [cv2.IMWRITE_WEBP_QUALITY, 90])
cv2.imwrite(str(SORTIE / 'studio-haut.webp'), haut, [cv2.IMWRITE_WEBP_QUALITY, 90])
cv2.imwrite(str(RACINE / 'ops' / 'pinterest-fond' / 'apercu-large.jpg'), large)
cv2.imwrite(str(RACINE / 'ops' / 'pinterest-fond' / 'apercu-haut.jpg'), haut)
print('ok')
