"""animer_moteur.py — moteur du hero v4 : huile réaliste, carter qui se remplit, pistons qui bougent.

Tout part de l'image fixe K1 (moteur sec, en coupe) : aucune vidéo IA, donc le métal
reste rigide et aucun quota n'est consommé.

  python ops/scripts/animer_moteur.py assets/ai/v3/K1.png assets/ai/videos/moteur-v3.mp4

Trois plans de 121 + 120 + 120 images (ceux qu'attend build-hero-video.mjs) :
  C1 l'huile entre côté goulot (à gauche dans K1, à droite une fois l'image retournée) et nappe l'arbre à cames ;
  C2 elle coule dans les cylindres, sur les pistons ; le moteur démarre ;
  C3 elle descend le long des bielles jusqu'au vilebrequin et remplit le bas du carter.

Huile : film mince, pas de peinture. Le métal reste visible dessous, assombri et doré
par absorption (le bleu est absorbé, le rouge passe), avec des reflets spéculaires calculés
sur l'épaisseur du film, des coulures qui descendent, un bourrelet sur le front, des gouttes
qui tombent et une nappe au fond du carter, avec sa ligne de surface brillante.

Pistons : chaque piston (et sa bielle) est découpé dans K1 et déplacé selon un vrai
système bielle-manivelle (1 et 4 en phase, 2 et 3 opposés). Derrière, le fond est
reconstruit (inpainting) ; au-dessus du piston, la chemise est étirée.
"""
import subprocess
import sys

import cv2
import numpy as np

H, L = 768, 1344
IMAGES = (121, 120, 120)
N = sum(IMAGES)

# Géométrie relevée sur K1 (pixels).
CYLINDRES = (478, 617, 757, 897)       # axe de chaque cylindre
PISTON = dict(haut=279, bas=390, demi=57)
CHEMISE_HAUT = 243                      # haut de la chemise (tête), au-dessus du piston
AXE_PIED = 353                          # axe de piston (pied de bielle)
AXE_TETE = 588                          # tête de bielle (maneton)
RAYON = 10                              # rayon de manivelle : course de 20 px
CADRE = (0.2, 0.115, 0.795, 0.9)

# Régions où l'huile va (x0, y0, x1, y1) : distribution, cylindres, bas moteur.
CAMES = (470, 140, 950, 224)
CYL = (418, 236, 958, 394)
BAS = (418, 394, 958, 642)
# Fond du carter : là où la nappe se forme, et ses niveaux (vide → plein).
CARTER = (420, 560, 958, 660)
NIVEAU = (636, 600)

# Temps (fraction de la séquence) : arrivée de l'huile et régime du moteur.
T_CAMES = (0.03, 0.27)
T_CYL = (0.33, 0.58)
T_BAS = (0.62, 0.86)
T_NAPPE = (0.70, 1.0)
DEMARRAGE = (0.40, 0.55)                # le moteur passe de l'arrêt à son régime
TOURS_PAR_UNITE = 7.0                   # ≤ 36° par image du mobile (une image sur 5)

AMBRE = np.array([1.0, 0.62, 0.14], np.float32)
ABSORPTION = np.array([0.10, 0.48, 1.35], np.float32)


def lisser(x, a, b):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def bruit(rng, sx, sy, forme=(H, L)):
    n = rng.standard_normal(forme).astype(np.float32)
    n = cv2.GaussianBlur(n, (0, 0), sigmaX=sx, sigmaY=sy)
    return (n - n.mean()) / (n.std() + 1e-6)


def rect(r, flou=3.0):
    m = np.zeros((H, L), np.float32)
    m[r[1]:r[3], r[0]:r[2]] = 1
    return cv2.GaussianBlur(m, (0, 0), flou)


# ── Pièces mobiles ──────────────────────────────────────────────────────────

def masques_pieces():
    pistons, bielles = [], []
    for c in CYLINDRES:
        p = np.zeros((H, L), np.uint8)
        cv2.rectangle(p, (c - PISTON['demi'], PISTON['haut']), (c + PISTON['demi'], PISTON['bas']), 255, -1)
        b = np.zeros((H, L), np.uint8)
        cv2.fillPoly(b, [np.array([(c - 13, PISTON['bas'] - 6), (c + 13, PISTON['bas'] - 6), (c + 19, 556), (c - 19, 556)])], 255)
        cv2.rectangle(b, (c - 44, 553), (c + 47, 578), 255, -1)
        cv2.circle(b, (c, AXE_TETE), 31, 255, -1)
        pistons.append(cv2.GaussianBlur(p.astype(np.float32) / 255, (0, 0), 0.8))
        bielles.append(cv2.GaussianBlur(b.astype(np.float32) / 255, (0, 0), 0.8))
    return pistons, bielles


def fond_sans_pieces(k1, pistons, bielles):
    m = sum(pistons) + sum(bielles)
    m = cv2.dilate((m > 0.05).astype(np.uint8) * 255, np.ones((5, 5), np.uint8))
    return cv2.inpaint(k1, m, 6, cv2.INPAINT_TELEA)


def angle(t):
    """Angle du vilebrequin (radians) : intégrale d'une vitesse qui monte au démarrage."""
    a, b = DEMARRAGE
    if t <= a:
        return 0.0
    # Rampe lissée intégrée numériquement (assez fin pour 361 images).
    ts = np.linspace(a, t, 200)
    w = lisser(ts, a, b) * TOURS_PAR_UNITE * 2 * np.pi
    return float(np.trapezoid(w, ts))


def poses(theta):
    """Pour chaque cylindre : (déplacement du piston, décalage de la tête de bielle)."""
    out = []
    for i in range(4):
        phi = 0.0 if i in (0, 3) else np.pi
        dy = RAYON * (np.cos(phi) - np.cos(theta + phi))
        bx = RAYON * (np.sin(theta + phi) - np.sin(phi))
        out.append((dy, bx, dy))
    return out


def poser(fond, source, pistons, bielles, theta):
    img = fond.copy()
    for i, (dy, bx, by) in enumerate(poses(theta)):
        c = CYLINDRES[i]
        # Bielle : le pied suit le piston, la tête suit le maneton (transformation rigide).
        p0 = np.array([c, AXE_PIED], np.float32)
        q0 = np.array([c, AXE_TETE], np.float32)
        p1 = p0 + [0, dy]
        q1 = q0 + [bx, by]
        a0 = np.arctan2(*(q0 - p0)[::-1])
        a1 = np.arctan2(*(q1 - p1)[::-1])
        rot = cv2.getRotationMatrix2D((float(p0[0]), float(p0[1])), float(np.degrees(a0 - a1)), 1.0)
        rot[:, 2] += p1 - p0
        b_img = cv2.warpAffine(source, rot, (L, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        b_m = cv2.warpAffine(bielles[i], rot, (L, H), flags=cv2.INTER_LINEAR)[..., None]
        img = img * (1 - b_m) + b_img * b_m
        # Chemise au-dessus du piston : étirée (piston descendu) ou recouverte (monté).
        x0, x1 = c - PISTON['demi'], c + PISTON['demi'] + 1
        haut = PISTON['haut']
        if dy > 0:
            n = int(round(haut + dy)) - CHEMISE_HAUT
            bande = source[CHEMISE_HAUT:haut, x0:x1]
            img[CHEMISE_HAUT:CHEMISE_HAUT + n, x0:x1] = cv2.resize(bande, (x1 - x0, n), interpolation=cv2.INTER_LINEAR)
        # Piston : translation verticale.
        m = np.float32([[1, 0, 0], [0, 1, dy]])
        p_img = cv2.warpAffine(source, m, (L, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        p_m = cv2.warpAffine(pistons[i], m, (L, H), flags=cv2.INTER_LINEAR)[..., None]
        img = img * (1 - p_m) + p_img * p_m
    return img


# ── Huile ───────────────────────────────────────────────────────────────────

class Huile:
    def __init__(self, k1):
        rng = np.random.default_rng(11)
        lum = k1.mean(axis=2)
        y = np.arange(H, dtype=np.float32)[:, None]
        x = np.arange(L, dtype=np.float32)[None, :]
        # Doigts de coulure : quelques colonnes prennent de l'avance sur le front.
        doigts = np.clip(bruit(rng, 6, 0.01, (1, L)) - 0.6, 0, None) * 0.03
        lent = bruit(rng, 40, 30) * 0.012
        # Heure d'arrivée de l'huile, par région.
        t_cames = T_CAMES[0] + (T_CAMES[1] - T_CAMES[0]) * (x - CAMES[0]) / (CAMES[2] - CAMES[0])             + (y - CAMES[1]) / (CAMES[3] - CAMES[1]) * 0.03
        t_cyl = T_CYL[0] + (T_CYL[1] - T_CYL[0]) * (y - CYL[1]) / (CYL[3] - CYL[1]) - doigts
        t_bas = T_BAS[0] + (T_BAS[1] - T_BAS[0]) * (y - BAS[1]) / (BAS[3] - BAS[1]) - doigts
        r_cames, r_cyl, r_bas = rect(CAMES, 5), rect(CYL, 4), rect(BAS, 4)
        self.region = np.clip(r_cames + r_cyl + r_bas, 0, 1)
        arrivee = np.full((H, L), 9.0, np.float32)
        for r, t in ((r_cames, t_cames), (r_cyl, t_cyl), (r_bas, t_bas)):
            arrivee = np.where(r > 0.5, np.minimum(arrivee, t), arrivee)
        self.arrivee = arrivee + lent
        # Coulures : quelques filets épais (2 à 6 px), séparés, déroulés vers le bas.
        n = bruit(rng, 2.2, 45, (H * 2, L)) + 0.5 * bruit(rng, 4, 90, (H * 2, L))
        # Bords nets (≈ 1 px), profil bombé : une coulure est une goutte allongée, pas une tache.
        self.coulures = np.sqrt(np.clip((n - 1.0) * 2.5, 0, 1))
        # Le film accroche moins dans les cavités très sombres.
        self.accroche = lisser(lum, 0.03, 0.2)

    def epaisseur(self, t):
        cov = lisser(t - self.arrivee, 0.0, 0.035) * self.region
        dec = int(t * 1100) % H
        c = self.coulures[H - dec:2 * H - dec]
        bourrelet = np.exp(-np.clip(t - self.arrivee, 0, None) / 0.015) * cov
        # Film mince partout (≈ 0,06), coulures épaisses, bourrelet sur le front qui avance.
        return np.clip(cov * (0.06 + 0.9 * c) + 0.4 * bourrelet, 0, 1.2) * self.accroche

    @staticmethod
    def film(img, tau):
        """Film d'huile sur le métal (img en 0..1) : absorption, diffusion dorée, reflets."""
        t = tau[..., None]
        # Absorption (Beer-Lambert) : film mince à peine teinté, coulure épaisse ambrée.
        out = img * np.exp(-ABSORPTION * t)
        out = out + AMBRE * 0.05 * np.minimum(t, 1)
        h = cv2.GaussianBlur(tau, (0, 0), 0.8)
        gx = cv2.Sobel(h, cv2.CV_32F, 1, 0, ksize=3)
        gy = cv2.Sobel(h, cv2.CV_32F, 0, 1, ksize=3)
        n = np.stack([-gx * 6, -gy * 6, np.ones_like(h)], axis=2)
        n /= np.linalg.norm(n, axis=2, keepdims=True)
        # Demi-vecteur des reflets : clé à gauche, presque de face (les coulures sont
        # verticales, leur bord gauche s'allume sur toute la longueur).
        demi = np.array([-0.32, -0.08, 0.94], np.float32)
        demi = demi / np.linalg.norm(demi)
        nh = np.clip(n @ demi, 0, 1)
        # Deux lobes : reflet net (surface lisse de l'huile) et halo plus large.
        spec = (nh ** 90 * 0.95 + nh ** 14 * 0.10) * np.clip(tau * 4, 0, 1)
        lum = img.mean(axis=2, keepdims=True)
        # Métal mouillé : ses propres reflets deviennent plus vifs, un peu plus chauds.
        out = out + lum ** 4 * 0.22 * np.minimum(t * 3, 1) * np.array([1.0, 0.9, 0.7], np.float32)
        out = out + spec[..., None] * np.array([1.0, 0.95, 0.85], np.float32)
        # Ménisque : bord des coulures plus sombre.
        bord = np.clip(np.hypot(gx, gy) * 2.5, 0, 1)[..., None]
        return out * (1 - 0.25 * bord)


class Gouttes:
    """Gouttes qui se détachent des pièces et tombent au fond du carter."""

    def __init__(self):
        rng = np.random.default_rng(5)
        self.liste = []
        # Sous les cames → sur les pistons ; sous les jupes → carter ; sous les têtes de bielle.
        for _ in range(26):
            self.liste.append((rng.uniform(0.22, 0.42), rng.uniform(CAMES[0] + 20, CAMES[2] - 20), CAMES[3] - 4, 'cames'))
        for _ in range(34):
            c = rng.choice(CYLINDRES)
            self.liste.append((rng.uniform(0.5, 0.98), c + rng.uniform(-45, 45), PISTON['bas'] - 2, 'jupe'))
        for _ in range(30):
            c = rng.choice(CYLINDRES)
            self.liste.append((rng.uniform(0.74, 0.99), c + rng.uniform(-28, 28), AXE_TETE + 30, 'tete'))

    def dessiner(self, img, t, niveau, deplacements):
        g = 4800.0  # px par (unité de temps)² : une goutte tombe de 200 px en ≈ 0,03
        for t0, x, y0, src in self.liste:
            dt = t - t0
            if dt < 0 or dt > 0.06:
                continue
            if src == 'jupe':
                i = int(np.argmin([abs(x - c) for c in CYLINDRES]))
                y0 += deplacements[i]
            y = y0 + 0.5 * g * dt * dt
            fond = CHEMISE_HAUT + 20 if src == 'cames' else niveau
            if y > fond:
                continue
            v = g * dt
            long = 3 + min(10, v * 0.0025)
            yy, xx = int(y), int(x)
            if not (2 < xx < L - 3 and 6 < yy < H - 3):
                continue
            # Goutte étirée par la vitesse : corps ambre, reflet clair.
            cv2.ellipse(img, (xx, yy), (2, int(long)), 0, 0, 360, (0.62, 0.34, 0.06), -1, cv2.LINE_AA)
            cv2.ellipse(img, (xx, yy), (1, max(1, int(long) - 2)), 0, 0, 360, (0.95, 0.66, 0.22), -1, cv2.LINE_AA)
            cv2.circle(img, (xx - 1, yy + int(long * 0.4)), 1, (1.0, 0.95, 0.8), -1, cv2.LINE_AA)


class Nappe:
    """Huile au fond du carter, dans les cavités sous les têtes de bielle : le niveau monte,
    la surface ondule et brille, les têtes de bielle y plongent."""

    def __init__(self, fond):
        lum = fond.mean(axis=2)
        cav = ((lum < 0.2) * rect(CARTER, 0.1) > 0.5).astype(np.uint8)
        cav = cv2.morphologyEx(cav, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
        self.cavite = cv2.GaussianBlur(cav.astype(np.float32), (0, 0), 1.2)

    def dessiner(self, img, t):
        r = lisser(t, *T_NAPPE)
        if r <= 0:
            return img, NIVEAU[0] + 50
        niveau = NIVEAU[0] + (NIVEAU[1] - NIVEAU[0]) * r
        x = np.arange(L, dtype=np.float32)
        vague = (1.1 * np.sin(x / 21 + t * 95) + 0.6 * np.sin(x / 8.5 - t * 150)) * min(1, r * 3)
        surface = (niveau + vague)[None, :]
        y = np.arange(H, dtype=np.float32)[:, None]
        dessous = lisser(y - surface, -0.7, 0.7) * self.cavite
        prof = np.clip((y - surface) / 30, 0, 1)[..., None]
        # Vu à travers l'huile : ce qui baigne dedans, assombri et ambré ; lueur dorée
        # juste sous la surface (la lumière traverse), plus sombre en profondeur.
        vu = img * np.exp(-ABSORPTION * (1.0 + 2.5 * prof))
        huile = vu + AMBRE * (0.22 - 0.16 * prof)
        a = (dessous * 0.95)[..., None]
        out = img * (1 - a) + huile * a
        ligne = np.exp(-((y - surface - 0.5) ** 2) / 0.9) * self.cavite
        out = out + ligne[..., None] * np.array([1.0, 0.85, 0.5], np.float32) * 0.8
        return out, niveau


def noir_pur(img):
    t = np.clip((img - 32 / 255) / (64 / 255), 0, 1)
    return np.maximum(0, img - 32 / 255 * (1 - t * t * (3 - 2 * t)))


def main(a):
    k1 = cv2.cvtColor(cv2.imread(a[0]), cv2.COLOR_BGR2RGB)
    assert k1.shape[:2] == (H, L), k1.shape
    sortie = a[1]
    pistons, bielles = masques_pieces()
    fond = fond_sans_pieces(k1, pistons, bielles).astype(np.float32) / 255
    k1f = k1.astype(np.float32) / 255
    huile = Huile(k1f)
    gouttes = Gouttes()
    bain = Nappe(fond)
    cadre = rect((int(CADRE[0] * L), int(CADRE[1] * H), int(CADRE[2] * L), int(CADRE[3] * H)), 20)[..., None]

    def rendre(n):
        t = n / (N - 1)
        tau = huile.epaisseur(t)
        theta = angle(t)
        img = poser(Huile.film(fond, tau), Huile.film(k1f, tau), pistons, bielles, theta)
        img, niveau = bain.dessiner(img, t)
        img = np.ascontiguousarray(img)
        gouttes.dessiner(img, t, niveau, [p[0] for p in poses(theta)])
        return (noir_pur(np.clip(img, 0, 1)) * cadre * 255).clip(0, 255).astype(np.uint8)

    if sortie == '--apercu':
        # Planche de contrôle : images choisies (indices), empilées.
        choix = [int(v) for v in a[2].split(',')]
        planche = np.concatenate([rendre(n) for n in choix], axis=0)
        cv2.imwrite(a[3], cv2.cvtColor(planche, cv2.COLOR_RGB2BGR))
        return

    enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{L}x{H}',
                            '-r', '24', '-i', '-', '-c:v', 'libx264', '-crf', '12', '-preset', 'slow',
                            '-pix_fmt', 'yuv420p', sortie], stdin=subprocess.PIPE)
    for n in range(N):
        enc.stdin.write(rendre(n).tobytes())
        if n % 60 == 0:
            print(f'{n}/{N}', flush=True)
    enc.stdin.close()
    enc.wait()
    print('sortie :', sortie)


if __name__ == '__main__':
    main(sys.argv[1:])
