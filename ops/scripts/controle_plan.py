"""controle_plan.py — contrôle qualité automatique d'un plan vidéo du moteur (plan de
production §12). Sortie brute + verdict, à coller dans production/PROJECT_STATUS.md.

  python ops/scripts/controle_plan.py PLAN.mp4 DEBUT.png FIN.png

Mesures (la vidéo est ramenée à la taille des images clés) :
  - fidélité début / fin : SSIM (ffmpeg) image 1 / DEBUT et dernière image / FIN ;
  - composition : le métal doit rester immobile. Hors des zones où l'huile passe (pixels
    devenus dorés à un moment du plan ou entre DEBUT et FIN, élargis), écart moyen entre
    chaque image et la première (mouvement de caméra, métal qui « respire ») ;
  - mouvement : l'huile doit bouger (écart moyen dans la zone de l'huile, milieu / début).

Verdict (seuils du plan) : composition < 90 → REJET ; mouvement < 85 → À REVOIR ;
sinon ACCEPTÉ. Le produit (bidon) n'est jamais dans ces plans : il reste la vraie photo.
"""
import re
import io
import subprocess
import sys

import numpy as np
from PIL import Image, ImageFilter

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")


def ssim(video, image, selection, l, h):
    filtre = f"[0:v]{selection},scale={l}:{h}[a];[1:v]scale={l}:{h}[b];[a][b]ssim"
    sortie = subprocess.run(['ffmpeg', '-hide_banner', '-i', video, '-i', image, '-lavfi', filtre, '-frames:v', '1', '-f', 'null', '-'],
                            capture_output=True, text=True).stderr
    m = re.findall(r'All:([0-9.]+)', sortie)
    return float(m[-1]) if m else float('nan')


def images(video, l, h):
    brut = subprocess.run(['ffmpeg', '-v', 'error', '-i', video, '-vf', f'scale={l}:{h}', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'],
                          capture_output=True, check=True).stdout
    return np.frombuffer(brut, np.uint8).reshape(-1, h, l, 3).astype(np.float32)


def dorure(img):
    return img[..., 0] * 0.6 + img[..., 1] * 0.4 - img[..., 2]


def main(video, debut, fin):
    a = np.array(Image.open(debut).convert('RGB'), np.float32)
    b = np.array(Image.open(fin).convert('RGB'), np.float32)
    h, l = a.shape[:2]
    seq = images(video, l, h)
    base = dorure(seq[0])
    gain = np.max([dorure(f) - base for f in seq[:: max(1, len(seq) // 24)]], axis=0)
    huile = (((gain > 18) | ((dorure(b) - dorure(a)) > 18)).astype(np.uint8)) * 255
    huile = np.array(Image.fromarray(huile).filter(ImageFilter.MaxFilter(15)), np.float32) / 255 > 0.5
    # Zone du moteur (pas le fond noir) hors huile : c'est là que le métal doit rester fixe.
    moteur = seq[0].mean(axis=2) > 30
    metal = moteur & ~huile
    ecarts_metal = [float(np.abs(f - seq[0])[metal].mean()) for f in seq]
    milieu = seq[len(seq) // 2]
    mouvement = float(np.abs(milieu - seq[0])[huile].mean()) if huile.any() else 0.0

    s_debut = ssim(video, debut, 'select=eq(n\\,0)', l, h)
    s_fin = ssim(video, fin, f'select=eq(n\\,{len(seq) - 1})', l, h)
    derive = max(ecarts_metal)
    # 0 d'écart = 100 ; 20 niveaux de gris d'écart moyen sur le métal = 0.
    composition = max(0.0, 100 - derive * 5)
    note_mouvement = min(100.0, mouvement * 10)
    verdict = 'REJET' if composition < 90 else ('À REVOIR' if note_mouvement < 85 else 'ACCEPTÉ')
    print(f'plan : {video} ({len(seq)} images, {l}×{h})')
    print(f'SSIM début : {s_debut:.3f} (attendu ≥ 0,80) ; SSIM fin : {s_fin:.3f} (attendu ≥ 0,75)')
    print(f'métal : écart moyen max {derive:.1f} / 255 sur {metal.mean() * 100:.0f} % de l\'image → composition {composition:.0f}/100')
    print(f'huile : écart milieu / début {mouvement:.1f} / 255 sur {huile.mean() * 100:.0f} % de l\'image → mouvement {note_mouvement:.0f}/100')
    print(f'verdict : {verdict}')


if __name__ == '__main__':
    main(*sys.argv[1:4])
