"""pieces_mobiles.py — pièces mobiles du moteur pour l'animation en temps réel du site.

Le site ne lit plus les pistons dans la séquence d'images : il dessine lui-même, à chaque
image d'écran, pistons, bielles (fût + tête), vilebrequin 3D (Blender) et le rebord du carter
par-dessus, à la vitesse réelle du moteur (src/scripts/hero-video/moteur-vivant.ts).

  python ops/scripts/pieces_mobiles.py
    entrée : assets/ai/v3/K1.png, assets/ai/v5/K1-propre.png, assets/ai/v5/vilebrequin/*.png
    sortie : petrovoll-astro/public/hero-video/pieces/atlas.webp + pieces.json
             assets/ai/v5/fond-sans-pieces.png (la plaque que la séquence doit montrer)

Tout est déjà RETOURNÉ (miroir) comme les images du site : coordonnées en pixels de la
vidéo source retournée (1344×768).
"""
import glob
import hashlib
import json
import os
import sys

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, 'ops/scripts')
from animer_moteur import AXE_PIED, AXE_TETE, CYLINDRES, H, L, masques_pieces, noir_pur  # noqa: E402
from moteur_v5 import BIELLE, RAYON, TETE_HAUT, VILEBREQUIN_XY, avant_plan  # noqa: E402

SORTIE = 'petrovoll-astro/public/hero-video/pieces'
import math
_PIC_1 = 3 * math.pi / 2 + 2 * math.pi + math.radians(110)
BETA = [0.0] * 4
BETA[0] = -math.pi / 2 - _PIC_1 / 2
for _i, _r in ((2, 1), (3, 2), (1, 3)):
    BETA[_i] = BETA[0] - _r * math.pi / 2
os.makedirs(SORTIE, exist_ok=True)

k1 = cv2.cvtColor(cv2.imread('assets/ai/v3/K1.png'), cv2.COLOR_BGR2RGB).astype(np.float32) / 255
propre = cv2.cvtColor(cv2.imread('assets/ai/v5/K1-propre.png'), cv2.COLOR_BGR2RGB).astype(np.float32) / 255
pistons, bielles = masques_pieces()
zone = sum(pistons) + sum(bielles)
zone = cv2.GaussianBlur(cv2.dilate((zone > 0.05).astype(np.uint8), np.ones((13, 13), np.uint8)).astype(np.float32), (0, 0), 4)[..., None]
grain = np.random.default_rng(3).standard_normal((H, L, 1)).astype(np.float32) * 0.012
fond = k1 * (1 - zone) + np.clip(propre + grain, 0, 1) * zone
# Distribution : l'arbre à cames de la photo est retiré (LaMa) ; le site dessine le sien, qui tourne.
propre_cames = cv2.cvtColor(cv2.imread('assets/ai/v5/K1-propre-cames.png'), cv2.COLOR_BGR2RGB).astype(np.float32) / 255
zc = np.zeros((H, L), np.float32)
zc[146:228, 466:956] = 1
zc = cv2.GaussianBlur(zc, (0, 0), 2)[..., None]
# Le fond reconstruit derrière la distribution est assombri : intérieur de culasse dans l'ombre.
fond = fond * (1 - zc) + np.clip(propre_cames * 0.45 + grain, 0, 1) * zc
devant = avant_plan(propre)[..., 0]

y = np.arange(H, dtype=np.float32)[:, None]
coupe = np.clip((y - (TETE_HAUT - 2)) / 4, 0, 1)  # 0 au-dessus de la tête, 1 dedans

sprites = []  # (nom, rgba (h, l, 4), x, y) en coordonnées K1 (non retournées)


def decouper(nom, rgb, alpha, marge=2):
    ys, xs = np.nonzero(alpha > 0.01)
    y0, y1 = max(0, ys.min() - marge), min(H, ys.max() + 1 + marge)
    x0, x1 = max(0, xs.min() - marge), min(L, xs.max() + 1 + marge)
    rgba = np.concatenate([rgb[y0:y1, x0:x1], alpha[y0:y1, x0:x1, None]], axis=2)
    sprites.append((nom, rgba, x0, y0))


for i in range(4):
    decouper(f'piston{i}', k1, pistons[i])
    decouper(f'fut{i}', k1, bielles[i] * (1 - coupe))
    decouper(f'tete{i}', k1, bielles[i] * coupe)
# Poulie d'origine effacée (LaMa) ; ce qui reste de sa trace est ramené au noir du studio.
# (K1-propre-volant.png : poulie avant ET flasque arrière effacées.)
propre_poulie = cv2.cvtColor(cv2.imread('assets/ai/v5/K1-propre-volant.png'), cv2.COLOR_BGR2RGB).astype(np.float32) / 255
zp = np.zeros((H, L), np.float32)
zp[428:600, 322:381] = 1
zp[458:602, 972:1016] = 1
zp = cv2.GaussianBlur(zp, (0, 0), 2)[..., None]
noir = np.zeros((H, L), np.float32)
noir[440:545, 330:374] = 1
noir = cv2.GaussianBlur(noir, (0, 0), 5)[..., None]
k1_poulie = np.clip(k1 * 1.3, 0, 1)  # texture de la poulie : la photo AVANT effacement, éclaircie (elle sort de l'ombre)
fond = fond * (1 - zp) + propre_poulie * zp
fond = fond * (1 - 0.85 * noir)
cv2.imwrite('assets/ai/v5/fond-sans-pieces.png', cv2.cvtColor((fond * 255).clip(0, 255).astype(np.uint8), cv2.COLOR_RGB2BGR))
decouper('avant', fond, devant)
# Poulie de vilebrequin (vue de profil, à l'avant du moteur) : bande rectangulaire de la photo.
POULIE = (338, 446, 376, 586)
m_poulie = np.zeros((H, L), np.float32)
m_poulie[POULIE[1]:POULIE[3], POULIE[0]:POULIE[2]] = 1
# Sur le garage (decor.py), la bande rectangulaire montrait le noir du studio autour du disque :
# on la découpe selon le détourage du moteur (rembg), et le noir pur y devient transparent.
detour = cv2.imread('assets/ai/v5/masque-moteur.png', cv2.IMREAD_GRAYSCALE).astype(np.float32) / 255
pas_noir = cv2.GaussianBlur(np.clip((k1.max(axis=2) - 0.03) / 0.05, 0, 1), (0, 0), 0.8)
m_poulie *= detour * pas_noir
decouper('poulie', k1_poulie, m_poulie, marge=0)
# Carter de distribution (plastique noir de la photo), devant la chaîne : le brin monte
# jusqu'à l'axe de l'arbre à cames en passant DERRIÈRE lui.
lum_k1 = k1.mean(axis=2)
m_cache = np.zeros((H, L), np.float32)
m_cache[140:272, 372:438] = 1
m_cache *= ((lum_k1 < 0.30) & (lum_k1 > 0.06)).astype(np.float32)
# Fermeture large + léger élargissement : les arêtes claires du carter en font partie (pas de
# liseré entre le carter et la chaîne), bord adouci d'un pixel.
m_cache = cv2.morphologyEx(m_cache, cv2.MORPH_CLOSE, np.ones((11, 11), np.uint8))
m_cache = cv2.dilate(m_cache, np.ones((5, 5), np.uint8))
m_cache = cv2.GaussianBlur(m_cache, (0, 0), 0.6)
decouper('cache', fond, m_cache)
# Fond du carter (cavités sous les têtes de bielle) : masque de la nappe d'huile, que le site
# remplit et fait onduler.
lum_fond = fond.mean(axis=2)
cav = np.zeros((H, L), np.uint8)
cav[556:642, 420:958] = 1
cav = (cav * (lum_fond < 0.2)).astype(np.uint8)
cav = cv2.morphologyEx(cav, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
# Seulement les grandes cavités (pas les trous de vis du rebord).
cav = cv2.morphologyEx(cav, cv2.MORPH_OPEN, np.ones((15, 15), np.uint8))
m_carter = cv2.GaussianBlur(cav.astype(np.float32), (0, 0), 1.0)
decouper('carter', np.ones((H, L, 3), np.float32), m_carter, marge=0)
# Flasque de volant moteur (arrière), vue de profil : même principe que la poulie.
VOLANT = (978, 465, 1012, 595)
m_volant = np.zeros((H, L), np.float32)
m_volant[VOLANT[1]:VOLANT[3], VOLANT[0]:VOLANT[2]] = 1
m_volant *= detour * pas_noir
decouper('volant', np.clip(k1 * 1.15, 0, 1), m_volant, marge=0)
DIST = 'assets/ai/v5/distribution'
lire = lambda f: cv2.cvtColor(cv2.imread(f, cv2.IMREAD_UNCHANGED), cv2.COLOR_BGRA2RGBA).astype(np.float32) / 255
for k, f in enumerate(sorted(glob.glob(f'{DIST}/cames-*.png'))):
    sprites.append((f'cames{k}', lire(f), 440, 138))
sprites.append(('poussoir', lire(f'{DIST}/poussoir.png'), -16, 191))   # x relatif à l'axe de la soupape
sprites.append(('ressort', lire(f'{DIST}/ressort.png'), -14, 202))
sprites.append(('teteSoupape', lire(f'{DIST}/tete-soupape.png'), -21, 235))
for f in sorted(glob.glob('assets/ai/v5/vilebrequin/vilebrequin-*.png')):
    v = cv2.cvtColor(cv2.imread(f, cv2.IMREAD_UNCHANGED), cv2.COLOR_BGRA2RGBA).astype(np.float32) / 255
    sprites.append((f'vilebrequin{len([s for s in sprites if s[0].startswith("vilebrequin")])}', v, *VILEBREQUIN_XY))

# Les pièces tirées de la photo passent par le même traitement que les images de la séquence
# (noir pur du studio) : sinon leur fond gris ferait un voile sur le noir du site.
for idx, (nom, rgba, sx, sy) in enumerate(sprites):
    if nom in ('cache', 'avant', 'poulie', 'volant'):
        rgba = rgba.copy()
        rgba[..., :3] = noir_pur(rgba[..., :3])
        sprites[idx] = (nom, rgba, sx, sy)

# Rendu « photo produit » (etalonnage.studio_photo, comme la séquence) : avant le grain et
# avant l'atlas huilé, pour que l'huile se pose sur le métal étalonné.
from etalonnage import studio_photo  # noqa: E402
for idx, (nom, rgba, sx, sy) in enumerate(sprites):
    if nom.startswith(('piston', 'fut', 'tete', 'avant', 'cache', 'poulie', 'volant', 'cames', 'poussoir', 'ressort', 'vilebrequin')):
        rgba = rgba.copy()
        rgba[..., :3] = studio_photo(rgba[..., :3], rgba[..., 3], fondu=False)
        sprites[idx] = (nom, rgba, sx, sy)

# Chapeaux de paliers de l'arbre à cames : gris uni dans le rendu Blender (aspect « image de
# synthèse »). On leur donne le modelé de l'aluminium de K1 : lumière du haut, métal brossé,
# arêtes biseautées (05/10). Colonnes des chapeaux = alpha opaque sur plus de 65 % de la hauteur (cames : 60 % au plus).
rng_b = np.random.default_rng(5)
for idx, (nom, rgba, sx, sy) in enumerate(sprites):
    if not nom.startswith('cames'):
        continue
    a = rgba[..., 3]
    col = (a > 0.5).mean(0) > 0.65
    if not col.any():
        continue
    rgba = rgba.copy()
    h, w = a.shape
    yy = np.linspace(0, 1, h, dtype=np.float32)[:, None]
    degrade = (1.05 - 0.55 * yy ** 1.4) * 0.9                                   # lumière du haut
    brosse = cv2.GaussianBlur(rng_b.standard_normal((h, w)).astype(np.float32), (0, 0), sigmaX=9, sigmaY=0.6) * 0.16
    # Arêtes : distance au bord du chapeau (biseau sombre sur les côtés, liseré clair en haut).
    m = (col[None, :] & (a > 0.5)).astype(np.uint8)
    d = cv2.distanceTransform(m, cv2.DIST_L2, 3)
    biseau = np.clip(d / 3.0, 0, 1) * 0.35 + 0.65
    lisere = np.exp(-((yy * h - 2.0) ** 2) / 4.0) * 0.25 + np.exp(-((yy - 0.22) ** 2) / 0.004) * 0.10
    g = (rgba[..., :3] * (degrade * biseau + brosse)[..., None] + lisere[..., None]) * np.array([1.03, 1.0, 0.94], np.float32)
    rgba[..., :3] = np.where(m[..., None] > 0, np.clip(g, 0, 1), rgba[..., :3])
    sprites[idx] = (nom, rgba, sx, sy)

# Les rendus Blender sont trop « propres » à côté de la photo : on leur donne son grain.
rng = np.random.default_rng(9)
for idx, (nom, rgba, sx, sy) in enumerate(sprites):
    # Pistons et bielles aussi : le flou de mouvement les lisse, le grain les rend à la photo.
    if nom.startswith(('cames', 'vilebrequin', 'poussoir', 'ressort', 'teteSoupape', 'piston', 'fut', 'tete')):
        bruit_ = rng.standard_normal(rgba.shape[:2] + (1,)).astype(np.float32) * 0.014
        rgba = rgba.copy()
        if nom.startswith(('cames', 'poussoir', 'ressort')):
            # Profondeur de champ de la photo : la distribution n'est pas plus nette que le reste.
            rgba = cv2.GaussianBlur(rgba, (0, 0), 0.6)
        rgba[..., :3] = np.clip(rgba[..., :3] + bruit_ * (rgba[..., 3:] > 0), 0, 1)
        sprites[idx] = (nom, rgba, sx, sy)

# Atlas : rangées simples, retournement (miroir) appliqué à chaque pièce.
LARGEUR = 2048  # 3 vilebrequins par rangée : atlas < 4096 px de haut (limite des GPU mobiles)
x = yy = haut = 0
places = {}
for nom, rgba, sx, sy in sprites:
    h, l = rgba.shape[:2]
    if x + l > LARGEUR:
        x, yy, haut = 0, yy + haut + 2, 0
    places[nom] = (x, yy, l, h, L - sx - l, sy)
    x += l + 2
    haut = max(haut, h)
atlas = np.zeros((yy + haut, LARGEUR, 4), np.float32)
for nom, rgba, sx, sy in sprites:
    ax, ay, l, h, _, _ = places[nom]
    atlas[ay:ay + h, ax:ax + l] = rgba[:, ::-1]
img = Image.fromarray((atlas * 255).clip(0, 255).astype(np.uint8), 'RGBA')
chemin = f'{SORTIE}/atlas.webp'
img.save(chemin, 'WEBP', quality=82, method=6, alpha_quality=90)
version = hashlib.sha1(open(chemin, 'rb').read()).hexdigest()[:10]

# Même atlas, pièces HUILÉES (huile_v5.mouiller) : le site passe de l'un à l'autre quand
# l'huile atteint chaque pièce. Le rebord, le carter, la poulie et le volant restent secs.
from huile_v5 import mouiller  # noqa: E402

atlas_h = atlas.copy()
for k, (nom, rgba, sx, sy) in enumerate(sprites):
    if nom in ('avant', 'cache', 'poulie', 'volant', 'carter'):
        continue
    ax, ay, l, h, _, _ = places[nom]
    brillant = nom.startswith(('cames', 'poussoir', 'ressort'))
    atlas_h[ay:ay + h, ax:ax + l] = mouiller(rgba, 100 + k, brillant)[:, ::-1]
img_h = Image.fromarray((atlas_h * 255).clip(0, 255).astype(np.uint8), 'RGBA')
chemin_h = f'{SORTIE}/atlas-huile.webp'
img_h.save(chemin_h, 'WEBP', quality=82, method=6, alpha_quality=90)
version_h = hashlib.sha1(open(chemin_h, 'rb').read()).hexdigest()[:10]
print('atlas huilé', os.path.getsize(chemin_h) // 1024, 'Ko')

def place(nom):
    ax, ay, l, h, dx, dy = places[nom]
    return {'atlas': [int(ax), int(ay), int(l), int(h)], 'pos': [int(dx), int(dy)]}


json.dump({
    'version': version,
    'versionHuile': version_h,
    'source': [L, H],
    'rayon': RAYON,
    'bielle': BIELLE,
    'axePied': AXE_PIED,
    'teteHaut': TETE_HAUT,
    # Ordre de gauche à droite À L'ÉCRAN (image retournée) : le cylindre 1 de K1 est à droite.
    'cylindres': [{'piston': place(f'piston{i}'), 'fut': place(f'fut{i}'), 'tete': place(f'tete{i}'),
                   'phase': 'a' if i in (0, 3) else 'b'} for i in range(4)],
    'vilebrequin': [place(n) for n in sorted((s[0] for s in sprites if s[0].startswith('vilebrequin')), key=lambda n: int(n[11:]))],
    'avant': place('avant'),
    'cames': [place(n) for n in sorted((s[0] for s in sprites if s[0].startswith('cames')), key=lambda n: int(n[5:]))],
    # Soupapes : axe (x retourné), cylindre, et la came qui les pousse (même formule que
    # ops/blender/distribution.py : rayon de base, levée, demi-ouverture, nez par cylindre).
    'soupapes': [{'x': L - (c + d), 'cyl': i} for i, c in enumerate(CYLINDRES) for d in (-18, 18)],
    'poussoir': {'atlas': place('poussoir')['atlas'], 'dx': -16, 'y': 191},
    'ressort': {'atlas': place('ressort')['atlas'], 'dx': -14, 'y': 202, 'haut': 203, 'bas': 240},
    'pontY': 222,
    'teteSoupape': {'atlas': place('teteSoupape')['atlas'], 'dx': -21, 'y': 235, 'chambreY': 243},
    'came': {'base': 18, 'levee': 10, 'demiOuverture': 72, 'beta': BETA},
    # Poulie : texture de la photo, recentrée sur l'axe du vilebrequin (y = 588) ; la poulie
    # d'origine est effacée (K1-propre-poulie.png).
    'poulie': {'atlas': place('poulie')['atlas'], 'pos': [L - 396, 588 - (POULIE[3] - POULIE[1]) // 2],
               'centreY': 588, 'rayon': (POULIE[3] - POULIE[1]) / 2},
    'cache': place('cache'),
    # Nappe : masque des cavités, niveau vide → plein (y de K1).
    'carter': {**place('carter'), 'niveauVide': 642, 'niveauPlein': 604},
    # Huile versée : chute dans la culasse sous le goulot, puis filet le long de la paroi avant
    # jusqu'au carter (x retournés).
    'filets': {'chute': {'x': L - 437, 'haut': 118, 'bas': 206}, 'paroi': {'x': L - 404, 'haut': 230, 'bas': 630}},
    'volant': {'atlas': place('volant')['atlas'], 'pos': [L - VOLANT[2], 588 - (VOLANT[3] - VOLANT[1]) // 2],
               'centreY': 588, 'rayon': (VOLANT[3] - VOLANT[1]) / 2},
    # Chaîne : entre la poulie et le bloc, du pignon d'arbre à cames (y ≈ 150) au pignon de
    # vilebrequin (y ≈ 575) ; pignon de vilebrequin de rayon 20 (celui de la came : 40, rapport 2:1).
    # Fenêtre : entre le carter de distribution (en haut) et la poulie (en bas), contre le bloc.
    'chaine': {'x': L - 404, 'largeur': 18, 'came': {'y': 176, 'rayon': 40}, 'vilebrequin': {'y': 588, 'rayon': 20},
               'fenetre': [176, 588]},  # d'axe à axe : le brin monte derrière le carter noir
}, open(f'{SORTIE}/pieces.json', 'w'), indent=1)
print('atlas', img.size, os.path.getsize(chemin) // 1024, 'Ko', 'version', version)
