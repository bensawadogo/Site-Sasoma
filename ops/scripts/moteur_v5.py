"""moteur_v5.py — le moteur du site (K1) qui tourne VRAIMENT, vu de côté (coupe longitudinale).

Vu de côté, le plan de la bielle et de la manivelle contient la direction du regard : tout
ce qui bouge monte et descend.
- piston : course pleine (2 × RAYON), ordre 1-3-4-2 (1 et 4 ensemble, 2 et 3 opposés) ;
- tête de bielle : même mouvement vertical que le maneton (le reste va vers ou loin de nous) ;
- bielle : son pied suit le piston, sa tête suit le maneton ; elle paraît un peu plus courte
  quand elle s'incline vers nous (L·cos φ) ;
- K1 montre les quatre pistons à la même hauteur : c'est la mi-course (90° et 270°).

Fond : K1-propre.png (LaMa : cylindres et carter vides, plaque_propre.py), donc rien de
flou ne se découvre. Le rebord découpé du carter, devant, repasse par-dessus les têtes de
bielle qui plongent.

  python ops/scripts/moteur_v5.py assets/ai/v3/K1.png assets/ai/v5/K1-propre.png --apercu 0,3,6,9 planche.png
  python ops/scripts/moteur_v5.py assets/ai/v3/K1.png assets/ai/v5/K1-propre.png SORTIE.mp4
"""
import subprocess
import sys

import cv2
import numpy as np

sys.path.insert(0, 'ops/scripts')
from animer_moteur import AXE_PIED, AXE_TETE, CADRE, CYLINDRES, H, L, N, PISTON, masques_pieces, noir_pur, rect  # noqa: E402

RAYON = 28                     # rayon de manivelle (px) : course de 56 px, la moitié du piston
BIELLE = AXE_TETE - AXE_PIED   # longueur apparente de la bielle à mi-course (235 px)
DEMARRAGE = (0.40, 0.58)       # démarreur puis régime (fraction de la séquence)
TOURS_PAR_UNITE = 7.0          # ≤ 36° de vilebrequin par image du mobile (une sur 5)


def lisser(x, a, b):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def table_angles(n=N):
    """Angle du vilebrequin pour chaque image : lancé au démarreur (à-coups des
    compressions, deux par tour), puis il prend son régime."""
    ts = np.linspace(0, 1, 4000)
    w = lisser(ts, *DEMARRAGE) * TOURS_PAR_UNITE * 2 * np.pi
    theta = np.concatenate([[0], np.cumsum((w[1:] + w[:-1]) / 2 * np.diff(ts))])
    # À-coups du démarreur : la vitesse baisse à chaque compression, surtout au début.
    acoup = 0.12 * (1 - lisser(ts, DEMARRAGE[0] + 0.06, DEMARRAGE[1])) * (ts > DEMARRAGE[0])
    theta = theta - acoup * np.sin(2 * theta)
    return np.interp(np.linspace(0, 1, n), ts, theta)


def poses(theta):
    """Par cylindre : (déplacement du piston, déplacement du maneton, échelle de la bielle)."""
    out = []
    phi0 = np.arcsin(RAYON / BIELLE)
    for i in range(4):
        a = theta + (np.pi / 2 if i in (0, 3) else -np.pi / 2)
        maneton = -RAYON * np.cos(a)                  # vertical (vers le bas > 0)
        phi = np.arcsin(RAYON * np.sin(a) / BIELLE)   # inclinaison vers nous / loin de nous
        long = BIELLE * np.cos(phi)
        piston = maneton - (long - BIELLE * np.cos(phi0))
        out.append((piston, maneton, np.cos(phi) / np.cos(phi0)))
    return out


def avant_plan(propre):
    """Rebord découpé du carter, devant les têtes de bielle : métal clair sous y ≈ 600."""
    lum = propre.mean(axis=2)
    zone = rect((415, 598, 962, 668), 0.1) > 0.5
    m = ((lum > 0.30) & zone).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    return cv2.GaussianBlur(m.astype(np.float32), (0, 0), 1.5)[..., None]


TETE_HAUT = 548  # au-dessus : fût de la bielle (mis à l'échelle) ; dessous : tête (rigide)


VILEBREQUIN = None  # images du vilebrequin 3D (Blender), une par angle : (n, h, l, 4)
VILEBREQUIN_XY = (408, 506)


def charger_vilebrequin(dossier):
    global VILEBREQUIN
    import glob
    fichiers = sorted(glob.glob(f'{dossier}/vilebrequin-*.png'))
    VILEBREQUIN = np.stack([cv2.cvtColor(cv2.imread(f, cv2.IMREAD_UNCHANGED), cv2.COLOR_BGRA2RGBA) for f in fichiers]).astype(np.float32) / 255


def poser(fond, source, pistons, bielles, devant, theta):
    img = fond.copy()
    if VILEBREQUIN is not None:
        # Vilebrequin (derrière les bielles) : image de l'angle le plus proche.
        n = len(VILEBREQUIN)
        v = VILEBREQUIN[int(round(theta / (2 * np.pi) * n)) % n]
        x, y = VILEBREQUIN_XY
        h, l = v.shape[:2]
        a = v[..., 3:]
        img[y:y + h, x:x + l] = img[y:y + h, x:x + l] * (1 - a) + v[..., :3] * a
    y = np.arange(H, dtype=np.float32)[:, None]
    for i, (dp, dm, ech) in enumerate(poses(theta)):
        c = CYLINDRES[i]
        # Tête de bielle : rigide, suit le maneton (pas d'ovalisation).
        m = np.float32([[1, 0, 0], [0, 1, dm]])
        t_img = cv2.warpAffine(source, m, (L, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        t_m = cv2.warpAffine(bielles[i] * lisser(y, TETE_HAUT - 2, TETE_HAUT + 2), m, (L, H), flags=cv2.INTER_LINEAR)[..., None]
        # Fût : du pied (sous le piston) au haut de la tête ; seul lui s'étire (cos φ et
        # écart entre piston et maneton).
        y0, y1 = AXE_PIED, TETE_HAUT
        n0, n1 = y0 + dp, y1 + dm
        k = (n1 - n0) / (y1 - y0)
        m = np.float32([[1, 0, 0], [0, k, n0 - y0 * k]])
        f_img = cv2.warpAffine(source, m, (L, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        f_m = cv2.warpAffine(bielles[i] * (1 - lisser(y, TETE_HAUT - 2, TETE_HAUT + 2)), m, (L, H), flags=cv2.INTER_LINEAR)[..., None]
        img = img * (1 - f_m) + f_img * f_m
        img = img * (1 - t_m) + t_img * t_m
        # Piston : translation verticale.
        m = np.float32([[1, 0, 0], [0, 1, dp]])
        p_img = cv2.warpAffine(source, m, (L, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        p_m = cv2.warpAffine(pistons[i], m, (L, H), flags=cv2.INTER_LINEAR)[..., None]
        img = img * (1 - p_m) + p_img * p_m
    # Le rebord du carter reste devant.
    return img * (1 - devant) + fond * devant


def main(a):
    k1 = cv2.cvtColor(cv2.imread(a[0]), cv2.COLOR_BGR2RGB).astype(np.float32) / 255
    propre = cv2.cvtColor(cv2.imread(a[1]), cv2.COLOR_BGR2RGB).astype(np.float32) / 255
    pistons, bielles = masques_pieces()
    # Plaque propre seulement sous les pièces mobiles (élargies) : ailleurs, K1 exact.
    zone = sum(pistons) + sum(bielles)
    zone = cv2.GaussianBlur(cv2.dilate((zone > 0.05).astype(np.uint8), np.ones((13, 13), np.uint8)).astype(np.float32), (0, 0), 4)[..., None]
    # LaMa lisse un peu : on lui rend le grain de la photo (bruit fin, même amplitude).
    grain = np.random.default_rng(3).standard_normal((H, L, 1)).astype(np.float32) * 0.012
    fond = k1 * (1 - zone) + np.clip(propre + grain, 0, 1) * zone
    devant = avant_plan(propre)
    cadre = rect((int(CADRE[0] * L), int(CADRE[1] * H), int(CADRE[2] * L), int(CADRE[3] * H)), 20)[..., None]
    angles = table_angles()

    sans_pieces = '--fond' in a
    # Fond du site : écrit par pieces_mobiles.py (pièces mobiles et arbre à cames retirés).
    fond_site = cv2.cvtColor(cv2.imread('assets/ai/v5/fond-sans-pieces.png'), cv2.COLOR_BGR2RGB).astype(np.float32) / 255 if sans_pieces else None
    # Décor « garage de quartier » (ops/blender/decor.py) à la place du fond noir : moteur
    # détouré (masque-moteur.png, rembg), décor en pénombre qui s'éclaire pendant le versement.
    decor = None
    import os
    if sans_pieces and os.path.exists('assets/ai/decor/rendu/decor-allume.png'):
        def lire(p):  # rendu dans le repère du site : retourné vers celui de K1
            return np.ascontiguousarray(cv2.cvtColor(cv2.imread(p), cv2.COLOR_BGR2RGB)[:, ::-1]).astype(np.float32) / 255
        decor = [lire(f'assets/ai/decor/rendu/decor-{e}.png') for e in ('penombre', 'allume')]
        detour = cv2.imread('assets/ai/v5/masque-moteur.png', cv2.IMREAD_GRAYSCALE).astype(np.float32)[..., None] / 255
        # Pas de vignette ici : le site pose le même décor, en plus large, tout autour de l'image
        # (decor.py CHAMP = 2) ; la vignette est faite en CSS sur toute la scène.
        # Le moteur, photographié en lumière neutre, prend un soupçon de la chaleur du garage.
        chaleur = np.array([1.04, 1.0, 0.93], np.float32)

        def poser_decor(moteur, k):
            d = decor[0] * (1 - k) + decor[1] * k
            return np.clip(moteur * chaleur * detour + d * (1 - detour), 0, 1)

        # Rendu « studio argent » du moteur (etalonnage.py), appliqué AVANT l'huile : celle-ci
        # garde sa couleur. Le noir pur du studio n'a plus lieu d'être sur le garage.
        from etalonnage import studio_argent
        fond_site = studio_argent(noir_pur(fond_site), detour[..., 0])
        # Affiche (avant le canvas) : K1 complet dans le garage en pénombre.
        k1_brut = cv2.cvtColor(cv2.imread(a[0]), cv2.COLOR_BGR2RGB).astype(np.float32) / 255
        k1_brut = studio_argent(noir_pur(k1_brut), detour[..., 0])
        cv2.imwrite('assets/ai/v5/affiche-decor.png', cv2.cvtColor((poser_decor(k1_brut, 0.0) * 255).astype(np.uint8), cv2.COLOR_RGB2BGR))

    def rendre(n, theta=None):
        th = angles[n] if theta is None else theta
        # --fond : le moteur SANS ses pièces mobiles (le site les dessine en temps réel).
        if sans_pieces:
            # Parois fixes huilées selon l'avancement (t3 de cette image, cf. noyau.ts :
            # la séquence couvre t3 de 0,05 à 0,95).
            from huile_v5 import film, tau_fond
            t3 = 0.05 + 0.9 * n / (N - 1)
            tau = tau_fond(t3)
            img = film(fond_site, tau) if tau.max() > 0 else fond_site
        else:
            img = poser(fond, k1, pistons, bielles, devant, th)
        if decor is not None:
            # Le garage s'éclaire pendant le versement (t3 0,05 → 0,3, avant le démarrage).
            k = float(lisser(0.05 + 0.9 * n / (N - 1), 0.05, 0.3))
            return (poser_decor(np.clip(img, 0, 1), k) * 255).clip(0, 255).astype(np.uint8)
        return (noir_pur(np.clip(img, 0, 1)) * cadre * 255).clip(0, 255).astype(np.uint8)

    import os
    if os.path.isdir('assets/ai/v5/vilebrequin'):
        charger_vilebrequin('assets/ai/v5/vilebrequin')
    if a[2] == '--apercu':
        # Apercu : angles en multiples de 45° (pas des numéros d'image).
        vues = [rendre(0, k * np.pi / 4)[200:700, 390:990] for k in map(int, a[3].split(','))]
        lignes = [np.concatenate(vues[i:i + 2], axis=1) for i in range(0, len(vues), 2)]
        cv2.imwrite(a[4], cv2.cvtColor(np.concatenate(lignes, axis=0), cv2.COLOR_RGB2BGR))
        return
    enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{L}x{H}',
                            '-r', '24', '-i', '-', '-c:v', 'libx264', '-crf', '12', '-preset', 'slow',
                            '-pix_fmt', 'yuv420p', a[2]], stdin=subprocess.PIPE)
    for n in range(N):
        enc.stdin.write(rendre(n).tobytes())
    enc.stdin.close()
    enc.wait()
    print('sortie :', a[2])


if __name__ == '__main__':
    main(sys.argv[1:])
