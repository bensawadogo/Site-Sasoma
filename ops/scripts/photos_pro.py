"""Photos « studio » des nouveaux produits (pneus, filtres) trouvées sur le web.

Pour chaque produit : recherche d'images (DuckDuckGo, gratuit), téléchargement
des candidates, notation par Gemini (gratuit, une requête par produit pour
toutes ses candidates), puis la meilleure est détourée (rembg) et cadrée comme
les photos Petrovöll : 1200 x 1200, fond transparent, objet de y=96 à y=1104.
Résultat : src/assets/produits/nouveaux/<slug>-1.webp + docs/photos-pro.json.
Usage : python photos_pro.py [slug ...]   (sans argument : tous)
"""
import base64, io, json, sys, time, urllib.request, urllib.error
from pathlib import Path
from ddgs import DDGS
from PIL import Image, ImageOps
from rembg import remove, new_session

RACINE = Path('C:/SITE-SASOMA')
SITE = RACINE / 'petrovoll-astro'
CAND = RACINE / 'ops/captures/photos-pro'
SORTIE = SITE / 'src/assets/produits/nouveaux'
JOURNAL = RACINE / 'docs/photos-pro.json'
MODELE = 'gemini-3.5-flash-lite'

# slug -> (requête, ce que la photo doit montrer)
PRODUITS = {
    'pneu-double-road-dr802': ('Double Road DR802 truck tyre', 'pneu de camion Double Road, sculpture DR802'),
    'pneu-double-road-dr636': ('DR636 doubleroad tire 315/80R22.5', 'pneu de camion Double Road, sculpture DR636'),
    'pneu-double-road-dr638': ('Double Road DR638 truck tyre', 'pneu de camion Double Road, sculpture DR638'),
    'pneu-longmarch-lm526': ('Longmarch LM526 truck tyre', 'pneu de camion Longmarch LM526'),
    'filtre-huile-cat-1r-1807': ('CAT 1R-1807 oil filter', 'filtre à huile Caterpillar 1R-1807 (jaune et noir)'),
    'filtre-carburant-cat-1r-0750': ('CAT 1R-0750 fuel filter', 'filtre à carburant Caterpillar 1R-0750'),
    'filtre-carburant-perkins': ('Perkins genuine fuel filter element', 'filtre à carburant Perkins'),
    'filtre-separateur-pl420': ('PL420 fuel water separator filter', 'préfiltre séparateur eau/gasoil PL420 à bol transparent'),
    'filtre-scania-1397764': ('1397764 oil filter element', 'cartouche filtre à huile pour Scania (réf. 1397764) ; la marque peut être Scania ou un équivalent adaptable'),
    'filtre-scania-1928868': ('1928868 oil filter element', 'cartouche filtre à huile pour Scania (réf. 1928868) ; la marque peut être Scania ou un équivalent adaptable'),
    'filtre-scania-1699168': ('1699168 fuel filter', 'filtre à carburant pour Scania (réf. 1699168) ; la marque peut être Scania ou un équivalent adaptable'),
    'filtre-scania-1852005': ('1852005 fuel filter', 'filtre à carburant pour Scania (réf. 1852005) ; la marque peut être Scania ou un équivalent adaptable'),
    'filtres-daf': ('DAF truck genuine oil filter', 'filtre pour camion DAF'),
    'filtres-air-poids-lourds': ('heavy duty truck air filter element', 'cartouche de filtre à air de camion'),
}
CONSIGNE = '''Voici {n} photos candidates, numérotées de 0 à {m} dans l'ordre, pour illustrer sur un site
e-commerce professionnel : {quoi}. Pour CHAQUE photo, note-la. Réponds en JSON uniquement :
[{{"i": 0, "fond_uni": true/false (fond blanc ou uni, style studio), "produit_seul": true/false (un seul produit,
sans personne, sans décor), "conforme": true/false (c'est bien le produit attendu ; marque ou référence contraire = false),
"filigrane": true/false (logo de revendeur, texte ajouté, montage), "note": 1-10 (qualité pour un site studio)}}, ...]'''


def cle():
    for l in (RACINE / '.env').read_text(encoding='utf-8').splitlines():
        if l.split('=', 1)[0].strip() == 'Gemini API Key 3':
            return l.split('=', 1)[1].strip().strip('"\'')


def b64(im):
    im = im.convert('RGB'); im.thumbnail((512, 512))
    b = io.BytesIO(); im.save(b, 'JPEG', quality=80); return base64.b64encode(b.getvalue()).decode()


def noter(images, quoi):
    parts = [{'text': CONSIGNE.format(n=len(images), m=len(images) - 1, quoi=quoi)}]
    parts += [{'inline_data': {'mime_type': 'image/jpeg', 'data': b64(i)}} for i in images]
    corps = json.dumps({'contents': [{'parts': parts}], 'generationConfig': {'responseMimeType': 'application/json'}}).encode()
    for essai in range(4):
        try:
            req = urllib.request.Request(f'https://generativelanguage.googleapis.com/v1beta/models/{MODELE}:generateContent',
                                         corps, {'x-goog-api-key': cle(), 'Content-Type': 'application/json'})
            with urllib.request.urlopen(req, timeout=180) as r:
                return json.loads(json.load(r)['candidates'][0]['content']['parts'][0]['text'])
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 503):
                time.sleep(30 * (essai + 1)); continue
            raise


def telecharger(requete, dossier, n=10):
    dossier.mkdir(parents=True, exist_ok=True); ims = []
    for r in DDGS().images(requete, max_results=25):
        if len(ims) >= n or min(int(r.get('width') or 0), int(r.get('height') or 0)) < 450:
            continue
        try:
            req = urllib.request.Request(r['image'], headers={'User-Agent': 'Mozilla/5.0'})
            data = urllib.request.urlopen(req, timeout=20).read()
            im = ImageOps.exif_transpose(Image.open(io.BytesIO(data))).convert('RGB')
            im.save(dossier / f'{len(ims)}.jpg', quality=92); ims.append((im, r['image']))
        except Exception:
            continue
    return ims


def cadrer(im, session):
    a = remove(im, session=session).convert('RGBA')
    al = a.getchannel('A').point(lambda v: 0 if v < 16 else v); a.putalpha(al)
    a = a.crop(al.getbbox()); k = min(1008 / a.height, 1100 / a.width)
    a = a.resize((round(a.width * k), round(a.height * k)), Image.LANCZOS)
    out = Image.new('RGBA', (1200, 1200), (0, 0, 0, 0))
    out.paste(a, ((1200 - a.width) // 2, 1104 - a.height), a)
    return out


if __name__ == '__main__':
    journal = json.loads(JOURNAL.read_text(encoding='utf-8')) if JOURNAL.exists() else {}
    session = new_session('isnet-general-use')
    for slug in sys.argv[1:] or list(PRODUITS):
        requete, quoi = PRODUITS[slug]
        ims = telecharger(requete, CAND / slug)
        if not ims:
            print(slug, 'AUCUNE image'); continue
        notes = noter([i for i, _ in ims], quoi)
        ok = [n for n in notes if n.get('conforme') and not n.get('filigrane') and n.get('produit_seul') and n['i'] < len(ims)]
        ok.sort(key=lambda n: (n.get('fond_uni', False), n.get('note', 0)), reverse=True)
        if not ok:
            print(slug, 'aucune candidate conforme', [(n['i'], n.get('note')) for n in notes]); continue
        best = ok[0]; im, url = ims[best['i']]
        cadrer(im, session).save(SORTIE / f'{slug}-1.webp', quality=86, method=6)
        journal[slug] = {'source': url, 'note': best.get('note'), 'fond_uni': best.get('fond_uni'), 'candidate': best['i']}
        JOURNAL.write_text(json.dumps(journal, ensure_ascii=False, indent=2), encoding='utf-8')
        print(slug, f"#{best['i']} note {best.get('note')} fond_uni {best.get('fond_uni')} ({len(ok)} conformes / {len(ims)})", flush=True)
