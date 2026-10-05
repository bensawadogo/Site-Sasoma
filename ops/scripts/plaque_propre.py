"""plaque_propre.py — K1 sans pistons ni bielles (cylindres et carter vides), par LaMa en local.

  python ops/scripts/plaque_propre.py assets/ai/v3/K1.png assets/ai/v5/K1-propre.png

Masque : pistons, bielles et têtes de bielle (masques_pieces d'animer_moteur.py), élargi
de 7 px. LaMa (big-lama, Apache-2.0) via simple-lama-inpainting, CPU.
"""
import sys

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, 'ops/scripts')
from animer_moteur import masques_pieces  # noqa: E402

source, sortie = sys.argv[1:3]
pistons, bielles = masques_pieces()
m = ((sum(pistons) + sum(bielles)) > 0.05).astype(np.uint8) * 255
m = cv2.dilate(m, np.ones((15, 15), np.uint8))
Image.fromarray(m).save(sortie.replace('.png', '-masque.png'))

from simple_lama_inpainting import SimpleLama  # noqa: E402

lama = SimpleLama()
res = lama(Image.open(source).convert('RGB'), Image.fromarray(m))
res = res.crop((0, 0, 1344, 768))
res.save(sortie)
print('sortie :', sortie, res.size)
