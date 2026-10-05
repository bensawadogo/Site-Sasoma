"""decor_assets.py — télécharge les ressources CC0 de Poly Haven pour le décor « garage de
quartier » (ops/blender/decor.py) dans assets/ai/decor/ (hors git).

  python ops/blender/decor_assets.py
"""
import json
import os
import urllib.request

RACINE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
D = os.path.join(RACINE, 'assets', 'ai', 'decor')
TEXTURES = ['red_plaster_weathered', 'yellow_plaster_02', 'blue_plaster_weathered',
            'concrete_floor_worn_001', 'brown_planks_05']
MODELES = ['plastic_jerrycan', 'metal_jerrycan', 'plastic_monobloc_chair_01', 'old_tyre',
           'rusted_wheel_rim_01', 'wooden_crate_01', 'plastic_crate_01', 'metal_toolbox',
           'bench_vice_01', 'rollershutter_door', 'hanging_industrial_lamp', 'oil_tin',
           'small_oil_can_01', 'tire_pump', 'plastic_thermos', 'pipe_wrench', 'painted_wooden_bench']
HDRI = 'abandoned_garage'


def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'sasoma-site'}))


def telecharger(url, chemin):
    if os.path.exists(chemin):
        return
    os.makedirs(os.path.dirname(chemin), exist_ok=True)
    with get(url) as r, open(chemin, 'wb') as f:
        f.write(r.read())


for nom in TEXTURES:
    f = json.load(get(f'https://api.polyhaven.com/files/{nom}'))
    for carte in ('Diffuse', 'nor_gl', 'Rough', 'arm'):
        if carte in f and '2k' in f[carte]:
            v = f[carte]['2k'].get('jpg') or f[carte]['2k'].get('png')
            telecharger(v['url'], os.path.join(D, 'textures', nom, os.path.basename(v['url'])))
for nom in MODELES:
    f = json.load(get(f'https://api.polyhaven.com/files/{nom}'))
    g = f['gltf']['2k']['gltf']
    telecharger(g['url'], os.path.join(D, 'modeles', nom, os.path.basename(g['url'])))
    for chemin, v in g.get('include', {}).items():
        telecharger(v['url'], os.path.join(D, 'modeles', nom, chemin))
f = json.load(get(f'https://api.polyhaven.com/files/{HDRI}'))
v = f['hdri']['2k']['hdr']
telecharger(v['url'], os.path.join(D, 'hdri', os.path.basename(v['url'])))
taille = sum(os.path.getsize(os.path.join(r, n)) for r, _, ns in os.walk(D) for n in ns)
print('ressources :', D, taille // 2**20, 'Mo')
