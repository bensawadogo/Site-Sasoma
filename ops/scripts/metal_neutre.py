"""Moteur du hero en métal neutre (05/10) : la teinte cuivrée des images (lumière chaude
+ film d'huile ambre) donnait un aspect « rouillé ». Saturation réduite à 45 % et léger
contraste, appliqués une fois dans les images (aucun coût dans le navigateur).
  python ops/scripts/metal_neutre.py
"""
import hashlib, json
from pathlib import Path
from PIL import Image, ImageEnhance

R = Path('C:/SITE-SASOMA')
PUB = R / 'petrovoll-astro/public/hero-video'
MAN = R / 'petrovoll-astro/src/assets/hero/video/manifest.json'
man = json.loads(MAN.read_text(encoding='utf-8'))
for nom, f in man.items():
    h = hashlib.sha1()
    for i in range(f['images']):
        p = PUB / nom / f'{i:03d}.webp'
        im = Image.open(p).convert('RGB')
        im = ImageEnhance.Contrast(ImageEnhance.Color(im).enhance(0.45)).enhance(1.06)
        im.save(p, quality=82, method=6); h.update(p.read_bytes())
    h.update((PUB / nom / 'masque.webp').read_bytes())
    f['version'] = h.hexdigest()[:10]; print(nom, f['version'])
MAN.write_text(json.dumps(man, indent=2) + '\n', encoding='utf-8')
