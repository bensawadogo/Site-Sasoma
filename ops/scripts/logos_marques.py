"""Logos officiels (couleur) des constructeurs cités dans les homologations Petrovöll.

Source : Wikidata (propriété P154 « logo ») -> fichier SVG de Wikimedia Commons.
Sortie : petrovoll-astro/src/assets/marques/<slug>.svg + docs/logos-marques.json (sources).
  python ops/scripts/logos_marques.py
"""
import json, re, time, urllib.parse, urllib.request
from pathlib import Path

R = Path('C:/SITE-SASOMA')
OUT = R / 'petrovoll-astro/src/assets/marques'
UA = {'User-Agent': 'SASOMA-site/1.0 (sawadogobenrachid0@gmail.com)'}
# slug -> (recherche Wikidata, description attendue)
MARQUES = {
    'mercedes-benz': 'Mercedes-Benz', 'bmw': 'BMW', 'volkswagen': 'Volkswagen', 'porsche': 'Porsche',
    'ferrari': 'Ferrari', 'peugeot': 'Peugeot', 'citroen': 'Citroën', 'renault': 'Renault',
    'volvo': 'Volvo', 'ford': 'Ford Motor Company', 'toyota': 'Toyota', 'honda': 'Honda',
    'nissan': 'Nissan', 'hyundai': 'Hyundai Motor Company', 'man': 'MAN Truck & Bus',
    'caterpillar': 'Caterpillar Inc.', 'cummins': 'Cummins',
}

# Emblèmes en couleur plutôt que les logotypes noirs de Wikidata.
IMPOSE = {'bmw': 'BMW.svg', 'renault': 'Renault 2021 Text.svg'}


def get(url):
    for k in range(4):
        try:
            return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30).read()
        except Exception:
            time.sleep(3 * (k + 1))
    raise RuntimeError(url)


journal = {}
for slug, nom in MARQUES.items():
    if slug in IMPOSE:
        fichier, qid = IMPOSE[slug], ''
        url = 'https://commons.wikimedia.org/wiki/Special:FilePath/' + urllib.parse.quote(fichier.replace(' ', '_'))
        (OUT / f'{slug}.svg').write_bytes(get(url)); journal[slug] = {'nom': nom, 'fichier': fichier, 'url': url}
        print(slug, fichier); continue
    q = urllib.parse.urlencode({'action': 'wbsearchentities', 'search': nom, 'language': 'en', 'format': 'json', 'limit': 5})
    res = json.loads(get('https://www.wikidata.org/w/api.php?' + q))['search']
    fichier = None
    for r in res:
        e = json.loads(get(f"https://www.wikidata.org/wiki/Special:EntityData/{r['id']}.json"))['entities'][r['id']]
        # Logo actuel : rang « préféré », sinon sans date de fin (P582) ; les anciens logos sont écartés.
        cl = [c for c in e['claims'].get('P154', []) if 'datavalue' in c['mainsnak']
              and c['mainsnak']['datavalue']['value'].lower().endswith('.svg')]
        cl.sort(key=lambda c: (c.get('rank') != 'preferred', 'P582' in c.get('qualifiers', {})))
        if cl:
            fichier, qid = cl[0]['mainsnak']['datavalue']['value'], r['id']; break
    if not fichier:
        print(slug, 'AUCUN logo SVG'); continue
    url = 'https://commons.wikimedia.org/wiki/Special:FilePath/' + urllib.parse.quote(fichier.replace(' ', '_'))
    (OUT / f'{slug}.svg').write_bytes(get(url))
    journal[slug] = {'nom': nom, 'wikidata': qid, 'fichier': fichier, 'url': url}
    print(slug, qid, fichier)
    time.sleep(1)
(R / 'docs/logos-marques.json').write_text(json.dumps(journal, ensure_ascii=False, indent=2), encoding='utf-8')

# Version légère pour le site : chaque SVG rendu en WebP transparent, 120 px de haut
# (le SVG Mercedes pèse 300 Ko ; la bande défilante doit rester légère en 3G).
from playwright.sync_api import sync_playwright  # noqa: E402
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1200, 'height': 600})
    for f in sorted(OUT.glob('*.svg')):
        page = OUT / '_rendu.html'  # page locale : about:blank ne charge pas les fichiers locaux
        page.write_text(f'<body style="margin:0;background:transparent"><img src="{f.name}" '
                        'style="width:1100px;height:550px;object-fit:contain;display:block"></body>', encoding='utf-8')
        pg.goto(page.resolve().as_uri()); pg.wait_for_timeout(400)
        pg.screenshot(path=str(f.with_suffix('.png')), omit_background=True, timeout=120000)
    b.close()
(OUT / '_rendu.html').unlink()
from PIL import Image  # noqa: E402
for f in sorted(OUT.glob('*.png')):
    im = Image.open(f).convert('RGBA'); im = im.crop(im.getbbox()); im = im.resize((round(im.width * 120 / im.height), 120), Image.LANCZOS)
    im.save(f.with_suffix('.webp'), quality=90, method=6); f.unlink(); print(f.stem, im.size)
