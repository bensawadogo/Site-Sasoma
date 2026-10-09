"""ciel_derive.py — fond du hero en boucle SANS IA vidéo : seuls les nuages de la photo glissent lentement
(caméra parfaitement fixe), boucle parfaite par double copie en fondu. Les nuages du haut vont un peu plus
vite que ceux de l'horizon (parallaxe). Pour une photo au ciel clair et aux nuages fins (photo B, 09/10),
où LTX 2.5 déplaçait la caméra.

  python ops/scripts/ciel_derive.py DOSSIER [CENTRE_TEL]
Entrées : fond-4k-mix.png (3840×2160), masque-ciel.png (n'importe quelle taille, ciel = blanc).
Sorties : route-1080.mp4, route-720.mp4, route-tel.mp4 (720×1280), route-affiche.webp, route-affiche-tel.webp.
CENTRE_TEL : centre horizontal du recadrage téléphone, en fraction de la largeur (0,5 par défaut).
"""
import subprocess
import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).parent))
from video_nuages import ffmpeg  # noqa: E402

IMAGES = 192          # 8 s à 24 i/s
DERIVE = 0.015        # déplacement des nuages du haut sur une boucle, en fraction de la largeur


def rendre(fond, masque, sortie, l, h, crf):
    """Écrit la vidéo (l×h) : fond fixe, ciel qui glisse vers la droite, boucle sans saut."""
    H, L = fond.shape[:2]
    yh = np.where(masque.max(1) > 0.5)[0].max() + 1           # bas du ciel
    vitesse = (np.clip(1 - np.arange(H) / yh, 0.35, 1) * DERIVE * L).astype(np.float32)  # px par boucle, par ligne
    xs, ys = np.meshgrid(np.arange(L, dtype=np.float32), np.arange(H, dtype=np.float32))
    ciel = cv2.copyMakeBorder(fond, 0, 0, int(DERIVE * L) + 4, int(DERIVE * L) + 4, cv2.BORDER_REFLECT)
    bord = int(DERIVE * L) + 4
    m = masque[..., None]
    proc = subprocess.Popen([ffmpeg(), '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{l}x{h}', '-r', '24',
                             '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', str(crf), '-pix_fmt', 'yuv420p',
                             '-movflags', '+faststart', '-an', str(sortie)], stdin=subprocess.PIPE)
    for i in range(IMAGES):
        t = i / IMAGES
        a = cv2.remap(ciel, (xs + bord - (vitesse * t)[:, None]).astype(np.float32), ys, cv2.INTER_CUBIC)
        b = cv2.remap(ciel, (xs + bord - (vitesse * (t - 1))[:, None]).astype(np.float32), ys, cv2.INTER_CUBIC)
        # fondu triangulaire : chaque copie n'est pleine qu'au milieu de sa course (fantôme minimal)
        w = 1 - t
        v = a.astype(np.float32) * w + b.astype(np.float32) * (1 - w)
        out = fond * (1 - m) + v * m
        out = cv2.resize(np.clip(out, 0, 255).astype(np.uint8), (l, h), interpolation=cv2.INTER_AREA)
        if i == 0:
            premiere = out
        proc.stdin.write(out.tobytes())
    proc.stdin.close()
    proc.wait()
    return premiere


def main(dossier, centre_tel=0.5):
    d = Path(dossier)
    fond = cv2.imread(str(d / 'fond-4k-mix.png')).astype(np.float32)
    H, L = fond.shape[:2]
    m = cv2.resize(cv2.imread(str(d / 'masque-ciel.png'), cv2.IMREAD_GRAYSCALE), (L, H), interpolation=cv2.INTER_LINEAR)
    m = cv2.GaussianBlur(cv2.erode((m > 128).astype(np.uint8), np.ones((9, 9), np.uint8)).astype(np.float32), (0, 0), 6)

    # Ordinateur : rendu en 1920×1080 depuis la 4K (réduite d'abord : calcul 4× plus léger).
    f2 = cv2.resize(fond, (1920, 1080), interpolation=cv2.INTER_AREA)
    m2 = cv2.resize(m, (1920, 1080), interpolation=cv2.INTER_AREA)
    a = rendre(f2, m2, d / 'route-1080.mp4', 1920, 1080, 22)
    cv2.imwrite(str(d / 'route-affiche.webp'), a, [cv2.IMWRITE_WEBP_QUALITY, 80])
    subprocess.run([ffmpeg(), '-v', 'error', '-y', '-i', str(d / 'route-1080.mp4'), '-vf', 'scale=1280:720:flags=lanczos',
                    '-c:v', 'libx264', '-preset', 'slow', '-crf', '25', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an',
                    str(d / 'route-720.mp4')], check=True)

    # Téléphone : recadrage vertical 9:16 dans la 4K, rendu en 720×1280.
    lt = round(H * 9 / 16)
    x0 = int(np.clip(centre_tel * L - lt / 2, 0, L - lt))
    ft = cv2.resize(fond[:, x0:x0 + lt], (720, 1280), interpolation=cv2.INTER_AREA)
    mt = cv2.resize(m[:, x0:x0 + lt], (720, 1280), interpolation=cv2.INTER_AREA)
    a = rendre(ft, mt, d / 'route-tel.mp4', 720, 1280, 25)
    cv2.imwrite(str(d / 'route-affiche-tel.webp'), a, [cv2.IMWRITE_WEBP_QUALITY, 72])
    for p in sorted(d.glob('route-*')):
        print(p.name, round(p.stat().st_size / 1e3), 'Ko')


if __name__ == '__main__':
    main(sys.argv[1], float(sys.argv[2]) if len(sys.argv) > 2 else 0.5)
