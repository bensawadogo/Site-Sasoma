#!/usr/bin/env python3
"""clean-basecolor-artifacts.py — Nettoie la base color du bidon des marques
colorees parasites (rouge ET bleu) qui donnent au produit un aspect "use/sale".

POURQUOI CE SCRIPT
La base color du scan Meshy est un atlas fragmente : le bouchon rouge et
l'etiquette bleue sont voisins des ilots de plastique gris. Deux familles de
defauts en resultent a l'ecran :

  1. MASSES SATUREES — de petites taches rouges isolees sur le corps.
     Un blob n'est supprime QUE s'il est petit (< MAX_BLOB px) et entoure de
     GRIS sur au moins 60 % de son pourtour (sinon il appartient a
     l'etiquette ou au bouchon : on n'y touche pas). Remplissage par
     plus-proche-voisin : aucune valeur inventee.

  2. HAIRLINES — des traits fins rouges/bleus peints DANS les ilots de
     plastique (verifie au rendu non eclaire : ils suivent les aretes du
     maillage, donc ils sont bien dans la texture et non un artefact de
     filtrage). Ils mesurent 1 a 3 px de large et echappent donc a un
     seuillage "rouge franc". On les traite par DETEINTAGE : un pixel
     chromatique isole dont le pourtour est du plastique neutre est ramene a
     la teinte locale du plastique (luminance moyenne des voisins neutres).
     Le trait disparait sans laisser de tache : la surface reste credible.

Un pixel n'est reteint que si son anneau est >= 85 % neutre ET < 10 %
etiquette : le bouchon, le logo et le lettrage imprime ne sont jamais touches.

USAGE : python scripts/clean-basecolor-artifacts.py
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

# --- Passe 1 : masses rouges compactes -------------------------------------
MAX_BLOB = 2500          # au-dela : masse voulue (bouchon, bandeau, logo)
MIN_GRIS_AUTOUR = 0.60   # part minimale de gris autour du blob
ANNEAU = 5               # epaisseur de l'anneau analyse (px)

# --- Passe 2 : hairlines chromatiques isolees ------------------------------
CHROMA_ART = 16          # chroma mini pour suspecter un artefact
CHROMA_NEUTRE = 22       # chroma maxi d'un voisin "plastique"
MAX_TRAIT = 9000         # au-dela : structure voulue (contour, lettrage)
PART_NEUTRE_MIN = 0.85   # anneau quasi integralement plastique
PART_ETIQ_MAX = 0.10     # aucune presence etiquette toleree
ANNEAU_2 = 4             # epaisseur de l'anneau (px)
FENETRE = 7              # fenetre de calcul de la teinte locale (px)

if not SRC.exists():
    print(f'❌ Base color absente : {SRC}')
    print('   (genere-la d abord via npm run bidon:compress)')
    sys.exit(3)

im = Image.open(SRC).convert('RGB')
a = np.asarray(im).astype(np.int16)
r, g, b = a[:, :, 0], a[:, :, 1], a[:, :, 2]
mx = np.maximum(np.maximum(r, g), b)
mn = np.minimum(np.minimum(r, g), b)
chroma = mx - mn

# Rouge franc : rouge dominant ET saturation marquee.
rouge = (r - np.maximum(g, b) > 40) & (r > 60) & (g < 120)
# Gris/plastique : peu sature (c'est le "corps" du bidon).
gris = chroma < 28
# Bleu/blanc : etiquette.
etiquette = (b - r > 25) | ((mx > 190) & (chroma < 45))
