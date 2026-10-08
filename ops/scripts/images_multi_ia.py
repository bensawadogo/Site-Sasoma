"""images_multi_ia.py — génère des propositions d'images (fonds de la section bidon, hero) avec plusieurs IA.

  python ops/scripts/images_multi_ia.py fonds|hero

IA appelées sans afficher d'image dans la conversation :
  - deAPI (clé DEAPI_API_KEY du .env, 15 requêtes/jour) : ZImageTurbo_INT8, Flux1schnell, Flux_2_Klein_4B_BF16
  - Pollinations (anonyme, gratuit) : Sana (NVIDIA)
Les fichiers existants sont sautés (relance sans double dépense). Chaque appel deAPI est à noter dans ops/credits.md.
"""
import subprocess
import time
import sys
import urllib.parse
from pathlib import Path

import httpx

RACINE = Path(__file__).resolve().parents[2]
SANS = ', no text, no letters, no logo, no watermark, no people'

FONDS = [
    ('07-sana-metal-brosse.jpg', 'sana', 'Wide cinematic background, dark brushed steel surface with a soft diagonal streak of cold blue light, deep navy shadows, large empty dark space in the center, premium automotive advertising' + SANS),
    ('08-zimage-route-sahel-nuit.png', 'ZImageTurbo_INT8', 'Wide cinematic photograph of a straight laterite road across the Sahel at night, distant headlights as soft amber bokeh on the horizon, deep navy starry sky filling most of the frame, large empty dark sky in the center' + SANS),
    ('09-flux1schnell-goutte-huile.png', 'Flux1schnell', 'Wide cinematic macro photograph, a single drop of golden motor oil falling and splashing on the very bottom edge, glowing amber, everything else deep navy blue darkness, large empty dark space in the center, premium commercial photography' + SANS),
    ('10-zimage-studio-projecteur.png', 'ZImageTurbo_INT8', 'Wide photograph of an empty dark photo studio, deep navy blue seamless backdrop, one soft circular spotlight pool on the glossy floor in the center, faint haze in the light beam, premium product advertising set ready for a product, nothing on the floor' + SANS),
    ('11-klein-soie-metal-liquide.png', 'Flux_2_Klein_4B_BF16', 'Wide abstract background, flowing folds of liquid metal like silk in deep navy blue with thin warm gold highlights on the edges, mostly dark, large calm empty area in the center, premium luxury advertising' + SANS),
    ('12-zimage-circuit-nuit.png', 'ZImageTurbo_INT8', 'Wide cinematic photograph of an empty racing circuit at night after rain, wet reflective asphalt in the lower third, blurred blue and amber floodlights as large bokeh far away, deep navy sky, large empty dark space in the center, automotive advertising' + SANS),
    ('16-klein-dunes-etoiles.png', 'Flux_2_Klein_4B_BF16', 'Wide cinematic photograph of Sahara sand dunes at night under a clear sky full of stars and a faint milky way, soft cold moonlight on the dune crests, deep navy blue tones, large empty dark sky in the center, calm and premium' + SANS),
    ('13-flux1schnell-orage-savane.png', 'Flux1schnell', 'Wide cinematic photograph of a distant thunderstorm at night over a flat savanna, soft lightning glow inside deep navy clouds near the horizon, calm dark sky above, large empty dark space in the center' + SANS),
]

K1 = (RACINE / 'assets/ai/v3/prompt-coupe-2.txt').read_text(encoding='utf-8').strip()
HERO = [
    ('H01-zimage-k1-trois-quarts-bleu.png', 'ZImageTurbo_INT8', K1.replace('seen exactly from its long side, perfectly centered', 'seen in a three-quarter front view, centered').replace('Single warm tungsten key light from the left, soft rim light on the right edges', 'Cold blue key light from the left, thin warm amber rim light on the right edges')),
    ('H02-zimage-huile-doree-coule.png', 'ZImageTurbo_INT8', K1.replace('Clean, dry, precise machined metal', 'A thin stream of golden amber motor oil pours from the top into the filler neck and glistening oil runs down over the camshaft, valve springs and pistons; precise machined metal')),
    ('H03-klein-v6-fond-anthracite.png', 'Flux_2_Klein_4B_BF16', 'Photorealistic studio product photograph of a real V6 car engine with a clean engineering cutaway revealing pistons, connecting rods, crankshaft and camshafts, centered, on a dark anthracite gradient background with a subtle glossy floor reflection, soft top light and cool rim lights, ultra detailed, automotive advertising photography, plain unmarked metal surfaces' + SANS),
    ('H04-flux1schnell-vue-eclatee.png', 'Flux1schnell', 'Photorealistic exploded view of a car engine, all parts floating apart in perfect alignment: pistons, connecting rods, crankshaft, camshaft, valves, cylinder head and block, centered, pure black background, warm key light from the left, sharp, ultra detailed, automotive advertising photography, plain unmarked metal' + SANS),
    ('H05-sana-turbo-eclaboussure.jpg', 'sana', 'Photorealistic studio photograph of a modern turbocharged car engine on pure black background, a dramatic splash of golden motor oil frozen in mid air across the engine, warm rim light, high speed photography, ultra detailed, automotive advertising, plain unmarked metal' + SANS),
    ('H06-zimage-fumee-lumiere-haut.png', 'ZImageTurbo_INT8', 'Photorealistic studio photograph of a polished inline four-cylinder car engine centered on a dark stage, light smoke drifting around it, one strong top light carving the metal, deep black and navy background, cinematic, ultra detailed, automotive advertising, plain unmarked metal' + SANS),
    ('H07-zimage-atelier-nuit.png', 'ZImageTurbo_INT8', 'Photorealistic photograph of a clean car engine with a lengthwise cutaway showing pistons and crankshaft, displayed on a steel stand in the center of a premium mechanic workshop at night, workshop completely out of focus with warm amber and blue bokeh lights, cinematic, 85mm lens, plain unmarked metal' + SANS),
]

NEGATIF = 'text, letters, words, logo, watermark, signature, people, hands, blurry, low quality, deformed'


def deapi(modele, prompt, sortie, l, h):
    pas = {'ZImageTurbo_INT8': '8', 'Flux1schnell': '4', 'Flux_2_Klein_4B_BF16': '4'}[modele]
    fichier = sortie.with_suffix('.txt')
    fichier.write_text(prompt, encoding='utf-8')
    subprocess.run([sys.executable, str(RACINE / 'ops/scripts/deapi.py'), 'image', modele, str(l), str(h), '2026', str(fichier), str(sortie), pas], check=True)


def sana(prompt, sortie, l, h):
    url = 'https://image.pollinations.ai/prompt/' + urllib.parse.quote(prompt) + f'?model=sana&width={l}&height={h}&nologo=true&seed=2026&negative_prompt=' + urllib.parse.quote(NEGATIF)
    for essai in range(4):
        if essai:
            time.sleep(60)
        r = httpx.get(url, timeout=180, follow_redirects=True)
        if r.status_code == 200 and r.headers.get('content-type', '').startswith('image'):
            sortie.write_bytes(r.content)
            print(sortie.name, len(r.content))
            return
    print('ÉCHEC', sortie.name, r.status_code, r.text[:200])


def main(quoi, seuls=()):
    liste = FONDS if quoi == 'fonds' else HERO
    dossier = RACINE / ('ops/captures/fonds-ia' if quoi == 'fonds' else 'ops/captures/hero-ia')
    dossier.mkdir(parents=True, exist_ok=True)
    for nom, modele, prompt in liste:
        sortie = dossier / nom
        if sortie.exists() or (seuls and not nom.startswith(tuple(seuls))):
            continue
        if modele == 'sana':
            sana(prompt, sortie, 1536, 864)
        else:
            l, h = {'Flux_2_Klein_4B_BF16': (1536, 864), 'Flux1schnell': (2048, 1152)}.get(modele, (2048, 1152))
            deapi(modele, prompt, sortie, l, h)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2:])
