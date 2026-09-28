"""Animatique V1/V2 à partir des images E1-E3 (pas une vidéo IA) : poussée de caméra + fondu.
Sert à voir le mouvement prévu tant que les vraies vidéos V1/V2 (Wan 2.2) ne sont pas générées.
Usage : python ops/scripts/animatique.py  →  assets/ai/V1-animatique.mp4, V2-animatique.mp4"""
import subprocess, tempfile, os
from PIL import Image

AI = os.path.join(os.path.dirname(__file__), '..', '..', 'assets', 'ai')
L, H, FPS, SEC = 720, 1280, 24, 5
CIBLE = (0.72, 0.53)  # vers l'orifice de remplissage de E1

def doux(a, b, t):
    x = min(1, max(0, (t - a) / (b - a)))
    return x * x * (3 - 2 * x)

def cadre(img, zoom, cx, cy):
    w, h = L / zoom, H / zoom
    x0 = min(max(cx * L - w / 2, 0), L - w)
    y0 = min(max(cy * H - h / 2, 0), H - h)
    return img.crop((round(x0), round(y0), round(x0 + w), round(y0 + h))).resize((L, H), Image.LANCZOS)

def rendre(nom, a, b, zoom, centre, fondu):
    ia = Image.open(os.path.join(AI, a)).convert('RGB').resize((L, H))
    ib = Image.open(os.path.join(AI, b)).convert('RGB').resize((L, H))
    n = FPS * SEC
    with tempfile.TemporaryDirectory() as d:
        for i in range(n):
            t = i / (n - 1)
            z = zoom(t)
            cx, cy = centre(t)
            img = Image.blend(cadre(ia, z, cx, cy), cadre(ib, z, cx, cy), fondu(t))
            img.save(os.path.join(d, f'{i:03d}.png'))
        sortie = os.path.join(AI, nom)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', str(FPS), '-i', os.path.join(d, '%03d.png'),
                        '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '22', '-movflags', '+faststart', sortie], check=True)
    print('écrit', sortie)

mix = lambda a, b, t: a + (b - a) * t
# V1 : E1 → E2, poussée lente vers l'orifice, puis le cache s'ouvre (fondu).
rendre('V1-animatique.mp4', 'E1.png', 'E2.png',
       zoom=lambda t: 1 + 0.35 * doux(0, 1, t),
       centre=lambda t: (mix(0.5, CIBLE[0], doux(0, 1, t)), mix(0.62, CIBLE[1], doux(0, 1, t))),
       fondu=lambda t: doux(0.35, 0.8, t))
# V2 : E2 → E3, recul qui révèle tout le moteur huilé.
rendre('V2-animatique.mp4', 'E2.png', 'E3.png',
       zoom=lambda t: 1.35 - 0.35 * doux(0, 1, t),
       centre=lambda t: (mix(CIBLE[0], 0.5, doux(0, 1, t)), mix(CIBLE[1], 0.62, doux(0, 1, t))),
       fondu=lambda t: doux(0.2, 0.7, t))
