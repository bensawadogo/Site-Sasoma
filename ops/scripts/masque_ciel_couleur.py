"""masque_ciel_couleur.py — masque du ciel SANS IA pour une photo au ciel coloré (photo F, coucher de soleil, 20/10).

  python ops/scripts/masque_ciel_couleur.py ENTREE SORTIE [HAUT_FONDU BAS_FONDU]
Le ciel est repéré à la couleur (bleu, nuages gris-violet ou orangés clairs) et doit toucher le haut de l'image ;
l'arbre et les rochers (sombres et saturés) en sont exclus. Sous HAUT_FONDU (0,36 de la hauteur) le masque s'efface
jusqu'à BAS_FONDU (0,42) : l'horizon lumineux, les montagnes et le soleil restent fixes (le soleil, s'il glissait,
apparaîtrait en double pendant le fondu de boucle de ciel_derive.py).
"""
import sys

import cv2
import numpy as np


def main(entree, sortie, haut=0.36, bas=0.42):
    im = cv2.imread(entree)
    h, l = im.shape[:2]
    hsv = cv2.cvtColor(im, cv2.COLOR_BGR2HSV).astype(np.int32)
    t, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    bleu = (t >= 90) & (t <= 135) & (v > 80)
    nuage = ((t > 135) | (t < 10)) & (s < 110) & (v > 85)         # gris-violet, rosé
    clair = (s < 70) & (v > 150)
    orange = (t < 30) & (v > 125) & (s < 175)
    ciel = (bleu | nuage | clair | orange) & ~((v < 130) & (s > 120)) & (v > 70)
    ciel = cv2.morphologyEx(ciel.astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    # seul le ciel relié au haut de l'image (ni reflets sur la route ni taches dans les rochers)
    n, lab = cv2.connectedComponents(ciel)
    garde = np.unique(lab[0][lab[0] > 0])
    ciel = np.isin(lab, garde).astype(np.uint8)
    # petits trous dans les nuages de droite (taches bleu sombre) : comblés ; ceux de l'arbre restent
    n, lab, st, cen = cv2.connectedComponentsWithStats(1 - ciel)
    for i in range(1, n):
        if st[i, cv2.CC_STAT_AREA] < 300 and cen[i][0] > 0.5 * l:
            ciel[lab == i] = 1
    ciel = ciel.astype(np.float32)
    ys = np.arange(h, dtype=np.float32)[:, None] / h
    ciel *= np.clip((bas - ys) / (bas - haut), 0, 1)
    cv2.imwrite(sortie, (ciel * 255).astype(np.uint8))


if __name__ == '__main__':
    a = sys.argv[1:]
    main(a[0], a[1], *(float(x) for x in a[2:4]))
