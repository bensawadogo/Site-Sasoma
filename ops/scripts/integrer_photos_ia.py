"""Intègre au site les photos produites par photos_ia.py (ops/captures/photos-ia/<id>.png).

Pour chaque id : WebP dans src/assets/produits, champ `photo` du JSON produits,
entrée de photos-produits.json (correspondance « ia » = photo non contractuelle)
et champ `photos` de la fiche de l'admin (src/content/produits/*.mdoc).
Usage : python integrer_photos_ia.py turbine-oil [autre-id ...]
"""
import json, re, sys
from pathlib import Path
from PIL import Image

RACINE = Path('C:/SITE-SASOMA')
SITE = RACINE / 'petrovoll-astro'
BRUT = RACINE / 'ops/captures/photos-ia'
F_PROD = SITE / 'src/data/produits-petrovoll.json'
F_PHOTOS = SITE / 'src/data/photos-produits.json'

prod = json.loads(F_PROD.read_text(encoding='utf-8'))
photos = json.loads(F_PHOTOS.read_text(encoding='utf-8'))
# id -> nom de la fiche de l'admin quand il diffère (petrovoll-<nom>.mdoc)
ADMIN = {'lub-tec-grob-gear': 'lub-tec-grob-industrial-gear-oils', 'scom-compressor': 'scom-compressor-oil',
         'schneidol-cutting': 'schneidol-cutting-oil', 'trans-tech': 'trans-tech-industrial-transmission-oil',
         'carburetor-choke-cleaner': 'carburetor-and-choke-cleaner', 'hydkon-hydraulic': 'hydkon-hydraulic-oil'}
fiches = {p.stem: p for p in (SITE / 'src/content/produits').glob('*.mdoc')}

for i in sys.argv[1:]:
    Image.open(BRUT / f'{i}.png').save(SITE / f'src/assets/produits/{i}.webp', quality=88, method=6)
    fiche = next(x for x in prod if x['id'] == i)
    fiche['photo'] = f'{i}.webp'
    if i == 'hydkon-hydraulic':  # vraie photo du fabricant, seul le capuchon manquant a été ajouté
        photos[i]['remarque'] = 'Capuchon ajouté par IA (absent de la photo du fabricant), étiquette inchangée.'
    else:
        photos[i] = {'photo': f'{i}.webp', 'variantes': {}, 'source': 'IA (deAPI Qwen-Image-Edit) à partir d’une photo de la gamme',
                     'correspondance': 'ia', 'remarque': 'Pas de photo chez le fabricant : visuel généré, non contractuel.'}
    cands = [p for s, p in fiches.items() if s == 'petrovoll-' + ADMIN.get(i, i)]
    if len(cands) != 1:
        print(i, ': fiche admin introuvable ou ambiguë', [c.name for c in cands]); continue
    t = cands[0].read_text(encoding='utf-8')
    if '\nphotos:' not in t:
        t = re.sub(r'^(nom: .*\n)', rf'\1photos:\n  - ../../assets/produits/{i}.webp\n', t, count=1, flags=re.M)
        cands[0].write_text(t, encoding='utf-8')
    print(i, 'OK', cands[0].name)

F_PROD.write_text(json.dumps(prod, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
F_PHOTOS.write_text(json.dumps(photos, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
