"""Remet la poulie avant et le volant de K1 dans la séquence du hero (05/10).

Ils avaient été effacés de la plaque (LaMa) pour être redessinés en tournant par le
navigateur, mais rien ne les redessine : le moteur paraissait incomplet (bloc coupé à
gauche) et le masque en retirait la place. On recolle les pièces de K1 (fixes) dans chaque
image, avec le même retournement/cadrage que scripts/build-hero-video.mjs, et le masque
reprend le détourage complet (assets/ai/v5/masque-moteur.png).
  python ops/scripts/remettre_poulie.py
"""
import hashlib, json
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter, ImageOps

R = Path('C:/SITE-SASOMA')
PUB = R / 'petrovoll-astro/public/hero-video'
MAN = R / 'petrovoll-astro/src/assets/hero/video/manifest.json'
k1 = ImageOps.mirror(Image.open(R / 'assets/ai/v3/K1.png').convert('RGB'))
plein = ImageOps.mirror(Image.open(R / 'assets/ai/v5/masque-moteur.png').convert('L'))
zones = Image.new('L', k1.size, 0)
for x0, x1 in ((320, 392), (960, 1030)):  # poulie avant, volant (repère K1, non retourné)
    zones.paste(255, (1344 - x1 - 6, 424, 1344 - x0 + 6, 621))
zones = zones.filter(ImageFilter.GaussianBlur(4))
colle = Image.fromarray((np.asarray(plein, float) * np.asarray(zones, float) / 255).astype(np.uint8))
man = json.loads(MAN.read_text(encoding='utf-8'))
for nom, f in man.items():
    r = f['recadrage']
    boite = (round(r['x'] * 1344), round(r['y'] * 768), round((r['x'] + r['l']) * 1344), round((r['y'] + r['h']) * 768))
    taille = (f['largeur'], f['hauteur'])
    piece = k1.crop(boite).resize(taille, Image.LANCZOS)
    alpha = colle.crop(boite).resize(taille, Image.LANCZOS)
    h = hashlib.sha1()
    for i in range(f['images']):
        p = PUB / nom / f'{i:03d}.webp'
        im = Image.open(p).convert('RGB'); im.paste(piece, (0, 0), alpha); im.save(p, quality=82, method=6)
        h.update(p.read_bytes())
    m = Image.new('RGBA', taille, (255, 255, 255, 0)); m.putalpha(plein.crop(boite).resize(taille, Image.LANCZOS))
    m.save(PUB / nom / 'masque.webp', quality=90, alpha_quality=100, method=6); h.update((PUB / nom / 'masque.webp').read_bytes())
    f['version'] = h.hexdigest()[:10]
    print(nom, f['images'], 'images, version', f['version'])
MAN.write_text(json.dumps(man, indent=2) + '\n', encoding='utf-8')
