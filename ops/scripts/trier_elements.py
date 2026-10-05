"""Tri des nouveaux éléments envoyés par le client (photos et vidéos WhatsApp).

Chaque image (et 3 images-clés de chaque vidéo) est décrite et classée par
Gemini 2.5 Flash (gratuit) : secteur, nature, marque/produit lisible, qualité,
usage conseillé. Résultat : docs/nouveaux-elements.json ; seul un résumé texte
est affiché (économie de tokens : on ne regarde pas les images une par une).
Usage : python trier_elements.py "C:/Users/sawad/Downloads/KORO-MATHIEUX/nouveau element"
"""
import base64, io, json, sys, time, urllib.request, urllib.error
from pathlib import Path
import cv2
from PIL import Image

RACINE = Path('C:/SITE-SASOMA')
SORTIE = RACINE / 'docs/nouveaux-elements.json'
API = lambda: 'https://generativelanguage.googleapis.com/v1beta/models/' + (sys.argv[2] if len(sys.argv) > 2 else 'gemini-2.5-flash') + ':generateContent'
CONSIGNE = '''Tu tries les photos d'une entreprise du Burkina Faso, SASOMA, pour son site web.
Secteurs possibles : lubrifiants (huiles moteur Petrovöll, graisses, additifs), transport (camions, logistique,
livraison), distribution (import-export, marchandises, entrepôt), pneumatiques (pneus, jantes),
fournitures (fournitures de bureau, papeterie, consommables), entreprise (locaux, équipe, enseigne, boutique),
autre. Réponds en JSON uniquement :
{"description": "<ce qu'on voit, 1 phrase en français>", "secteur": "<un des secteurs>",
 "nature": "produit|scene|boutique|personnes|document|logo|autre",
 "marque_produit": "<marque et nom de produit lisibles, sinon vide>",
 "texte_lisible": "<texte important visible, court>",
 "qualite": <1 à 5 : netteté, lumière, cadrage pour un site pro>,
 "usage": "fiche_produit|image_secteur|galerie|a_retoucher|rejet",
 "raison": "<courte justification de l'usage>"}'''


def cle():
    for l in (RACINE / '.env').read_text(encoding='utf-8').splitlines():
        if l.split('=', 1)[0].strip() == 'Gemini API Key 3':
            return l.split('=', 1)[1].strip().strip('"\'')


def b64(im):
    im = im.convert('RGB'); im.thumbnail((768, 768))
    b = io.BytesIO(); im.save(b, 'JPEG', quality=85); return base64.b64encode(b.getvalue()).decode()


def demander(images, note=''):
    parts = [{'text': CONSIGNE + note}] + [{'inline_data': {'mime_type': 'image/jpeg', 'data': b64(i)}} for i in images]
    corps = json.dumps({'contents': [{'parts': parts}], 'generationConfig': {'responseMimeType': 'application/json'}}).encode()
    for essai in range(5):
        try:
            req = urllib.request.Request(API(), corps, {'x-goog-api-key': cle(), 'Content-Type': 'application/json'})
            with urllib.request.urlopen(req, timeout=120) as r:
                t = json.load(r)['candidates'][0]['content']['parts'][0]['text']
                v = json.loads(t)
                return v[0] if isinstance(v, list) else v
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 503):
                time.sleep(20 * (essai + 1)); continue
            return {'erreur': f'HTTP {e.code}'}
        except Exception as e:
            return {'erreur': str(e)[:200]}
    return {'erreur': 'quota'}


def images_video(f, n=3):
    v = cv2.VideoCapture(str(f)); total = int(v.get(cv2.CAP_PROP_FRAME_COUNT)); out = []
    duree = total / (v.get(cv2.CAP_PROP_FPS) or 30)
    for k in range(n):
        v.set(cv2.CAP_PROP_POS_FRAMES, int(total * (k + 0.5) / n)); ok, fr = v.read()
        if ok:
            out.append(Image.fromarray(cv2.cvtColor(fr, cv2.COLOR_BGR2RGB)))
    return out, round(duree, 1)


if __name__ == '__main__':
    dossier = Path(sys.argv[1])
    res = json.loads(SORTIE.read_text(encoding='utf-8')) if SORTIE.exists() else {}
    for f in sorted(p for p in dossier.rglob('*') if p.is_file()):
        if f.name in res and 'erreur' not in res[f.name]:
            continue
        if f.suffix.lower() in ('.jpg', '.jpeg', '.png', '.webp'):
            im = Image.open(f); v = demander([im]); v['taille'] = im.size
        elif f.suffix.lower() in ('.mp4', '.mov'):
            ims, duree = images_video(f)
            v = demander(ims, '\nCe sont 3 images extraites d’une même vidéo : décris la vidéo entière.')
            v['taille'] = ims[0].size if ims else None; v['duree_s'] = duree
        else:
            continue
        v['chemin'] = str(f); res[f.name] = v
        SORTIE.write_text(json.dumps(res, ensure_ascii=False, indent=2), encoding='utf-8')
        print(f"{f.name[14:40]:26} {v.get('secteur','?'):12} {v.get('nature','?'):9} q{v.get('qualite','?')} "
              f"{v.get('usage','?'):13} {v.get('marque_produit','')[:30]:30} | {v.get('description', v.get('erreur',''))[:90]}", flush=True)
