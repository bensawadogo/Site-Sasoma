"""masque_site.py — masque du moteur pour le site (repère de K1), à partir du détourage rembg.

  python ops/scripts/masque_site.py

Le détourage (assets/ai/v5/masque-moteur.png) couvre la poulie avant et le volant de K1. Dans la
séquence du site, ces pièces sont effacées (le navigateur les redessine en tournant) et leur place
est noire : sur le garage, elle faisait deux blocs noirs. On retire du masque le noir de ces deux
zones seulement (ailleurs, le noir des creux du moteur fait partie du moteur).
"""
import cv2
import numpy as np

masque = cv2.imread('assets/ai/v5/masque-moteur.png', cv2.IMREAD_GRAYSCALE).astype(np.float32) / 255
# Fond fixe de la séquence (sans pièces mobiles, sans décor) : on y repère le noir.
fond = cv2.cvtColor(cv2.imread('assets/ai/v5/fond-sans-pieces.png'), cv2.COLOR_BGR2RGB).astype(np.float32) / 255
noir = (fond.max(-1) < 0.07).astype(np.float32)
zones = np.zeros_like(masque)
for x0, x1 in ((320, 392), (960, 1030)):  # poulie avant, volant (cf. credits.md, LaMa)
    zones[430:615, x0:x1] = 1
noir = cv2.morphologyEx(noir * zones, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
noir = cv2.GaussianBlur(noir, (0, 0), 1.2)
cv2.imwrite('assets/ai/v5/masque-moteur-site.png', (np.clip(masque * (1 - noir), 0, 1) * 255).astype(np.uint8))
print('retiré :', int((masque * noir > 0.5).sum()), 'px')
