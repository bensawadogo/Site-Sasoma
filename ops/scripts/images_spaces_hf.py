"""images_spaces_hf.py — propositions d'images via des Spaces Hugging Face publics (gradio_client, gratuit, quota ZeroGPU).

  python ops/scripts/images_spaces_hf.py
Les fichiers existants sont sautés.
"""
import shutil
import sys
from pathlib import Path

from gradio_client import Client

RACINE = Path(__file__).resolve().parents[2]
SANS = ', no text, no letters, no logo, no watermark, no people'
K1 = (RACINE / 'assets/ai/v3/prompt-coupe-2.txt').read_text(encoding='utf-8').strip()

TACHES = [
    ('fonds-ia/13-flux1schnellhf-orage-savane.webp', 'black-forest-labs/FLUX.1-schnell', 'Wide cinematic photograph of a distant thunderstorm at night over a flat African savanna, soft lightning glow inside deep navy clouds near the horizon, calm dark sky above, large empty dark space in the center, premium advertising photography' + SANS),
    ('fonds-ia/15-fluxkrea-fumee-ambre.webp', 'black-forest-labs/FLUX.1-Krea-dev', 'Wide cinematic background, thin wisps of warm amber smoke curling slowly in deep navy blue darkness, lit from the side, most of the frame dark, large empty dark space in the center, premium luxury advertising photography' + SANS),
    ('hero-ia/H04-fluxdev-coupe-k1.webp', 'black-forest-labs/FLUX.1-dev', K1),
    ('hero-ia/H05-hidream-coupe-huile.webp', 'HiDream-ai/HiDream-I1-Dev', 'Photorealistic studio product photograph of a real inline four-cylinder car engine with a lengthwise engineering cutaway showing pistons, connecting rods, crankshaft and camshaft, golden motor oil glistening on the moving parts, centered on a pure black background, warm key light from the left, cool rim light on the right, ultra detailed automotive advertising photography, plain unmarked metal' + SANS),
    ('hero-ia/H06-sd35-moteur-fumee.webp', 'stabilityai/stable-diffusion-3.5-large-turbo', 'Photorealistic studio photograph of a polished inline four-cylinder car engine with a cutaway side showing pistons and crankshaft, centered on a dark stage, light smoke drifting around it, one strong top light carving the metal, deep black and navy background, cinematic, ultra detailed automotive advertising, plain unmarked metal' + SANS),
]


def lancer(espace, prompt):
    c = Client(espace, verbose=False)
    if espace == 'Qwen/Qwen-Image':
        return c.predict(prompt=prompt, seed=2026, randomize_seed=False, aspect_ratio='16:9', guidance_scale=4.0, num_inference_steps=50, prompt_enhance=False, api_name='/infer')
    if espace == 'HiDream-ai/HiDream-I1-Dev':
        return c.predict(prompt=prompt, aspect_ratio='16:9', seed=2026, api_name='/generate_with_status')
    l, h = (1024, 576) if 'stable' in espace else (1536, 864) if 'schnell' in espace else (1920, 1088)
    kw = dict(prompt=prompt, seed=2026, randomize_seed=False, width=l, height=h, api_name='/infer')
    if 'stable' in espace:
        kw.update(negative_prompt='text, letters, logo, watermark, people', guidance_scale=0.0, num_inference_steps=4)
    elif 'schnell' in espace:
        kw.pop('randomize_seed'); kw.update(randomize_seed=False, num_inference_steps=4)
    else:
        kw.update(guidance_scale=3.5, num_inference_steps=28)
    return c.predict(**kw)


def chemin(r):
    if isinstance(r, (list, tuple)):
        for x in r:
            p = chemin(x)
            if p:
                return p
    if isinstance(r, dict):
        return r.get('path') or chemin(list(r.values()))
    if isinstance(r, str) and Path(r).is_file():
        return r
    return None


for nom, espace, prompt in TACHES:
    sortie = RACINE / 'ops/captures' / nom
    if sortie.exists():
        continue
    try:
        r = lancer(espace, prompt)
        p = chemin(r)
        if not p:
            print('ÉCHEC', nom, str(r)[:200], flush=True)
            continue
        shutil.copy(p, sortie.with_suffix(Path(p).suffix))
        print('OK', nom, flush=True)
    except Exception as e:
        print('ÉCHEC', nom, str(e)[:200], flush=True)
