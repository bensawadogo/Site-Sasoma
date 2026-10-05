"""Photos IA des produits Petrovöll sans photo fabricant (deAPI, Qwen-Image-Edit).

Part d'une vraie photo de la gamme (même emballage), change seulement le nom
sur l'étiquette, détoure (rembg) et cadre comme les autres photos
(1200 x 1200, objet de y=96 à y=1104, centré). Un contrôle par Gemini (texte)
lit l'étiquette et vérifie le capuchon ; seul ce verdict est affiché.

Génération : deAPI (QwenImageEdit_Plus_NF4, ~0,026 $ l'image, 15 requêtes/jour ;
le quota image gratuit de Gemini est à 0). Contrôle : Gemini 2.5 Flash (gratuit).
Clés : lignes DEAPI_API_KEY et « Gemini API Key 3 » de C:/SITE-SASOMA/.env (jamais affichées).
Usage : python photos_ia.py turbine-oil [autre-id ...]
"""
import base64, io, json, sys, time, urllib.request, urllib.error
import deapi
from pathlib import Path
from PIL import Image
from rembg import remove, new_session

RACINE = Path('C:/SITE-SASOMA')
PHOTOS = RACINE / 'petrovoll-astro/src/assets/produits'
BRUT = RACINE / 'ops/captures/photos-ia'
API = 'https://generativelanguage.googleapis.com/v1beta/models/'
MODELE_IMAGE = 'QwenImageEdit_Plus_NF4'
MODELE_CONTROLE = 'gemini-2.5-flash'

# id -> (photo de référence, consigne d'édition, nom attendu sur l'étiquette)
BIDON = ('Keep EXACTLY the same yellow 20 L jerrycan, same angle, same lighting, plain white background, '
         'whole jerrycan in frame. Add a black screw cap on the spout at the top left. On the label, keep the '
         'Petrovöll logo and the layout, but change the texts: the big golden word "HYDKÖN" becomes "{t}", '
         '"Hydraulik Öl" becomes "{s}", "HYDRAULIC 68" becomes "{l}", remove the lines "HEAVY HYDRAULIC FLUID" '
         'and "LOW ZINC TECHNOLOGY" (leave that area plain), and in the red band "ISO VG 68" '
         'becomes "{b}". Keep "20 Ltr". Sharp, realistic studio packshot, no other object.')


def bidon(t, s, l, b='INDUSTRIAL'):
    return ('hydkon-hydraulic', BIDON.format(t=t, s=s, l=l, b=b), t)


PRODUITS = {
    'hydkon-hydraulic': ('hydkon-hydraulic', 'Keep EXACTLY the same jerrycan, label, texts, colours, angle and '
                         'lighting. Only add a black screw cap on the open spout at the top left. Plain white '
                         'background, whole jerrycan in frame.', 'HYDKÖN'),
    'turbine-oil': bidon('TURBINE', 'Turbinenöl', 'TURBINE OIL'),
    'lub-tec-grob-gear': bidon('LUB-TEC', 'Getriebeöl', 'INDUSTRIAL GEAR OIL', 'ISO VG 220'),
    'scom-compressor': bidon('SCÖM', 'Kompressoröl', 'COMPRESSOR OIL'),
    'schneidol-cutting': bidon('SCHNEIDÖL', 'Schneidöl', 'CUTTING OIL', 'SOLUBLE'),
    'transformer-oil': bidon('TRANSFORMER', 'Transformatorenöl', 'TRANSFORMER OIL', 'INSULATING'),
    'trans-tech': bidon('TRANS-TECH', 'Getriebeöl', 'TRANSMISSION OIL'),
    'refrigeration-oil': bidon('REFRIGERATION', 'Kältemaschinenöl', 'REFRIGERATION OIL'),
    'heat-transfer-oil': bidon('HEAT TRANSFER', 'Wärmeträgeröl', 'HEAT TRANSFER OIL'),
    'circulation-oil': bidon('CIRCULATION', 'Umlauföl', 'CIRCULATION OIL'),
    'engine-flush': ('fuel-injector-cleaner', 'Keep EXACTLY the same bottle, cap, colours, angle and lighting, '
                     'plain white background, whole bottle in frame. Keep the Petrovöll logo. Change only the '
                     'product name on the label so it reads "ENGINE FLUSH" with the line "MOTOR FLUSH 300 ml" '
                     'under it. Sharp, realistic studio packshot, no other object.', 'ENGINE FLUSH'),
    'carburetor-choke-cleaner': ('oil-treatment', 'Turn this can into a tall aerosol spray can with a black '
                                 'spray cap on top, same Petrovöll red, black and white design, same lighting, '
                                 'plain white background, whole can in frame. Keep the Petrovöll logo. The big '
                                 'product name must read "CARB & CHOKE CLEANER" and the small line "400 ml". '
                                 'Sharp, realistic studio packshot, no other object.', 'CHOKE'),
}


def cle():
    for l in (RACINE / '.env').read_text(encoding='utf-8').splitlines():
        if l.split('=', 1)[0].strip() == 'Gemini API Key 3':
            return l.split('=', 1)[1].strip().strip('"\'')
    sys.exit('Clé Gemini absente de .env')


def appel(modele, parts, image=False):
    corps = {'contents': [{'parts': parts}]}
    if image:
        corps['generationConfig'] = {'responseModalities': ['IMAGE', 'TEXT']}
    req = urllib.request.Request(API + modele + ':generateContent', json.dumps(corps).encode(),
                                 {'x-goog-api-key': cle(), 'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        sys.exit(f'{modele} : HTTP {e.code} {e.read()[:400].decode(errors="replace")}')


def png_b64(im):
    b = io.BytesIO(); im.save(b, 'PNG'); return base64.b64encode(b.getvalue()).decode()


def generer(i):
    ref, consigne, _ = PRODUITS[i]
    src = Image.open(PHOTOS / f'{ref}.webp').convert('RGBA')
    fond = Image.new('RGB', src.size, 'white'); fond.paste(src, mask=src.getchannel('A'))
    entree = BRUT / f'{i}-entree.jpg'; fond.resize((768, 768), Image.LANCZOS).save(entree, quality=95)
    champs = {'model': MODELE_IMAGE, 'seed': '1101', 'steps': '30', 'prompt': consigne,
              'negative_prompt': 'blurry text, misspelled text, extra objects, cropped cap, cut off, hands, background scene'}
    for essai in range(4):
        r = deapi.CLIENT.post(f'{deapi.API}/images/edits', data=champs, files={'image': open(entree, 'rb')})
        if r.status_code != 429:
            break
        print(f'  429, nouvel essai dans 65 s ({essai + 1}/4)', flush=True); time.sleep(65)
    d = deapi.verifier(r)
    sortie = BRUT / f'{i}-brut.png'
    deapi.attendre(d['data']['request_id'], str(sortie))
    return Image.open(sortie).convert('RGB')


def cadrer(im, session):
    a = remove(im, session=session).convert('RGBA')
    al = a.getchannel('A').point(lambda v: 0 if v < 12 else v); a.putalpha(al)
    a = a.crop(al.getbbox())
    k = 1008 / a.height
    a = a.resize((round(a.width * k), 1008), Image.LANCZOS)
    if a.width > 1100:
        k = 1100 / a.width; a = a.resize((1100, round(a.height * k)), Image.LANCZOS)
    out = Image.new('RGBA', (1200, 1200), (0, 0, 0, 0))
    out.paste(a, ((1200 - a.width) // 2, 1104 - a.height), a)
    return out


def controler(i, im):
    titre = PRODUITS[i][2]
    fond = Image.new('RGB', im.size, 'white'); fond.paste(im, mask=im.getchannel('A'))
    fond.thumbnail((768, 768))
    q = ('Answer in JSON only: {"texte_etiquette": "<all readable label text>", '
         '"capuchon_visible": true/false, "objet_entier": true/false, "defauts": "<visible AI artefacts or none>"}')
    rep = appel(MODELE_CONTROLE, [{'text': q}, {'inline_data': {'mime_type': 'image/png', 'data': png_b64(fond)}}])
    t = rep['candidates'][0]['content']['parts'][0]['text'].strip().strip('`').removeprefix('json').strip()
    v = json.loads(t)
    v['nom_ok'] = titre.replace('Ö', 'O').upper() in v.get('texte_etiquette', '').replace('Ö', 'O').upper()
    return v


if __name__ == '__main__':
    BRUT.mkdir(parents=True, exist_ok=True)
    session = new_session('isnet-general-use')
    for i in sys.argv[1:]:
        try:
            brut = generer(i)
            im = cadrer(brut, session); im.save(BRUT / f'{i}.png')
            print(i, json.dumps(controler(i, im), ensure_ascii=False), flush=True)
        except (Exception, SystemExit) as e:  # une erreur (réseau, quota) n'arrête pas les suivants
            print(i, 'ÉCHEC', str(e)[:300], flush=True)
