"""maquette_hero.py — exemple de rendu du hero (ordinateur 16:9 + téléphone) pour chaque photo candidate.

  python ops/scripts/maquette_hero.py DOSSIER A B C D
Photo X.jpg|png|webp, ou X-ordi.* + X-tel.* (version téléphone séparée). Écrit DOSSIER/rendu-X.jpg (ordinateur 1440×810 + téléphone 390×844 côte à côte) et DOSSIER/planche-rendus.jpg (réduite).
Mesure aussi la netteté (variance du laplacien) et l'agrandissement nécessaire.
"""
import io
import sys
from pathlib import Path

from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageStat

RACINE = Path(__file__).resolve().parents[2]
SITE = RACINE / 'petrovoll-astro'


def police(nom, taille):
    f = TTFont(SITE / 'public/fonts' / nom)
    f.flavor = None
    tampon = io.BytesIO()
    f.save(tampon)
    tampon.seek(0)
    return ImageFont.truetype(tampon, taille)


BIDON = Image.open(SITE / 'public/bidon-studio/grand/000.webp').convert('RGBA')


def recadrer(im, l, h):
    """Recadrage centré « cover » puis mise à l'échelle (montre le flou réel si la photo est trop petite)."""
    r = max(l / im.width, h / im.height)
    im = im.resize((round(im.width * r), round(im.height * r)), Image.LANCZOS)
    x, y = (im.width - l) // 2, (im.height - h) // 2
    return im.crop((x, y, x + l, y + h)), r


def degrade(im, haut=0.25, bas=0.55):
    """Assombrit le haut (barre de menu) et le bas (titre) pour la lisibilité, comme le hero actuel."""
    l, h = im.size
    masque = Image.new('L', (1, h))
    for y in range(h):
        t = y / h
        a = 140 * max(0, 1 - t / haut) if t < haut else 0
        if t > 1 - bas:
            a = max(a, 215 * ((t - (1 - bas)) / bas) ** 1.4)
        masque.putpixel((0, y), int(a))
    noir = Image.new('RGB', (l, h), (5, 11, 24))
    return Image.composite(noir, im, masque.resize((l, h)))


def maquette(photo, l, h, telephone):
    fond, r = recadrer(photo, l, h)
    fond = degrade(fond)
    d = ImageDraw.Draw(fond)
    # barre de menu
    d.rectangle((0, 0, l, 56 if not telephone else 48), fill=(255, 255, 255))
    d.text((24, 12), 'SASOMA', font=police('bebas-neue-400.woff2', 34 if not telephone else 28), fill=(18, 40, 90))
    if not telephone:
        menu = police('inter-variable.woff2', 13)
        for i, t in enumerate(['PRODUITS', 'NOS MÉTIERS', 'À PROPOS', 'CONTACT']):
            d.text((l * 0.42 + i * 105, 21), t, font=menu, fill=(60, 60, 70))
        d.rectangle((l - 120, 10, l - 24, 46), fill=(204, 85, 0))
        d.text((l - 92, 20), 'DEVIS', font=police('inter-variable.woff2', 14), fill='white')
    # bidon posé à droite (ordinateur) ou en haut à droite (téléphone)
    hb = int(h * (0.62 if not telephone else 0.30))
    b = BIDON.resize((int(BIDON.width * hb / BIDON.height), hb), Image.LANCZOS)
    ombre = Image.new('RGBA', b.size, (0, 0, 0, 0))
    ombre.putalpha(b.getchannel('A').point(lambda a: a * 0.55))
    ombre = ombre.filter(ImageFilter.GaussianBlur(14))
    x = int(l * 0.68) if not telephone else l - b.width - 18
    y = int(h * 0.22) if not telephone else int(h * 0.12)
    fond.paste(ombre, (x + 12, y + 18), ombre)
    fond.paste(b, (x, y), b)
    # titre
    sur = police('inter-variable.woff2', 13 if not telephone else 11)
    titre = police('bebas-neue-400.woff2', 76 if not telephone else 46)
    x0, y0 = (64, int(h * 0.60)) if not telephone else (20, int(h * 0.66))
    d.text((x0, y0), 'LUBRIFIANTS ALLEMANDS DEPUIS 1999', font=sur, fill=(242, 190, 60))
    lignes = ['PETROVÖLL AU BURKINA FASO'] if not telephone else ['PETROVÖLL AU', 'BURKINA FASO']
    for i, t in enumerate(lignes):
        d.text((x0, y0 + 24 + i * (titre.size * 0.95)), t, font=titre, fill='white')
    d.text((x0, y0 + 34 + len(lignes) * titre.size * 0.95), 'Faites défiler ↓', font=sur, fill=(220, 220, 230))
    return fond, r


def nettete(im):
    g = im.convert('L').filter(ImageFilter.FIND_EDGES)
    return ImageStat.Stat(g).var[0]


def main(dossier, noms):
    dossier = Path(dossier)
    vignettes = []
    for n in noms:
        trouver = lambda b: next((dossier / f'{b}{e}' for e in ('.jpg', '.png', '.webp') if (dossier / f'{b}{e}').exists()), None)
        photo = Image.open(trouver(n) or trouver(f'{n}-ordi')).convert('RGB')
        photo_tel = Image.open(trouver(f'{n}-tel')).convert('RGB') if trouver(f'{n}-tel') else photo
        ordi, r1 = maquette(photo, 1440, 810, False)
        tel, r2 = maquette(photo_tel, 390, 844, True)
        print(f'{n}: {photo.size[0]}×{photo.size[1]}  agrandissement ordinateur ×{r1:.2f}, téléphone (écran ×3) ×{r2 * 3:.2f}  netteté {nettete(photo):.0f}')
        planche = Image.new('RGB', (1440 + 20 + 390, 844), (30, 30, 30))
        planche.paste(ordi, (0, 17))
        planche.paste(tel, (1460, 0))
        planche.save(dossier / f'rendu-{n}.jpg', quality=88)
        v = planche.resize((planche.width // 3, planche.height // 3), Image.LANCZOS)
        ImageDraw.Draw(v).text((8, 4), n, font=police('bebas-neue-400.woff2', 30), fill=(255, 220, 0))
        vignettes.append(v)
    col = 2
    w, h = vignettes[0].size
    rangs = (len(vignettes) + col - 1) // col
    tout = Image.new('RGB', (col * (w + 8), rangs * (h + 8)), (15, 15, 15))
    for i, v in enumerate(vignettes):
        tout.paste(v, ((i % col) * (w + 8), (i // col) * (h + 8)))
    tout.save(dossier / 'planche-rendus.jpg', quality=85)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2:])
