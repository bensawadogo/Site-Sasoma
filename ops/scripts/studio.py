"""Rendu « studio » du hero (05/10) : le garage et le moteur trop lumineux faisaient amateur.

- Moteur (images de la séquence, affiche, pièces mobiles) : exposition -12 %, contraste,
  hautes lumières adoucies, saturation 50 %, piqué ; les pièces mobiles reçoivent le même
  traitement pour rester raccord avec le bloc.
- Décor : le garage est remplacé par un fond de studio anthracite (dégradé centré sur le
  moteur, sol sombre avec reflet du moteur). « pénombre » puis « allumé » : le projecteur
  s'allume comme avant le garage. Même format que les champs du garage (aucun code changé).
À lancer sur les images d'origine + remettre_poulie.py (pas deux fois de suite).
  python ops/scripts/studio.py
"""
import hashlib, json
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

R = Path('C:/SITE-SASOMA')
PUB = R / 'petrovoll-astro/public/hero-video'
MAN = R / 'petrovoll-astro/src/assets/hero/video/manifest.json'


def studio(im):
    a = np.asarray(im.convert('RGB'), float) / 255
    g = a.mean(-1, keepdims=True); a = g + (a - g) * 0.50
    a = a * np.array([0.98, 1, 1.02]) * 0.88
    a = 0.5 + (a - 0.5) * 1.15
    a = np.where(a > 0.75, 0.75 + (a - 0.75) * 0.45, a)
    a = np.clip(a, 0, 1) ** 1.08
    return Image.fromarray((a * 255).astype(np.uint8)).filter(ImageFilter.UnsharpMask(radius=5, percent=50, threshold=2))


def fond(moteur, masque, lum):
    """Champ double (2688 x 1536) en repère des images desktop (posées en 672, 384)."""
    W, H = 2688, 1536; bas_moteur = 384 + masque.getbbox()[3]
    y, x = np.mgrid[0:H, 0:W].astype(float)
    r = np.sqrt(((x - (672 + 1344 * 0.40)) / 900) ** 2 + ((y - (384 + 768 * 0.42)) / 620) ** 2)
    a = np.array([9, 10, 12]) + (np.array([44, 47, 53]) * lum - np.array([9, 10, 12])) * np.clip(1 - r, 0, 1)[..., None] ** 1.6
    a[y > bas_moteur - 4] *= 0.55
    c = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
    refl = moteur.transpose(Image.FLIP_TOP_BOTTOM); rm = masque.transpose(Image.FLIP_TOP_BOTTOM)
    fondu = np.clip(1 - np.linspace(0, 1, rm.height)[:, None] * 2.2, 0, 1)
    rm = Image.fromarray((np.asarray(rm, float) * fondu * 0.22 * lum).astype(np.uint8))
    c.paste(refl, (672, 2 * bas_moteur - 384 - 768), rm)
    return c.filter(ImageFilter.GaussianBlur(0.6))


man = json.loads(MAN.read_text(encoding='utf-8'))
d0 = studio(Image.open(PUB / 'desktop/000.webp')); md = Image.open(PUB / 'desktop/masque.webp').getchannel('A')
champs = {e: fond(d0, md, l) for e, l in (('penombre', 0.55), ('allume', 1.0))}
for nom, f in man.items():
    h = hashlib.sha1(); q = 60 if nom == 'desktop' else 58
    for i in range(f['images']):
        p = PUB / nom / f'{i:03d}.webp'; studio(Image.open(p)).save(p, quality=q + 22, method=6); h.update(p.read_bytes())
    p = PUB / nom / 'affiche.webp'; studio(Image.open(p)).save(p, quality=q + 22, method=6); h.update(p.read_bytes())
    taille = Image.open(PUB / nom / 'decor-allume.webp').size
    for e, c in champs.items():
        p = PUB / nom / f'decor-{e}.webp'; c.resize(taille, Image.LANCZOS).save(p, quality=70, method=6); h.update(p.read_bytes())
    h.update((PUB / nom / 'masque.webp').read_bytes())
    f['version'] = h.hexdigest()[:10]; print(nom, f['version'])
for a in ('atlas', 'atlas-huile'):
    p = PUB / 'pieces' / f'{a}.webp'; im = Image.open(p).convert('RGBA')
    out = studio(im); out.putalpha(im.getchannel('A')); out.save(p, quality=88, method=6); print(a, 'traité')
MAN.write_text(json.dumps(man, indent=2) + '\n', encoding='utf-8')
