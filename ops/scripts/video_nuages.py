"""video_nuages.py — fond du hero en boucle : photo 4K fixe (route, collines, champs nets) dont SEUL le ciel
est remplacé par les nuages animés d'une vidéo IA (LTX 2.5, caméra fixe vérifiée, agrandie ×4 Real-ESRGAN).

  python ops/scripts/video_nuages.py DOSSIER
Entrées de DOSSIER (voir docs/hero-nuages.md) :
  fond-4k-mix.png      photo élargie (Adobe Firefly) agrandie en 3840×2160
  masque-ciel.png      masque du ciel (Adobe, sélection « the sky with the clouds »), taille de D-large-adobe.png
  nuages-ltx25-x4.mp4  vidéo des nuages ×4 (5376×3072), issue de entree-1344.png
Sorties : hero-nuages-4k.mp4 (3840×2160), hero-nuages-1080.mp4, hero-nuages-720.mp4,
          hero-nuages-tel.mp4 (1080×1920, recadrage central), hero-nuages-affiche.webp (première image).
"""
import os
import shutil
import subprocess
import sys
from pathlib import Path

import cv2
import numpy as np

L4, H4 = 3840, 2160
GRAND = (2580, 1451)                 # taille de *-large-adobe.png (relue dans main)
ECHELLE_VIDEO = 1365 / GRAND[0]      # entree-1344.png = photo large réduite à 1365×768 puis recadrée x 10..1354
DECALAGE_X = 10
FONDU = int(os.environ.get('FONDU', 24))   # images de fondu enchaîné pour la boucle (24 = 1 s)
ETAL = os.environ.get('ETAL', 'ecart')
BRUME = float(os.environ.get('BRUME', 0))      # amplitude (px 4K) de la brume de chaleur à l'horizon, 0 = aucune     # « mediane » quand la vidéo ajoute des nuages à un ciel vide


def ffmpeg():
    return shutil.which('ffmpeg') or next(Path.home().glob('AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg*/ffmpeg-*/bin/ffmpeg.exe'))


def lire_video(chemin, debut=0, nombre=None):
    """Lit les images à la demande (une vidéo 5376×3072 entière ne tient pas en mémoire)."""
    cap = cv2.VideoCapture(str(chemin))
    cap.set(cv2.CAP_PROP_POS_FRAMES, debut)
    i = 0
    while nombre is None or i < nombre:
        ok, im = cap.read()
        if not ok:
            break
        yield im
        i += 1


def placer(im):
    """Image de la vidéo (n'importe quelle échelle) → repère 4K, alignée exactement sur la photo."""
    h, w = im.shape[:2]
    k = (L4 / GRAND[0]) / ECHELLE_VIDEO * (1344 / w)   # px 4K par px de cette vidéo
    im = cv2.resize(im, (round(w * k), round(h * k)), interpolation=cv2.INTER_AREA)
    x0 = round(DECALAGE_X * (L4 / GRAND[0]) / ECHELLE_VIDEO)
    bord_d = max(0, L4 - x0 - im.shape[1])
    im = cv2.copyMakeBorder(im, 0, max(0, H4 - im.shape[0]), x0, bord_d, cv2.BORDER_REPLICATE)
    return im[:H4, :L4]


def horizon(m):
    """Ligne d'horizon : premier pixel de sol (masque du ciel < 0,5) de chaque colonne, lissée."""
    sol = m[..., 0] < 0.5
    y = np.where(sol.any(0), sol.argmax(0), H4 // 2).astype(np.float32)
    return cv2.GaussianBlur(y[None, :], (0, 0), 40)[0]


def brume(out, yh, phase):
    """Brume de chaleur (mirage) : ondulation horizontale fine sur une bande autour de l'horizon,
    plus forte juste sous l'horizon (route chaude). `phase` ∈ [0, 1) : périodique, la boucle reste parfaite."""
    haut, bas = int(yh.min() - 0.03 * H4), int(yh.max() + 0.10 * H4)
    bande = out[haut:bas]
    ys, xs = np.mgrid[haut:bas, 0:L4].astype(np.float32)
    d = ys - yh[None, :]                                   # distance à l'horizon (px)
    poids = np.exp(-((d - 0.012 * H4) / (0.035 * H4)) ** 2)
    t = 2 * np.pi * phase
    dx = BRUME * poids * (np.sin(ys / 5.0 + xs / 90.0 + 3 * t) * 0.6 + np.sin(ys / 11.0 - xs / 230.0 - 2 * t) * 0.4)
    dy = 0.35 * BRUME * poids * np.sin(xs / 60.0 + 4 * t)
    out[haut:bas] = cv2.remap(bande, xs + dx, ys - haut + dy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    return out


def main(dossier):
    global GRAND, ECHELLE_VIDEO
    d = Path(dossier)
    grand = next(d.glob('*-large-adobe.png'), None)
    if grand:
        GRAND = cv2.imread(str(grand)).shape[1::-1]
        ECHELLE_VIDEO = 1365 / GRAND[0]
    fond = cv2.imread(str(d / 'fond-4k-mix.png')).astype(np.float32)
    m = cv2.imread(str(d / 'masque-ciel.png'), cv2.IMREAD_GRAYSCALE)
    m = cv2.resize(m, (L4, H4), interpolation=cv2.INTER_LINEAR)
    m = cv2.erode((m > 128).astype(np.uint8), np.ones((25, 25), np.uint8)).astype(np.float32)
    m = cv2.GaussianBlur(m, (0, 0), 8)[..., None]        # collines nettes de la photo, ciel de la vidéo

    video = d / (sys.argv[2] if len(sys.argv) > 2 else 'nuages-ltx25-x4.mp4')
    n = int(cv2.VideoCapture(str(video)).get(cv2.CAP_PROP_FRAME_COUNT))
    fin = [placer(im) for im in lire_video(video, n - FONDU, FONDU)]   # fin de la vidéo, pour le fondu
    print('images', n, len(fin))
    images = lire_video(video)
    premiere = next(images)
    # étalonnage : le ciel de la vidéo prend la moyenne/écart-type du ciel de la photo (calculé sur l'image 0)
    v0 = placer(premiere).astype(np.float32)
    sel = m[..., 0] > 0.9
    if ETAL == 'mediane':
        # ciel bleu seul (pas les nuages, plus clairs et moins saturés) : même médiane que la photo
        bleu = sel & (v0[..., 0] - v0[..., 2] > 25)
        gain = np.ones(3, np.float32)
        decal = np.median(fond[sel], 0) - np.median(v0[bleu], 0)
    else:
        gain = fond[sel].std(0) / (v0[sel].std(0) + 1e-3)
        decal = fond[sel].mean(0) - v0[sel].mean(0) * gain

    boucle = n - FONDU
    yh = horizon(m)
    sortie = d / 'hero-nuages-4k.mp4'
    proc = subprocess.Popen([ffmpeg(), '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{L4}x{H4}', '-r', '24', '-i', '-',
                             '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(sortie)],
                            stdin=subprocess.PIPE)
    for i in range(boucle):
        v = v0 if i == 0 else placer(next(images)).astype(np.float32)
        if i < FONDU:                                     # fondu : la fin de la vidéo rejoint son début
            w = i / FONDU
            v = v * w + fin[i].astype(np.float32) * (1 - w)
        v = v * gain + decal
        out = np.clip(fond * (1 - m) + v * m, 0, 255).astype(np.uint8)
        if BRUME:
            out = brume(out, yh, i / boucle)
        if i == 0:
            cv2.imwrite(str(d / 'hero-nuages-affiche.webp'), cv2.resize(out, (1920, 1080), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_WEBP_QUALITY, 88])
        proc.stdin.write(out.tobytes())
    proc.stdin.close()
    proc.wait()
    f = ffmpeg()
    for nom, filtre, crf in [('hero-nuages-1080.mp4', 'scale=1920:1080:flags=lanczos', 21),
                             ('hero-nuages-720.mp4', 'scale=1280:720:flags=lanczos', 24),
                             ('hero-nuages-tel.mp4', 'crop=1215:2160:1312:0,scale=1080:1920:flags=lanczos', 21)]:
        subprocess.run([f, '-v', 'error', '-y', '-i', str(sortie), '-vf', filtre, '-c:v', 'libx264', '-preset', 'slow', '-crf', str(crf),
                        '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', str(d / nom)], check=True)
    for p in sorted(d.glob('hero-nuages-*')):
        print(p.name, round(p.stat().st_size / 1e6, 2), 'Mo')


if __name__ == '__main__':
    main(sys.argv[1])
