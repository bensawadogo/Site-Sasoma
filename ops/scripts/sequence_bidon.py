"""Séquence du bidon STÄRK pour le site (section produit phare au scroll).

Tour complet (06/10) : assets/ai/bidon-studio/tour, 48 vues de -30° à +322,5° (le dos du
modèle est corrigé dans ops/blender/bidon_studio.py : plus d'étiquette en miroir).
Cadre commun à toutes les vues (le bidon ne saute pas), WebP transparent en deux tailles.
  python ops/scripts/sequence_bidon.py
"""
import hashlib, json
from pathlib import Path
from PIL import Image

R = Path('C:/SITE-SASOMA')
SRC = R / 'assets/ai/bidon-studio'
OUT = R / 'petrovoll-astro/public/bidon-studio'
TAILLES = {'grand': 640, 'petit': 400}


fs = sorted((SRC / 'tour').glob('*.png'))
ims = [Image.open(f).convert('RGBA') for f in fs]
bb = [im.getbbox() for im in ims]
box = (min(b[0] for b in bb) - 8, min(b[1] for b in bb) - 8, max(b[2] for b in bb) + 8, max(b[3] for b in bb) + 8)
h = hashlib.sha1(); poids = dict.fromkeys(TAILLES, 0)
for nom in TAILLES:
    for f in (OUT / nom).glob('*.webp'):
        f.unlink()
for i, im in enumerate(ims):
    im = im.crop(box)
    for nom, larg in TAILLES.items():
        (OUT / nom).mkdir(parents=True, exist_ok=True)
        r = im.resize((larg, round(im.height * larg / im.width)), Image.LANCZOS)
        p = OUT / nom / f'{i:03d}.webp'
        r.save(p, quality=82, alpha_quality=90, method=6)
        poids[nom] += p.stat().st_size; h.update(p.read_bytes())
info = {'images': len(ims), 'tourComplet': True, 'largeurs': TAILLES,
        'ratio': round((box[3] - box[1]) / (box[2] - box[0]), 4), 'version': h.hexdigest()[:10]}
(R / 'petrovoll-astro/src/assets/bidon/sequence.json').write_text(json.dumps(info, indent=2) + '\n', encoding='utf-8')
print(info, {k: f'{v // 1024} Ko' for k, v in poids.items()})
