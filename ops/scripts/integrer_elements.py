"""Intègre au site les nouveaux éléments du client (photos/vidéos WhatsApp du 04/10).

Choix faits sur la planche de contrôle (docs/nouveaux-elements.json, numéros =
ordre alphabétique des fichiers). Photos produits : recadrées en carré autour du
sujet (masque rembg seulement pour le situer : la photo reste naturelle), WebP
1200 px. Vidéos : une image fixe sert de couverture de secteur.
Usage : python integrer_elements.py
"""
import json, sys
from pathlib import Path
import cv2
from PIL import Image, ImageOps
from rembg import remove, new_session

RACINE = Path('C:/SITE-SASOMA')
SITE = RACINE / 'petrovoll-astro'
DOC = json.loads((RACINE / 'docs/nouveaux-elements.json').read_text(encoding='utf-8'))
FICHIERS = [v['chemin'] for v in DOC.values()]
PHOTOS = SITE / 'src/assets/produits/nouveaux'
COUV = SITE / 'src/assets/secteurs'

# slug -> (nom, secteur, marque, référence, numéros de photos, conditionnement, texte)
PRODUITS = {
    'filtres-air-poids-lourds': ('Filtres à air poids lourds (primaire et sécurité)', 'distribution', 'Deshensun', '',
        [5, 6, 0], 'À l’unité ou par carton',
        'Filtres à air pour camions, bus et engins : cartouche primaire et cartouche de sécurité. '
        'Plusieurs dimensions en stock, donnez-nous la référence d’origine.'),
    'filtre-huile-cat-1r-1807': ('Filtre à huile CAT 1R-1807', 'distribution', 'CAT', '1R-1807', [2], 'À l’unité',
        'Filtre à huile moteur à visser, référence Caterpillar 1R-1807, pour engins et groupes électrogènes.'),
    'filtre-carburant-cat-1r-0750': ('Filtre à carburant CAT 1R-0750', 'distribution', 'CAT', '1R-0750', [3], 'À l’unité',
        'Filtre à gasoil haute efficacité, référence Caterpillar 1R-0750.'),
    'filtre-carburant-perkins': ('Filtre à carburant Perkins', 'distribution', 'Perkins', '', [1], 'À l’unité',
        'Filtre à gasoil pour moteurs Perkins (groupes électrogènes, engins).'),
    'filtre-separateur-pl420': ('Filtre séparateur eau / gasoil PL420', 'distribution', '', 'PL420', [4], 'À l’unité',
        'Préfiltre séparateur d’eau avec bol transparent, type PL420, pour poids lourds et engins.'),
    'filtre-scania-1397764': ('Filtre à huile pour Scania, réf. 1397764', 'distribution', 'Scania', '1397764', [7], 'À l’unité',
        'Cartouche filtrante d’huile pour camions Scania, référence 1397764.'),
    'filtre-scania-1928868': ('Filtre à huile pour Scania, réf. 1928868', 'distribution', 'Scania', '1928868', [11], 'À l’unité',
        'Cartouche filtrante d’huile pour camions Scania, référence 1928868.'),
    'filtre-scania-1699168': ('Filtre pour Scania, réf. 1699168', 'distribution', 'Scania', '1699168', [13], 'À l’unité',
        'Filtre pour camions Scania, référence 1699168.'),
    'filtre-scania-1852005': ('Filtre pour Scania, réf. 1852005', 'distribution', 'Scania', '1852005', [15], 'À l’unité',
        'Filtre pour camions Scania, référence 1852005.'),
    'filtres-daf': ('Filtres pour camions DAF', 'distribution', 'DAF', '', [8], 'À l’unité',
        'Filtres pour camions DAF. Donnez-nous la référence ou le modèle du camion.'),
    'pneu-double-road-dr802': ('Pneu camion Double Road DR802 — 315/80 R22.5', 'pneumatiques', 'Double Road', 'DR802',
        [20, 19, 23], 'À l’unité ou par lot',
        'Pneu poids lourd tout-terrain 315/80 R22.5, sculpture profonde pour routes et pistes. '
        'Stock disponible à Ouagadougou.'),
    'pneu-double-road-dr636': ('Pneu camion Double Road DR636', 'pneumatiques', 'Double Road', 'DR636', [16, 18],
        'À l’unité ou par lot',
        'Pneu poids lourd pour essieu porteur et remorque, longue durée sur route. Dimension indiquée sur l’étiquette du stock.'),
    'pneu-double-road-dr638': ('Pneu camion Double Road DR638', 'pneumatiques', 'Double Road', 'DR638', [21],
        'À l’unité ou par lot', 'Pneu poids lourd à sculpture mixte, route et chantier.'),
    'pneu-longmarch-lm526': ('Pneu camion Longmarch LM526', 'pneumatiques', 'Longmarch', 'LM526', [12],
        'À l’unité ou par lot', 'Pneu poids lourd Longmarch LM526 pour essieu moteur.'),
}
# secteur -> (numéro de l'élément, position dans la vidéo 0..1 ; ignorée pour une photo)
# Les vidéos sont verticales et petites (464 px) : photo quand il y en a une bonne.
COUVERTURES = {}  # 05/10 : couvertures remplacées par des images studio (src/assets/secteurs)


def carre(im, session):
    """Carré autour du sujet, marge de 6 %, sans déformer ni détourer."""
    im = ImageOps.exif_transpose(im).convert('RGB')
    petit = im.copy(); petit.thumbnail((512, 512)); k = im.width / petit.width
    bb = remove(petit, session=session, only_mask=True).point(lambda v: 255 if v > 128 else 0).getbbox()
    x0, y0, x1, y1 = [round(v * k) for v in bb] if bb else (0, 0, im.width, im.height)
    c = min(max(x1 - x0, y1 - y0) * 1.12, im.width, im.height)
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    gx = min(max(cx - c / 2, 0), max(im.width - c, 0)); gy = min(max(cy - c / 2, 0), max(im.height - c, 0))
    out = im.crop((round(gx), round(gy), round(gx + c), round(gy + c)))
    return out.resize((1200, 1200), Image.LANCZOS) if out.width > 1200 else out


def image_video(chemin, pos):
    v = cv2.VideoCapture(chemin); v.set(cv2.CAP_PROP_POS_FRAMES, int(v.get(cv2.CAP_PROP_FRAME_COUNT) * pos))
    ok, f = v.read()
    return Image.fromarray(cv2.cvtColor(f, cv2.COLOR_BGR2RGB))


if __name__ == '__main__':
    PHOTOS.mkdir(parents=True, exist_ok=True); COUV.mkdir(parents=True, exist_ok=True)
    session = new_session('isnet-general-use')
    for slug, (nom, secteur, marque, ref, nums, cond, texte) in ({} if 'couv' in sys.argv else PRODUITS).items():
        chemins = []
        for k, n in enumerate(nums):
            f = PHOTOS / f'{slug}-{k + 1}.webp'
            carre(Image.open(FICHIERS[n]), session).save(f, quality=82, method=6)
            chemins.append(f'../../assets/produits/nouveaux/{f.name}')
        lignes = ['---', f'nom: {nom}', f'secteur: {secteur}', 'photos:'] + [f'  - {c}' for c in chemins]
        lignes += [f'conditionnement: {cond}', 'disponible: true', 'enAvant: false']
        lignes += [f'marque: {marque}'] if marque else []
        lignes += [f"reference: '{ref}'"] if ref else []
        lignes += ['---', texte, '']
        (SITE / f'src/content/produits/{slug}.mdoc').write_text('\n'.join(lignes), encoding='utf-8')
        print('produit', slug, len(chemins), 'photo(s)')
    for secteur, (n, pos) in COUVERTURES.items():
        f = FICHIERS[n]
        im = image_video(f, pos) if f.endswith('.mp4') else ImageOps.exif_transpose(Image.open(f)).convert('RGB')
        im.thumbnail((1600, 1600))
        im.save(COUV / f'{secteur}.jpg', quality=84); print('couverture', secteur, im.size)
