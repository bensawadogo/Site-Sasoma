#!/usr/bin/env python3
"""clean-basecolor-red.py — Supprime les ROUGES PARASITES de la base color du bidon.

POURQUOI CE SCRIPT
La base color du scan Meshy est un atlas fragmente : les taches rouges (bouchon,
bandeau et logo de l'etiquette) sont voisines d'ilots gris (plastique). Aux
niveaux de mipmap, le GPU echantillonne a cheval sur ces ilots : le rouge "bave"
donc sur le corps du bidon et dessine des pointilles rouges le long des nervures
et des coutures UV. C'est ce bruit qui donne au produit un aspect "use/sale".

STRATEGIE (conservatrice, aucune retouche du dessin)
Un blob rouge n'est supprime QUE s'il est :
  - petit  (< MAX_BLOB px) — le bouchon et le logo sont des masses de plusieurs
    milliers de pixels, ils ne sont jamais concernes ;
  - entoure de GRIS (corps du bidon) sur au moins 60 % de son pourtour.
Un blob rouge entoure de bleu/blanc appartient a l'etiquette : il est CONSERVE.
Le remplissage se fait par plus-proche-voisin (distance transform) : aucune
valeur inventee, on prolonge le plastique environnant.

USAGE : python scripts/clean-basecolor-red.py
SORTIE : assets-source/bidon-basecolor-clean.webp + ...-clean-768.webp
"""
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'assets-source' / 'bidon-basecolor-fixed.webp'
OUT_1024 = ROOT / 'assets-source' / 'bidon-basecolor-clean.webp'
OUT_768 = ROOT / 'assets-source' / 'bidon-basecolor-clean-768.webp'

# Un blob rouge plus petit que ca peut etre un parasite ; au-dela c'est une
# masse voulue (bouchon, bandeau, logo).
MAX_BLOB = 2500
# Part minimale de gris autour du blob pour conclure au parasite.
MIN_GRIS_AUTOUR = 0.60
# Epaisseur de l'anneau analyse autour du blob (px).
ANNEAU = 5

if not SRC.exists():
    print(f'❌ Base color absente : {SRC}')
    print('   (genere-la d abord via npm run bidon:compress)')
    sys.exit(3)

im = Image.open(SRC).convert('RGB')
a = np.asarray(im).astype(np.int16)
r, g, b = a[:, :, 0], a[:, :, 1], a[:, :, 2]
mx = np.maximum(np.maximum(r, g), b)
mn = np.minimum(np.minimum(r, g), b)

# Rouge franc : rouge dominant ET saturation marquee.
rouge = (r - np.maximum(g, b) > 40) & (r > 60) & (g < 120)
# Gris/plastique : peu sature (c'est le "corps" du bidon).
gris = (mx - mn) < 28
# Bleu/blanc : etiquette.
etiquette = (b - r > 25) | ((mx > 190) & ((mx - mn) < 45))

lbl, n = ndimage.label(rouge)
print(f'🎯 {n} taches rouges detectees ({int(rouge.sum())} px)')

a_fill = a.copy()
supprimes = 0
pixels_supprimes = 0

for i in range(1, n + 1):
    zone = lbl == i
    taille = int(zone.sum())
    if taille > MAX_BLOB:
        continue
    # Anneau autour du blob (dilatation - blob).
    anneau = ndimage.binary_dilation(zone, iterations=ANNEAU) & ~zone
    total = int(anneau.sum())
    if total == 0:
        continue
    part_gris = float(gris[anneau].mean())
    part_etiq = float(etiquette[anneau].mean())
    if part_gris < MIN_GRIS_AUTOUR or part_etiq > 0.25:
        continue  # appartient visiblement a l'etiquette -> on n'y touche pas
    a_fill[zone] = (0, 0, 0)  # marqueur, rempli juste apres
    supprimes += 1
    pixels_supprimes += taille

if pixels_supprimes == 0:
    print('✅ Aucun rouge parasite a retirer — texture deja propre.')
    sys.exit(0)

# Remplissage par plus-proche-voisin : on copie la couleur des pixels CONSERVES
# les plus proches, ce qui prolonge le plastique sans inventer de nuance.
trou = np.all(a_fill == 0, axis=2) & rouge
valides = ~trou
indices = ndimage.distance_transform_edt(trou, return_distances=False, return_indices=True)
rempli = a[indices[0], indices[1]]
resultat = a.copy()
resultat[trou] = rempli[trou]

# Lissage final tres leger, uniquement sur la zone repeinte (evite tout liseré).
flou = ndimage.uniform_filter(resultat.astype(np.float32), size=(3, 3, 1))
masque_lisse = ndimage.binary_dilation(trou, iterations=2) & valides
resultat[masque_lisse] = flou[masque_lisse].astype(np.int16)

clean = Image.fromarray(np.clip(resultat, 0, 255).astype(np.uint8), 'RGB')
clean.save(OUT_1024, 'WEBP', quality=92, method=6)
clean.resize((768, 768), Image.LANCZOS).save(OUT_768, 'WEBP', quality=88, method=6)

print(f'✅ {supprimes} taches parasites retirees ({pixels_supprimes} px)')
print(f'✅ Texture propre 1024 : {OUT_1024.name} ({OUT_1024.stat().st_size // 1024} Ko)')
print(f'✅ Texture propre  768 : {OUT_768.name} ({OUT_768.stat().st_size // 1024} Ko)')
