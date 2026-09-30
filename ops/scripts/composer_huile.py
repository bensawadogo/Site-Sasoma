"""composer_huile.py — moteur rigide par construction (hero v3).

Les vidéos IA (C1, C2, C3 : l'huile coule dans le moteur en coupe, caméra fixe) gardent
bien le moteur, mais le métal « respire » un peu d'une image à l'autre et l'IA ajoute
son propre filet au-dessus du moteur. On repart donc de l'image fixe K1 (moteur sec)
et on n'y colle, image par image, que l'HUILE de la vidéo : pixels devenus dorés par
rapport à K1, dans le contour du moteur. Le filet au-dessus du moteur est retiré
(le site dessine le sien, du bidon à l'orifice).

  python ops/scripts/composer_huile.py K1.png HAUT_MOTEUR BAS_MOTEUR SORTIE.mp4 C1.mp4 [C2.mp4 | K3.png@0.27-0.7 …]

Un plan « Kn.png@HAUT-BAS » (secours sans vidéo IA, quota du jour épuisé) : l'huile de
l'image clé Kn (éditée depuis K1, donc alignée) descend de HAUT à BAS en 120 images,
front irrégulier et coulures qui prennent de l'avance, par-dessus la dernière image.

HAUT_MOTEUR / BAS_MOTEUR : fractions de la hauteur de l'image ; hors de cette bande,
toujours K1. Les vidéos sont enchaînées (1re image de C2 = dernière de C1 : sautée).
Hors du cadre du moteur (CADRE), l'image passe au noir pur, et les gris très sombres
(sol du studio) aussi : le moteur flotte dans le noir du site. L'huile ne passe que dans
les zones lubrifiées (ZONES) et prend une teinte dorée homogène (TEINTE).
"""
import subprocess
import sys

import numpy as np
from PIL import Image, ImageFilter

# Cadre du moteur de K1 (fractions de l'image : x0, y0, x1, y1), bords fondus sur 40 px.
CADRE = (0.2, 0.115, 0.795, 0.9)
# Où l'huile a le droit d'aller (fractions de K1, x0, y0, x1, y1) : la distribution
# (arbre à cames, soupapes), les cylindres avec les pistons, le carter avec les bielles et
# le vilebrequin. Hors de ces zones (tranches de la coupe, carter extérieur, couvercle de
# distribution, goulot, plan de joint sous les cames, dessous du moteur), le métal reste
# sec : pas de débordement.
ZONES = [
    (0.345, 0.18, 0.705, 0.29),
    (0.31, 0.315, 0.72, 0.835),
]
# Teinte de l'huile neuve (degrés) : on ramène les tons rouges ou bruns de la vidéo IA
# dans cette plage dorée, saturation et luminosité bornées.
TEINTE = (32.0, 44.0)
# Part de la couleur corrigée (le reste garde les reflets de la vidéo) et opacité de
# l'huile : le métal reste visible dessous, comme sous un film d'huile.
MELANGE = 0.7
OPACITE = 0.9


def lire_video(chemin, l, h):
    brut = subprocess.run(['ffmpeg', '-v', 'error', '-i', chemin, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'],
                          capture_output=True, check=True).stdout
    return np.frombuffer(brut, np.uint8).reshape(-1, h, l, 3)


def dorure(img):
    """Or de l'huile : rouge et vert hauts, bleu bas (le métal gris a R ≈ G ≈ B)."""
    f = img.astype(np.float32)
    return (f[..., 0] * 0.6 + f[..., 1] * 0.4) - f[..., 2]


def noir_pur(img):
    """Sol du studio (≤ 37) ramené au noir ; tons au-dessus de 96 inchangés (genou doux)."""
    t = np.clip((img - 32) / 64, 0, 1)
    return np.maximum(0, img - 32 * (1 - t * t * (3 - 2 * t)))


def zones(h, l):
    z = np.zeros((h, l), np.uint8)
    for x0, y0, x1, y1 in ZONES:
        z[int(y0 * h):int(y1 * h), int(x0 * l):int(x1 * l)] = 255
    return np.array(Image.fromarray(z).filter(ImageFilter.GaussianBlur(4)), np.float32) / 255


def dorer(img):
    """Huile dorée homogène : teinte ramenée dans TEINTE, saturation ≤ 0,8, pas de brun trop sombre."""
    f = img.astype(np.float32) / 255
    r, g, b = f[..., 0], f[..., 1], f[..., 2]
    mx = f.max(axis=2)
    mn = f.min(axis=2)
    d = mx - mn + 1e-6
    teinte = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    sat = np.where(mx > 0, d / (mx + 1e-6), 0)
    teinte = np.clip(teinte, *TEINTE)
    sat = np.minimum(sat, 0.8)
    val = np.maximum(mx, 0.22 + 0.5 * mx)
    # Retour en RGB.
    c = val * sat
    x = c * (1 - np.abs((teinte / 60) % 2 - 1))
    m = val - c
    zero = np.zeros_like(c)
    k = (teinte // 60).astype(int)
    rr = np.select([k == 0, k == 1], [c, x], zero)
    gg = np.select([k == 0, k == 1], [x, c], zero)
    return (np.stack([rr + m, gg + m, m + zero], axis=2) * 255).clip(0, 255)


def masque_huile(img, base, bande):
    m = np.clip((dorure(img) - base - 18) / 30, 0, 1)
    m = np.array(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(2)),
                 np.float32) / 255
    return m * bande


def coulee(spec, depart, k1, base, bande, n=120):
    """Plan de secours : l'huile de Kn coule de haut en bas sur la dernière image."""
    chemin, plage = spec.split('@')
    haut, bas = (float(v) for v in plage.split('-'))
    kn = np.array(Image.open(chemin).convert('RGB')).astype(np.float32)
    h, l = kn.shape[:2]
    m = masque_huile(kn, base, bande)[..., None]
    depart = depart.astype(np.float32)
    rng = np.random.default_rng(7)
    # Coulures : par tranches de 6 px, une avance aléatoire du front (0 à 9 % de l'image).
    avance = np.repeat(rng.random(l // 6 + 1) ** 3 * 0.09, 6)[:l]
    avance = np.convolve(avance, np.ones(5) / 5, mode='same')
    y = (np.arange(h, dtype=np.float32) / h)[:, None]
    sorties = []
    for i in range(1, n + 1):
        t = i / n
        t = t * t * (3 - 2 * t)
        front = haut + (bas + 0.09 - haut) * t + avance[None, :] * np.sin(np.pi * min(1, t * 1.2)) ** 0.5
        r = np.clip((front - y) * h / 10, 0, 1)
        r = np.where(y < haut, 1, r)
        r = r[..., None] * m
        # Front mouillé : un peu plus clair là où l'huile arrive.
        reflet = np.clip(1 - np.abs(front - y) * h / 14, 0, 1)[..., None] * m * 0.12
        img = depart * (1 - r) + kn * r
        img = img + (255 - img) * reflet
        sorties.append(img.clip(0, 255).astype(np.uint8))
    return sorties


def main(a):
    k1 = np.array(Image.open(a[0]).convert('RGB'))
    h, l = k1.shape[:2]
    haut, bas = int(float(a[1]) * h), int(float(a[2]) * h)
    sortie = a[3]
    base = dorure(k1)
    bande = np.zeros((h, l), np.float32)
    bande[haut:bas] = 1
    # Bords de la bande adoucis (12 px) : pas de coupure nette sous l'orifice.
    bande = np.array(Image.fromarray((bande * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(6)), np.float32) / 255
    bande = bande * zones(h, l)

    cadre = np.zeros((h, l), np.uint8)
    cadre[int(CADRE[1] * h):int(CADRE[3] * h), int(CADRE[0] * l):int(CADRE[2] * l)] = 255
    cadre = (np.array(Image.fromarray(cadre).filter(ImageFilter.GaussianBlur(20)), np.float32) / 255)[..., None]

    images = []
    for n, v in enumerate(a[4:]):
        if '@' in v:
            images.extend(coulee(v, images[-1], k1, base, bande))
            continue
        clip = lire_video(v, l, h)
        images.extend(clip if n == 0 else clip[1:])
    print(f'{len(images)} images', flush=True)

    enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{l}x{h}',
                            '-r', '24', '-i', '-', '-c:v', 'libx264', '-crf', '12', '-preset', 'slow',
                            '-pix_fmt', 'yuv420p', sortie], stdin=subprocess.PIPE)
    for img in images:
        gain = dorure(img) - base
        # 18 → 0, 48 → 1 : seuil progressif, puis un léger flou (bords de l'huile).
        m = np.clip((gain - 18) / 30, 0, 1)
        m = np.array(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(2)),
                     np.float32) / 255
        m = (m * bande)[..., None]
        m = m * OPACITE
        huile = dorer(img) * MELANGE + img.astype(np.float32) * (1 - MELANGE)
        out = noir_pur(k1 * (1 - m) + huile * m) * cadre
        enc.stdin.write(out.clip(0, 255).astype(np.uint8).tobytes())
    enc.stdin.close()
    enc.wait()
    print('sortie :', sortie)


if __name__ == '__main__':
    main(sys.argv[1:])
