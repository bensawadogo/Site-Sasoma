"""deapi.py — client minimal de l'API deAPI (vidéos du moteur, décision D3 / guide §8).

La clé est lue dans C:/SITE-SASOMA/.env (DEAPI_API_KEY, jamais commitée, jamais affichée).
Chaque génération est à noter dans ops/credits.md (prix réel renvoyé par l'API).

  python ops/scripts/deapi.py solde
  python ops/scripts/deapi.py modeles              # modèles image→vidéo, limites, image de fin
  python ops/scripts/deapi.py prix  MODELE L H IMAGES FPS [PAS]
  python ops/scripts/deapi.py video MODELE L H IMAGES FPS GRAINE DEBUT FIN PROMPT_FICHIER SORTIE [PAS]
  python ops/scripts/deapi.py agrandir MODELE ENTREE SORTIE [ECHELLE]
  python ops/scripts/deapi.py image MODELE L H GRAINE PROMPT_FICHIER SORTIE [PAS]
"""
import json
import os
import sys
import time

import httpx

RACINE = os.path.normpath(os.path.join(os.path.dirname(__file__), '..', '..'))
API = 'https://api.deapi.ai/api/v2'
NEGATIF = ('text, letters, words, logo, watermark, label, brand, bottle, jerrycan, hands, people, '
           'cartoon, illustration, blurry, deformed metal, extra parts, bright background')


def cle():
    for ligne in open(os.path.join(RACINE, '.env'), encoding='utf-8'):
        if ligne.startswith('DEAPI_API_KEY=') and len(ligne.strip()) > len('DEAPI_API_KEY=') + 5:
            return ligne.split('=', 1)[1].strip()
    sys.exit('DEAPI_API_KEY absente de .env')


CLIENT = httpx.Client(headers={'Authorization': f'Bearer {cle()}', 'Accept': 'application/json'}, timeout=120)


def verifier(r):
    if r.status_code >= 400:
        sys.exit(f'HTTP {r.status_code} {r.url}\n{r.text[:1500]}')
    return r.json()


def modeles():
    d = verifier(CLIENT.get(f'{API}/models', params={'filter[inference_types]': 'img2video', 'per_page': 100}))
    return d.get('data', d)


def attendre(request_id, sortie):
    t0 = time.time()
    while True:
        d = verifier(CLIENT.get(f'{API}/jobs/{request_id}'))['data']
        etat = d.get('status')
        print(f'  {time.time() - t0:5.0f} s  {etat}  {d.get("progress")}', flush=True)
        if etat == 'done':
            with open(sortie, 'wb') as f:
                f.write(httpx.get(d['result_url'], timeout=300).content)
            print(json.dumps({'sortie': sortie, 'prix': d.get('price'), 'duree_s': round(time.time() - t0)}, ensure_ascii=False))
            return d
        if etat == 'error':
            sys.exit(f'ERREUR : {json.dumps(d, ensure_ascii=False)[:1500]}')
        time.sleep(8)


def main(a):
    if a[0] == 'solde':
        print(verifier(CLIENT.get(f'{API}/account/balance')))
    elif a[0] == 'modeles':
        for m in modeles():
            i = m.get('info') or {}
            print(json.dumps({'slug': m.get('slug'), 'nom': m.get('name'), 'types': m.get('inference_types'),
                              'fonctions': i.get('features'), 'limites': i.get('limits'), 'defauts': i.get('defaults')},
                             ensure_ascii=False))
    elif a[0] == 'prix':
        corps = {'model': a[1], 'width': int(a[2]), 'height': int(a[3]), 'frames': int(a[4]), 'fps': int(a[5])}
        if len(a) > 6:
            corps['steps'] = int(a[6])
        print(verifier(CLIENT.post(f'{API}/videos/animations/price', json=corps)))
    elif a[0] == 'video':
        modele, l, h, images, fps, graine, debut, fin, fichier_prompt, sortie = a[1:11]
        champs = {'model': modele, 'width': l, 'height': h, 'frames': images, 'fps': fps, 'seed': graine,
                  'prompt': open(fichier_prompt, encoding='utf-8').read().strip(), 'negative_prompt': NEGATIF}
        if len(a) > 11:
            champs['steps'] = a[11]
        fichiers = {'first_frame_image': open(debut, 'rb')}
        if fin != '-':
            fichiers['last_frame_image'] = open(fin, 'rb')
        # Compte gratuit (Basic) : quelques requêtes par minute ; on patiente sur 429.
        for essai in range(6):
            fichiers = {k: open(v.name, 'rb') for k, v in fichiers.items()}
            r = CLIENT.post(f'{API}/videos/animations', data=champs, files=fichiers)
            if r.status_code != 429:
                break
            print(f'  429 (limite de débit), nouvel essai dans 65 s ({essai + 1}/6)', flush=True)
            time.sleep(65)
        d = verifier(r)
        print('accepté', json.dumps(d, ensure_ascii=False)[:400])
        attendre(d['data']['request_id'], sortie)
    elif a[0] == 'image':
        modele, l, h, graine, fichier_prompt, sortie = a[1:7]
        corps = {'model': modele, 'width': int(l), 'height': int(h), 'seed': int(graine),
                 'prompt': open(fichier_prompt, encoding='utf-8').read().strip(), 'negative_prompt': NEGATIF}
        if len(a) > 7:
            corps['steps'] = int(a[7])
        for essai in range(6):
            r = CLIENT.post(f'{API}/images/generations', json=corps)
            if r.status_code != 429:
                break
            print(f'  429, nouvel essai dans 65 s ({essai + 1}/6)', flush=True)
            time.sleep(65)
        d = verifier(r)
        attendre(d['data']['request_id'], sortie)
    elif a[0] == 'agrandir':
        champs = {'model': a[1]}
        if len(a) > 4:
            champs['scale'] = a[4]
        d = verifier(CLIENT.post(f'{API}/videos/upscales', data=champs, files={'video': open(a[2], 'rb')}))
        attendre(d['data']['request_id'], a[3])


if __name__ == '__main__':
    main(sys.argv[1:])
