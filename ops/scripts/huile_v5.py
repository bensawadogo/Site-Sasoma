"""huile_v5.py — l'huile du hero v5 : ce qui est calculé d'avance (Python).

Le moteur ne reçoit plus un « rideau » d'huile : on suit le vrai circuit (docs/plan-correction-hero-v5.md).
  1. Moteur à l'arrêt, l'huile versée tombe dans la culasse et redescend au carter : filet et
     nappe sont dessinés en temps réel par le site (moteur-vivant.ts).
  2. Le moteur démarre ; la pompe envoie l'huile aux paliers du vilebrequin et aux têtes de
     bielle (« bas »), puis elle est projetée sur les cylindres et les pistons (« pistons »),
     enfin elle monte jusqu'aux cames et soupapes (« cames ») et redescend en coulures.

Ce module fournit :
  - film() : film d'huile mince sur du métal (absorption ambrée, reflets, ménisque) ;
  - mouiller() : version huilée d'une pièce (sprite RGBA) — film, coulures fines qui suivent
    la pièce de haut en bas, perles au bord inférieur, gouttes pendantes ;
  - tau_fond() : épaisseur d'huile sur les parois FIXES du moteur selon l'avancement (t3),
    pour les images de la séquence (moteur_v5.py --fond).
Les heures (fractions de t3) sont les mêmes que dans moteur-vivant.ts (HUILE).
"""
import cv2
import numpy as np

from animer_moteur import AMBRE, H, L

ABSORPTION = np.array([0.07, 0.36, 1.05], np.float32)  # « A doux » : film plus clair, plus doré
# Palette d'huile « A doux » (RGB) : ambre sombre -> or -> blanc doré (comme ramp() de maquettes.py).
OR_SOMBRE = np.array([150, 70, 10], np.float32) / 255
OR = np.array([255, 175, 50], np.float32) / 255
OR_BLANC = np.array([255, 245, 200], np.float32) / 255


def rampe(v):
    """Couleur d'huile selon la luminosité (v 0..1) : ambre sombre -> or -> blanc doré."""
    v = np.clip(v, 0, 1)[..., None]
    a = np.clip(v / 0.55, 0, 1)
    b = np.clip((v - 0.55) / 0.45, 0, 1)
    return (OR_SOMBRE * (1 - a) + OR * a) * (1 - b) + OR_BLANC * b
# Avancement de l'huile sous pression (fractions de t3) — identique à moteur-vivant.ts.
HUILE = {'bas': (0.32, 0.50), 'pistons': (0.50, 0.68), 'cames': (0.68, 0.86)}
# Régions des parois fixes (x0, y0, x1, y1, pixels de K1).
REGIONS = {
    'bas': (418, 396, 958, 640),      # carter : parois derrière les bielles
    'pistons': (418, 243, 958, 396),  # chemises, cloisons entre cylindres
    'cames': (440, 138, 962, 243),    # culasse, autour de la distribution
}


def lisser(x, a, b):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def film(img, tau):
    """Film d'huile sur le métal (img RGB 0..1, tau épaisseur 0..1+)."""
    t = tau[..., None]
    out = img * np.exp(-ABSORPTION * t)
    lum0 = img.mean(axis=2, keepdims=True)
    # Cœur lumineux : le métal mouillé prend la couleur de l'huile (or), d'autant plus clair qu'il l'était.
    dore = rampe(np.clip(lum0[..., 0] * 1.25 + 0.12, 0, 1))
    mouille = np.minimum(t * 3.5, 1) * 0.16
    out = out * (1 - mouille) + dore * mouille
    out = out + AMBRE * 0.07 * np.minimum(t, 1)
    h = cv2.GaussianBlur(tau, (0, 0), 0.8)
    gx = cv2.Sobel(h, cv2.CV_32F, 1, 0, ksize=3)
    gy = cv2.Sobel(h, cv2.CV_32F, 0, 1, ksize=3)
    n = np.stack([-gx * 6, -gy * 6, np.ones_like(h)], axis=2)
    n /= np.linalg.norm(n, axis=2, keepdims=True)
    demi = np.array([-0.32, -0.08, 0.94], np.float32)
    demi = demi / np.linalg.norm(demi)
    nh = np.clip(n @ demi, 0, 1)
    spec = (nh ** 90 * 0.95 + nh ** 14 * 0.10) * np.clip(tau * 4, 0, 1)
    lum = img.mean(axis=2, keepdims=True)
    # Métal mouillé : ses propres reflets deviennent plus vifs et plus chauds, le reste plus profond.
    out = out * (1 - 0.12 * np.minimum(t * 4, 1)) + lum ** 4 * 0.3 * np.minimum(t * 3, 1) * np.array([1.0, 0.9, 0.7], np.float32)
    out = out + spec[..., None] * np.array([1.0, 0.95, 0.85], np.float32)
    bord = np.clip(np.hypot(gx, gy) * 2.5, 0, 1)[..., None]
    out = out * (1 - 0.18 * bord)
    # Halo chaud discret autour des zones huilées (précalculé : un seul flou, hors temps réel).
    src = np.clip(tau, 0, 1.2)[..., None] * dore
    halo = cv2.GaussianBlur(src, (0, 0), 6) * 0.10 + cv2.GaussianBlur(src, (0, 0), 2) * 0.06
    return np.clip(out + halo * np.array([1.0, 0.8, 0.45], np.float32), 0, 1)


def mouiller(rgba, graine, brillant=False):
    """Version huilée d'une pièce (RGBA 0..1, orientation de K1) : film, coulures, perles."""
    rng = np.random.default_rng(graine)
    h, l = rgba.shape[:2]
    a = rgba[..., 3]
    plein = (a > 0.5).astype(np.float32)
    # Film inégal : zones mouillées et zones presque sèches (taches de bruit lissé).
    taches = cv2.GaussianBlur(rng.standard_normal((h, l)).astype(np.float32), (0, 0), max(2.0, min(h, l) / 10))
    taches = np.clip((taches - taches.mean()) / (taches.std() + 1e-6) * 0.5 + 0.55, 0, 1)
    tau = 0.2 * taches * plein
    # Coulures : quelques filets (2 à 4 px) qui descendent la pièce depuis un point au hasard,
    # en suivant la matière (s'arrêtent où elle s'arrête).
    for _ in range(max(2, l // 14)):
        x = int(rng.integers(2, max(3, l - 2)))
        y0 = int(rng.integers(0, max(1, h // 2)))
        larg = rng.uniform(1.6, 2.8)
        xs = np.arange(l, dtype=np.float32)
        profil = np.clip(1 - ((xs - x) / larg) ** 2, 0, 1)
        epais = rng.uniform(0.7, 1.1)
        for y in range(y0, h):
            if plein[y, x] < 0.5:
                # Bord : la coulure s'y accumule en perle.
                yy = slice(max(0, y - 3), y)
                tau[yy] += profil * 1.4 * plein[yy]
                break
            tau[y] += profil * epais * (0.6 + 0.4 * (y - y0) / max(1, h - y0)) * plein[y]
    # Perles le long des bords inférieurs (là où l'huile s'accumule avant de tomber).
    dessous = plein - np.vstack([plein[1:], np.zeros((1, l), np.float32)])
    dessous = np.clip(dessous, 0, 1)
    perles = cv2.GaussianBlur(dessous, (0, 0), 1.2) * (rng.random((h, l)) > 0.5)
    tau += cv2.dilate(perles, np.ones((3, 3), np.uint8)) * 0.5 * plein
    tau = cv2.GaussianBlur(tau, (0, 0), 0.6)
    out = rgba.copy()
    out[..., :3] = film(rgba[..., :3], tau)
    # Éclats : là où le métal brillait, l'huile fait un reflet plus net et plus chaud.
    lum = rgba[..., :3].mean(axis=2, keepdims=True)
    out[..., :3] = np.clip(out[..., :3] + np.clip(lum - 0.55, 0, 1) ** 1.5 * 0.7 * np.array([1.0, 0.92, 0.75]) * np.minimum(tau[..., None] * 5, 1), 0, 1)
    if brillant:
        # Distribution : film très mince (peu de teinte), mais reflets ponctuels nets sur les
        # lobes et les spires — c'est la brillance qui dit « mouillé », pas la couleur.
        out[..., :3] = rgba[..., :3] * 0.55 + out[..., :3] * 0.45
        pic = np.clip(lum[..., 0] - 0.35, 0, 1) ** 2 * 2.2
        pic = pic * (rng.random(pic.shape) > 0.35)
        pic = cv2.GaussianBlur(pic, (0, 0), 0.5)
        out[..., :3] = np.clip(out[..., :3] + pic[..., None] * np.array([1.0, 0.95, 0.85]), 0, 1)
    # Gouttes pendantes sous les bords inférieurs (quelques-unes) : un peu d'ambre opaque.
    ys, xs_ = np.nonzero(dessous > 0.5)
    for k in rng.choice(len(ys), size=min(len(ys), max(1, l // 30)), replace=False) if len(ys) else []:
        y, x = int(ys[k]), int(xs_[k])
        for dy in range(1, 4):
            if y + dy < h:
                r_ = 1.6 - dy * 0.3
                for dx in (-1, 0, 1):
                    if 0 <= x + dx < l and abs(dx) <= r_:
                        out[y + dy, x + dx, :3] = np.array([0.92, 0.62, 0.16]) * (1 - 0.15 * dy) + 0.1
                        out[y + dy, x + dx, 3] = max(out[y + dy, x + dx, 3], 0.9 - 0.2 * dy)
    return out


def tau_fond(t3, graine=21):
    """Épaisseur d'huile sur les parois fixes (H, L) quand l'avancement vaut t3."""
    rng = np.random.default_rng(graine)
    tau = np.zeros((H, L), np.float32)
    for nom, (x0, y0, x1, y1) in REGIONS.items():
        w = float(lisser(t3, *HUILE[nom]))
        if w <= 0:
            continue
        zone = np.zeros((H, L), np.float32)
        zone[y0:y1, x0:x1] = 1
        zone = cv2.GaussianBlur(zone, (0, 0), 6)
        # Film sur les parois : tout ce que l'huile a touché luit (plus épais vers le bas).
        tau += 0.22 * w * zone
        if nom == 'bas':
            # Projections du vilebrequin : gouttelettes sur les parois du carter.
            r2 = np.random.default_rng(graine + 1)
            n = int(260 * w)
            gx = r2.integers(x0, x1, 260)[:n]
            gy = r2.integers(y0, y1, 260)[:n]
            g = np.zeros((H, L), np.float32)
            g[gy, gx] = 1
            tau += cv2.GaussianBlur(g, (0, 0), 0.9) * 1.6
        if nom == 'pistons':
            # Coulures sur les cloisons entre cylindres : elles descendent avec l'avancement.
            for xc in (412, 548, 687, 827, 957):
                for k in range(3):
                    x = xc + rng.integers(-4, 5)
                    retard = rng.uniform(0, 0.4)
                    f = float(np.clip((w - retard) / 0.6, 0, 1))
                    yf = int(y0 + (y1 - y0) * f)
                    if yf <= y0:
                        continue
                    xs = np.arange(L, dtype=np.float32)
                    profil = np.clip(1 - ((xs - x) / 1.8) ** 2, 0, 1)[None, :]
                    tau[y0:yf] += profil * 0.6
                    tau[max(y0, yf - 4):yf] += profil * 0.6  # perle de tête
        if nom == 'cames':
            # Après les cames, l'huile retombe : gouttelettes sur la culasse.
            r3 = np.random.default_rng(graine + 3)
            n = int(160 * w)
            gx = r3.integers(x0, x1, 160)[:n]
            gy = r3.integers(y0, y1, 160)[:n]
            g = np.zeros((H, L), np.float32)
            g[gy, gx] = 1
            tau += cv2.GaussianBlur(g, (0, 0), 0.8) * 1.2
    return tau
