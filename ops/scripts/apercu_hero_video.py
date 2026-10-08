"""apercu_hero_video.py — aperçu du hero : vidéo de fond (nuages) + calque moteur/bidon/titre de maquette_hero_moteur.

  python ops/scripts/apercu_hero_video.py VIDEO_1080 VIDEO_TEL SORTIE_DOSSIER
Le calque est extrait par différence noir/blanc (alpha exact), puis incrusté par ffmpeg.
"""
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
from maquette_hero_moteur import scene  # noqa: E402
from video_nuages import ffmpeg  # noqa: E402


def calque(l, h, telephone):
    noir = np.asarray(scene(Image.new('RGB', (l, h), (0, 0, 0)), l, h, telephone), np.float32)
    blanc = np.asarray(scene(Image.new('RGB', (l, h), (255, 255, 255)), l, h, telephone), np.float32)
    a = np.clip(1 - (blanc - noir).mean(2, keepdims=True) / 255, 0, 1)
    rgb = np.where(a > 1e-3, noir / np.maximum(a, 1e-3), 0)
    return Image.fromarray(np.concatenate([np.clip(rgb, 0, 255), a * 255], 2).astype(np.uint8), 'RGBA')


def main(v1080, vtel, dossier):
    d = Path(dossier)
    for video, (l, h, tel), nom in [(v1080, (1920, 1080, False), 'apercu-ordi.mp4'), (vtel, (1080, 1920, True), 'apercu-tel.mp4')]:
        c = d / f'_calque-{nom}.png'
        calque(l, h, tel).save(c)
        subprocess.run([ffmpeg(), '-v', 'error', '-y', '-stream_loop', '1', '-i', video, '-i', str(c), '-filter_complex', '[0][1]overlay=0:0',
                        '-c:v', 'libx264', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', str(d / nom)], check=True)
        print(nom, round((d / nom).stat().st_size / 1e6, 2), 'Mo')


if __name__ == '__main__':
    main(*sys.argv[1:4])
