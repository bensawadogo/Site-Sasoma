"""etalonnage.py — rendu « studio argent » du moteur (choix de Ben, réf. ops/inspiration/H10.jpg).

Maquette validée : ops/presentation/moteur-1.jpg (ops/presentation/maquettes.py, moteur(1)).
Noirs relevés, tons moyens éclaircis, couleurs désaturées, dominante froide légère, clarté et
micro-contraste calculés DANS le masque (le décor ne bave pas sur le métal), hautes lumières
renforcées. Même traitement pour la séquence, l'affiche et les pièces mobiles de l'atlas.
"""
import cv2
import numpy as np


def _flou_dans(g, m, sigma):
    """Flou gaussien pondéré par le masque m (H×W) : seuls les pixels du moteur comptent."""
    w = cv2.GaussianBlur(m, (0, 0), sigma) + 1e-4
    return cv2.GaussianBlur(g * m[..., None], (0, 0), sigma) / w[..., None]


def studio_argent(rgb, masque, fondu=True):
    """rgb : float32 H×W×3 (0-1, ordre RGB) ; masque : float32 H×W (1 = moteur).
    fondu : bord du masque rentré et adouci (image entière) ; False : masque = alpha d'une pièce."""
    f = rgb.astype(np.float32)
    m = (masque > 0.5).astype(np.float32)
    g = 0.10 + f * 0.90
    g = g ** 0.78 * 1.08
    gris = g.mean(2, keepdims=True)
    g = gris + (g - gris) * 0.55
    g = g * np.array([0.97, 1.0, 1.03], np.float32)
    g = g + (g - _flou_dans(g, m, 14)) * 0.9      # clarté
    g = g + (g - _flou_dans(g, m, 2)) * 0.5       # micro-contraste
    lum = g.mean(2, keepdims=True)
    g = np.clip(g + np.clip(lum - 0.45, 0, 1) * 0.35, 0, 1)
    if not fondu:
        return g
    mi = cv2.GaussianBlur(cv2.erode(m, np.ones((5, 5), np.uint8)), (0, 0), 2.0)[..., None]
    return f * (1 - mi) + g * mi
