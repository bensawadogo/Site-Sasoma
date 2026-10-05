"""decor.py — décor « garage de quartier » (Ouagadougou) derrière le moteur du hero, Blender 5.2.

  blender -b --python ops/blender/decor.py -- SORTIE.png [ETAT=allume|penombre] [ECHANTILLONS=128] [POURCENT=100] [CHAMP=1]

CHAMP > 1 : même caméra, même échelle, champ CHAMP fois plus large et plus haut (fond plein
écran du site, autour de l'image du moteur ; son centre coïncide avec le rendu CHAMP = 1).

Direction artistique (docs/plan-correction-hero-v5.md, « Décor ») : mur crépi ocre, soubassement
bleu cobalt écaillé, rideau de fer relevé à droite qui laisse entrer un rayon de soleil chaud
(clé en haut à droite, comme la photo du moteur), contre-jour froid à gauche, baladeuse ;
pneus et jantes, jerrycans, chaise monobloc, caisses, thermos sur une caisse. Ressources CC0
de Poly Haven (ops/blender/decor_assets.py). Repère du site (image K1 retournée).

Caméra calée sur la photo : le moteur (≈ 780 px de long) mesure ~0,6 m, soit 0,77 mm par
pixel dans son plan (Y = 0). Perspective 50 mm à 1,43 m, à mi-hauteur du moteur ; il repose
sur un établi dont le plateau est à y = 690 px. Le moteur lui-même n'est pas rendu : un
volume invisible à la caméra porte son ombre sur l'établi.
"""
import math
import os
import random
import sys

import bpy

args = sys.argv[sys.argv.index('--') + 1:]
SORTIE = os.path.abspath(args[0])
ETAT = args[1] if len(args) > 1 else 'allume'
ECH = int(args[2]) if len(args) > 2 else 128
PCT = int(args[3]) if len(args) > 3 else 100  # résolution réduite pour les essais
CHAMP = float(args[4]) if len(args) > 4 else 1.0
RACINE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
A = os.path.join(RACINE, 'assets', 'ai', 'decor')
L, H = 1344, 768
MM = 0.00077                     # m par pixel dans le plan du moteur
PLATEAU = (384 - 690) * MM       # dessus de l'établi (Z), caméra à mi-hauteur (y = 384)
SOL = PLATEAU - 0.86
MUR = 2.3                        # distance du mur du fond derrière le moteur
random.seed(11)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene


def X(px):
    return (px - L / 2) * MM


def texture(nom, teinte=None, echelle=1.0):
    """Matériau PBR Poly Haven (diffuse, normale GL, rugosité), teinte multipliée en option."""
    m = bpy.data.materials.new(nom)
    nt = m.node_tree
    pb = nt.nodes['Principled BSDF']
    d = os.path.join(A, 'textures', nom)
    co = nt.nodes.new('ShaderNodeTexCoord')
    mp = nt.nodes.new('ShaderNodeMapping')
    mp.inputs['Scale'].default_value = (echelle, echelle, echelle)
    nt.links.new(co.outputs['UV'], mp.inputs['Vector'])

    def image(suffixe, couleur):
        t = nt.nodes.new('ShaderNodeTexImage')
        t.image = bpy.data.images.load(os.path.join(d, f'{nom}_{suffixe}_2k.jpg'))
        if not couleur:
            t.image.colorspace_settings.name = 'Non-Color'
        nt.links.new(mp.outputs['Vector'], t.inputs['Vector'])
        return t
    diff = image('diff', True)
    if teinte:
        mix = nt.nodes.new('ShaderNodeMix')
        mix.data_type = 'RGBA'
        mix.blend_type = 'MULTIPLY'
        mix.inputs['Factor'].default_value = 1.0
        nt.links.new(diff.outputs['Color'], mix.inputs['A'])
        mix.inputs['B'].default_value = (*teinte, 1)
        nt.links.new(mix.outputs['Result'], pb.inputs['Base Color'])
    else:
        nt.links.new(diff.outputs['Color'], pb.inputs['Base Color'])
    nt.links.new(image('rough', False).outputs['Color'], pb.inputs['Roughness'])
    nm = nt.nodes.new('ShaderNodeNormalMap')
    nt.links.new(image('nor_gl', False).outputs['Color'], nm.inputs['Color'])
    nt.links.new(nm.outputs['Normal'], pb.inputs['Normal'])
    return m


def plan(nom, l, h, lieu, rotation, mat, uv=1.0):
    bpy.ops.mesh.primitive_plane_add(size=1, location=lieu, rotation=rotation)
    o = bpy.context.object
    o.name = nom
    o.scale = (l, h, 1)
    bpy.ops.object.transform_apply(scale=True)
    for b in o.data.uv_layers.active.data:
        b.uv = (b.uv[0] * l / uv, b.uv[1] * h / uv)
    o.data.materials.append(mat)
    return o


def modele(nom, lieu, rot_z=0.0, echelle=1.0):
    chemin = os.path.join(A, 'modeles', nom, f'{nom}_2k.gltf')
    bpy.ops.import_scene.gltf(filepath=chemin)
    objs = bpy.context.selected_objects
    parent = bpy.data.objects.new(nom, None)
    scene.collection.objects.link(parent)
    for o in objs:
        if o.parent is None:
            o.parent = parent
    parent.location = lieu
    parent.rotation_euler = (0, 0, rot_z)
    parent.scale = (echelle,) * 3
    return parent


# ── Murs, sol, établi ──
ocre = texture('red_plaster_weathered', (1.0, 0.72, 0.45), 1.2)
bleu = texture('blue_plaster_weathered', (0.75, 0.85, 1.0), 1.2)
beton = texture('concrete_floor_worn_001', (0.8, 0.74, 0.66), 0.8)
bois = texture('brown_planks_05', (0.9, 0.8, 0.7), 1.5)
plan('Mur', 7, 2.0, (0, MUR, SOL + 1.0 + 1.0), (math.pi / 2, 0, 0), ocre, 1.0)
plan('Soubassement', 7, 1.0, (0, MUR - 0.002, SOL + 0.5), (math.pi / 2, 0, 0), bleu, 1.0)
plan('Sol', 8, 6, (0, 1.0, SOL), (0, 0, 0), beton, 1.5)
plan('Plateau établi', 1.9, 0.75, (0.05, 0.05, PLATEAU), (0, 0, 0), bois, 0.6)
plan('Chant établi', 1.9, 0.06, (0.05, -0.325, PLATEAU - 0.03), (math.pi / 2, 0, 0), bois, 0.6)

# Rideau de fer relevé à droite : l'ouverture laisse voir la rue en plein soleil.
porte = modele('rollershutter_door', (1.55, MUR - 0.05, SOL), 0, 1.0)
rue = plan('Rue (lumière)', 2.2, 1.6, (1.6, MUR + 0.6, SOL + 0.8), (math.pi / 2, 0, 0),
           bpy.data.materials.new('rue'))
mr = rue.data.materials[0]
em = mr.node_tree.nodes.new('ShaderNodeEmission')
em.inputs['Color'].default_value = (1.0, 0.72, 0.42, 1)
em.inputs['Strength'].default_value = 6.0 if ETAT == 'allume' else 2.5
mr.node_tree.links.new(em.outputs['Emission'], mr.node_tree.nodes['Material Output'].inputs['Surface'])

# ── Objets du quotidien (au fond, flous) ──
# L'établi masque le bas du champ : tout ce qui compte est au-dessus de SOL + 0,4 environ.
for k, rz in enumerate((0.3, 1.1, 0.6, 2.0, 1.4)):          # pile de pneus à gauche
    modele('old_tyre', (-0.78, 1.95, SOL + 0.2 * k), rz)
modele('rusted_wheel_rim_01', (-1.25, MUR - 0.08, SOL + 1.05), 0.0)   # jante accrochée au mur
modele('wooden_crate_01', (0.82, 1.95, SOL), 0.1)            # caisses empilées à droite
modele('wooden_crate_01', (0.84, 1.97, SOL + 0.36), -0.15)
modele('plastic_jerrycan', (0.78, 1.95, SOL + 0.72), 0.5)
modele('metal_jerrycan', (1.05, 1.9, SOL + 0.36), 0.4)
modele('plastic_thermos', (0.95, 1.9, SOL + 0.72), 0.0)
modele('plastic_monobloc_chair_01', (0.35, 1.6, SOL), -0.6)
modele('plastic_jerrycan', (-0.35, 2.0, SOL), -0.3)
modele('plastic_crate_01', (-0.35, 2.0, SOL + 0.3), 0.25)
# Étagère au mur : une planche et quelques bidons et burettes, sans marque.
plan('Étagère', 1.3, 0.22, (-0.15, MUR - 0.11, SOL + 1.35), (0, 0, 0), bois, 0.6)
for k, (nom, x) in enumerate((('oil_tin', -0.65), ('small_oil_can_01', -0.4), ('oil_tin', -0.15),
                              ('plastic_thermos', 0.12), ('small_oil_can_01', 0.32))):
    modele(nom, (x, MUR - 0.12, SOL + 1.35), random.uniform(-0.5, 0.5))
# Sur l'établi, hors du moteur : une boîte à outils à gauche, une burette à droite.
modele('metal_toolbox', (-0.98, 0.25, PLATEAU), 0.2)
modele('small_oil_can_01', (0.62, -0.05, PLATEAU), -0.4)
modele('pipe_wrench', (0.5, -0.18, PLATEAU), 1.3)

# ── Ombre du moteur : volume invisible à la caméra, mais qui ombre l'établi ──
bpy.ops.mesh.primitive_cube_add(size=1, location=(X(672), 0.0, PLATEAU + (690 - 120) * MM / 2))
ombre = bpy.context.object
ombre.name = 'Moteur (ombre)'
ombre.scale = (640 * MM, 0.2, (690 - 120) * MM)
ombre.visible_camera = False
ombre.visible_glossy = True

# ── Lumière ──
soleil = bpy.data.objects.new('Rayon de soleil', bpy.data.lights.new('soleil', 'SPOT'))
# Le rayon entre par une ouverture hors champ, en haut à droite, et tombe en biais sur le mur.
soleil.location = (2.1, 0.9, SOL + 2.7)
cible = bpy.data.objects.new('Tache de soleil', None)
cible.location = (-0.2, MUR, SOL + 1.0)
scene.collection.objects.link(cible)
vise = soleil.constraints.new('TRACK_TO')
vise.target = cible
vise.track_axis = 'TRACK_NEGATIVE_Z'
vise.up_axis = 'UP_Y'
soleil.data.energy = 2500 if ETAT == 'allume' else 600
soleil.data.color = (1.0, 0.78, 0.52)
soleil.data.spot_size = math.radians(48)
soleil.data.spot_blend = 0.05
# Fenêtre hors champ entre le soleil et le mur : la tache devient un rectangle découpé par
# des montants (cadre invisible à la caméra, qui ne fait que de l'ombre).
fenetre = bpy.data.objects.new('Fenêtre', None)
fenetre.location = (1.55, 1.22, 1.13)
scene.collection.objects.link(fenetre)
vers = fenetre.constraints.new('TRACK_TO')
vers.target = soleil
vers.track_axis = 'TRACK_Z'
vers.up_axis = 'UP_Y'
for (cx, cy, lx, ly) in ((0, 0.24, 0.9, 0.18), (0, -0.24, 0.9, 0.18), (0.36, 0, 0.18, 0.66),
                         (-0.36, 0, 0.18, 0.66), (0, 0, 0.018, 0.4), (0, 0.02, 0.6, 0.018)):
    bpy.ops.mesh.primitive_cube_add(size=1)
    b = bpy.context.object
    b.name = 'Cadre de fenêtre'
    b.parent = fenetre
    b.location = (cx, cy, 0)
    b.scale = (lx, ly, 0.02)
    b.visible_camera = False
    b.visible_glossy = False
soleil.data.shadow_soft_size = 0.05
scene.collection.objects.link(soleil)
cle = bpy.data.objects.new('Clé (moteur)', bpy.data.lights.new('cle', 'AREA'))
cle.location = (1.1, -0.9, 1.0)
cle.rotation_euler = (math.radians(60), 0, math.radians(130))
cle.data.energy = 120 if ETAT == 'allume' else 40
cle.data.size = 1.8
cle.data.color = (1.0, 0.86, 0.7)
scene.collection.objects.link(cle)
contre = bpy.data.objects.new('Contre-jour froid', bpy.data.lights.new('contre', 'AREA'))
contre.location = (-1.6, 1.2, 0.6)
contre.rotation_euler = (math.radians(80), 0, math.radians(-110))
contre.data.energy = 90
contre.data.size = 1.2
contre.data.color = (0.62, 0.74, 1.0)
contre.data.use_shadow = False  # pas d'ombre portée du moteur vers la caméra
scene.collection.objects.link(contre)
lampe = bpy.data.objects.new('Baladeuse', bpy.data.lights.new('baladeuse', 'POINT'))
lampe.location = (-0.55, 0.9, PLATEAU + 1.0)
lampe.data.energy = 35 if ETAT == 'allume' else 6
lampe.data.color = (1.0, 0.7, 0.4)
lampe.data.shadow_soft_size = 0.04
scene.collection.objects.link(lampe)
# Poussière dans le rayon : un léger volume diffusant devant le mur.
bpy.ops.mesh.primitive_cube_add(size=1, location=(0.6, 1.3, SOL + 1.2))
air = bpy.context.object
air.name = 'Poussière'
air.scale = (3.5, 2.2, 2.4)
ma = bpy.data.materials.new('poussière')
vs = ma.node_tree.nodes.new('ShaderNodeVolumeScatter')
vs.inputs['Density'].default_value = 0.05 if ETAT == 'allume' else 0.03
vs.inputs['Anisotropy'].default_value = 0.5
ma.node_tree.nodes.remove(ma.node_tree.nodes['Principled BSDF'])
ma.node_tree.links.new(vs.outputs['Volume'], ma.node_tree.nodes['Material Output'].inputs['Volume'])
air.data.materials.append(ma)
# Monde : l'HDRI d'un garage, très bas, seulement pour les reflets.
world = bpy.data.worlds.new('garage')
scene.world = world
env = world.node_tree.nodes.new('ShaderNodeTexEnvironment')
env.image = bpy.data.images.load(os.path.join(A, 'hdri', 'abandoned_garage_2k.hdr'))
world.node_tree.links.new(env.outputs['Color'], world.node_tree.nodes['Background'].inputs['Color'])
world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.15

# ── Caméra ──
cam = bpy.data.objects.new('Caméra', bpy.data.cameras.new('cam'))
cam.location = (0, -1.43, 0)
cam.rotation_euler = (math.pi / 2, 0, 0)
cam.data.lens = 50
cam.data.sensor_width = 36 * CHAMP
cam.data.sensor_fit = 'HORIZONTAL'
cam.data.dof.use_dof = True
cam.data.dof.focus_distance = 1.43
cam.data.dof.aperture_fstop = 2.8
scene.collection.objects.link(cam)
scene.camera = cam

r = scene.render
r.engine = 'CYCLES'
r.resolution_x, r.resolution_y = round(L * CHAMP), round(H * CHAMP)
r.resolution_percentage = PCT
r.image_settings.file_format = 'PNG'
r.filepath = SORTIE
scene.cycles.device = 'CPU'
scene.cycles.samples = ECH
scene.cycles.use_denoising = True
scene.cycles.volume_step_rate = 4
scene.view_settings.view_transform = 'AgX'
scene.view_settings.look = 'AgX - Medium High Contrast'
scene.view_settings.exposure = -0.3
bpy.ops.wm.save_as_mainfile(filepath=SORTIE.replace('.png', '.blend'))
bpy.ops.render.render(write_still=True)
print('décor :', SORTIE)
