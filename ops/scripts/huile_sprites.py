"""huile_sprites.py — planches d'images de la simulation Mantaflow (ops/blender/huile_fluide.py)
pour le hero : public/hero-video/pieces/fluide-versement.webp, fluide-carter.webp, fluide.json.

  python ops/scripts/huile_sprites.py [DOSSIER=assets/ai/v5/fluide]

Entrées : DOSSIER/rendu/{versement,carter}/NNNN.png (RGBA, repère du site, recadrés).
Carter : la simulation part d'une nappe pleine (niveau 604) ; une image calme (moteur
arrêté) puis la boucle « moteur en marche » (gouttes, rides). Au remplissage, le site fait
monter cette nappe dans les cavités.
"""
import hashlib
import json
import os
import sys

import numpy as np
from PIL import Image

RACINE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
D = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(RACINE, 'assets', 'ai', 'v5', 'fluide'))
SORTIE = os.path.join(RACINE, 'petrovoll-astro', 'public', 'hero-video', 'pieces')
CADRE_VERSE = (872, 100, 946, 236)
CADRE_CARTER = (392, 520, 920, 646)
HAUT_CARTER = 554          # on ne garde que la nappe (cavités du carter : y 554 → 638)


def images(nom):
    d = os.path.join(D, 'rendu', nom)
    return {int(f[:4]): os.path.join(d, f) for f in sorted(os.listdir(d)) if f.endswith('.png')}


def ambrer(im):
    """Nappe vue de côté : le rendu Cycles donne la forme et le mouvement (surface, rides, gouttes)
    mais sa couleur est fausse par endroits (réfraction grise). On garde l'alpha et les reflets,
    et on recolore selon la profondeur sous la surface : ménisque clair, ambre, puis presque noir."""
    a = np.asarray(im).astype(np.float32) / 255
    al = a[..., 3]
    lum = a[..., :3].mean(-1)
    h, l = al.shape
    plein = al > 0.5
    # Surface de chaque colonne : haut du bloc de liquide relié au fond (les gouttes au-dessus
    # n'en font pas partie).
    surf = np.full(l, h, np.float32)
    for x in range(l):
        col = plein[:, x]
        y = h - 1
        while y >= 0 and not col[y]:
            y -= 1
        while y >= 0 and col[y]:
            y -= 1
        surf[x] = y + 1
    prof = np.arange(h, dtype=np.float32)[:, None] - surf[None, :]
    cles = np.array([0, 2, 6, 16, 34], np.float32)
    teintes = np.array([[255, 214, 110], [250, 178, 48], [220, 128, 20], [150, 78, 8], [84, 38, 4]], np.float32) / 255  # « A doux » : or translucide, jamais noir
    rgb = np.stack([np.interp(prof, cles, teintes[:, c]) for c in range(3)], -1)
    goutte = prof < 0
    rgb[goutte] = np.array([245, 170, 50], np.float32) / 255
    reflet = np.clip((lum - 0.55) / 0.45, 0, 1)[..., None] * (prof[..., None] < 8)
    rgb = np.clip(rgb + reflet * np.array([1.0, 0.92, 0.75]), 0, 1)
    # Nappe translucide (pas une bande néon) : le métal du carter se devine à travers.
    al = al * np.clip(0.86 + 0.14 * np.clip(prof / 14, 0, 1), 0, 1)
    return Image.fromarray((np.dstack([rgb, al]) * 255).astype(np.uint8), 'RGBA')


def filet(im):
    """Versement : seulement le filet (x 907 ± 7) et un petit éclaboussement à l'impact
    (y ≈ 206) ; la nappe que la simulation étalait sur la culasse faisait « bloc »."""
    a = np.asarray(im).astype(np.float32) / 255
    h, l = a.shape[:2]
    x = np.arange(l, dtype=np.float32)[None, :] + CADRE_VERSE[0]
    y = np.arange(h, dtype=np.float32)[:, None] + CADRE_VERSE[1]
    garde = np.clip((9 - np.abs(x - 907)) / 3, 0, 1) * np.clip((214 - y) / 4, 0, 1)
    choc = np.exp(-(((x - 907) / 14) ** 2) - (((y - 207) / 4) ** 2))
    al = a[..., 3] * np.maximum(garde, choc * 0.85)
    lum = a[..., :3].max(-1)
    # « A doux » : or lumineux, cœur clair au centre du filet, halo chaud léger autour.
    cx = np.clip(1 - np.abs(x - 907) / 4.0, 0, 1)
    v = np.clip(lum * 1.2 + cx * 0.35 + 0.12, 0, 1)[..., None]
    p = np.clip(v / 0.55, 0, 1)
    q = np.clip((v - 0.55) / 0.45, 0, 1)
    c0, c1, c2 = (np.array(c, np.float32) / 255 for c in ([150, 80, 12], [255, 185, 60], [255, 246, 205]))
    rgb = (c0 * (1 - p) + c1 * p) * (1 - q) + c2 * q
    halo = np.clip(1 - np.abs(x - 907) / 9.0, 0, 1) * np.clip((214 - y) / 6, 0, 1)
    al = np.maximum(al, halo * 0.18 * (a[..., 3].max() > 0))
    return Image.fromarray((np.dstack([np.clip(rgb, 0, 1), al]) * 255).astype(np.uint8), 'RGBA')


def planche(chemins, recadre, colonnes, fichier, filtre=None):
    ims = [Image.open(c).convert('RGBA') for c in chemins]
    if recadre:
        ims = [im.crop(recadre(im)) for im in ims]
    if filtre:
        ims = [filtre(im) for im in ims]
    l, h = ims[0].size
    rangs = -(-len(ims) // colonnes)
    p = Image.new('RGBA', (l * colonnes, h * rangs), (0, 0, 0, 0))
    for k, im in enumerate(ims):
        p.paste(im, ((k % colonnes) * l, (k // colonnes) * h))
    chemin = os.path.join(SORTIE, fichier)
    p.save(chemin, 'WEBP', quality=82, method=6, alpha_quality=90)
    print(fichier, p.size, len(ims), 'images', os.path.getsize(chemin) // 1024, 'Ko')
    return l, h, hashlib.sha1(open(chemin, 'rb').read()).hexdigest()[:10]


verse = images('versement')
cles_v = sorted(verse)
lv, hv, sv = planche([verse[k] for k in cles_v], None, 12, 'fluide-versement.webp', filet)

carter = images('carter')
# Image 2 : nappe calme (moteur arrêté, remplissage) ; 12 → fin : moteur en marche (boucle).
choix = [2] + list(range(12, max(carter) + 1))
coupe = lambda im: (0, HAUT_CARTER - CADRE_CARTER[1], im.width, im.height)
lc, hc, sc = planche([carter[k] for k in choix], coupe, 7, 'fluide-carter.webp', ambrer)

json.dump({
    'version': hashlib.sha1((sv + sc).encode()).hexdigest()[:10],
    'fps': 24,
    'versement': {'pos': [CADRE_VERSE[0], CADRE_VERSE[1]], 'taille': [lv, hv], 'colonnes': 12,
                  'images': len(cles_v), 'boucle': [24, len(cles_v) - 1]},
    'carter': {'pos': [CADRE_CARTER[0], HAUT_CARTER], 'taille': [lc, hc], 'colonnes': 7,
               'calme': 0, 'boucle': [1, len(choix) - 1], 'niveau': 604},
}, open(os.path.join(SORTIE, 'fluide.json'), 'w'), indent=1)
print('fluide.json écrit')
