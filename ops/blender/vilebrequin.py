"""vilebrequin.py — vilebrequin 4 cylindres en 3D, rendu de côté pour le hero (Blender 5.2).

  blender --background --python ops/blender/vilebrequin.py -- SORTIE_DOSSIER [N_ANGLES=24]

Unités : 1 unité Blender = 1 pixel de K1 (1344×768). L'image : x vers la droite, y vers le
bas ; Blender : X = x, Z = 588 − y (axe du vilebrequin à y = 588), Y = profondeur (la caméra
regarde vers +Y). Vilebrequin plat à 180° : manetons 1 et 4 ensemble, 2 et 3 opposés ;
rayon de manivelle 28 (course 56, comme moteur_v5.py). Rendu orthographique, fond
transparent, lumière clé à gauche et en haut (comme K1), une image par angle :
SORTIE/vilebrequin-000.png … (angle k × 360/N ; 0 = K1 : maneton 1 tourné vers nous).
"""
import math
import sys

import bpy
from mathutils import Vector

args = sys.argv[sys.argv.index('--') + 1:]
SORTIE = args[0]
N = int(args[1]) if len(args) > 1 else 24

AXE_Y = 588
CYL = (478, 617, 757, 897)
R = 28            # rayon de manivelle
X0, X1 = 412, 962  # étendue du vilebrequin
CADRE = (408, 506, 968, 670)  # zone rendue (x0, y0, x1, y1) en pixels de K1

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene


def matiere(nom, couleur, rugosite, metal=1.0):
    m = bpy.data.materials.new(nom)
    m.use_nodes = True
    p = m.node_tree.nodes['Principled BSDF']
    p.inputs['Base Color'].default_value = (*couleur, 1)
    p.inputs['Metallic'].default_value = metal
    p.inputs['Roughness'].default_value = rugosite
    return m


ACIER = matiere('acier forgé', (0.42, 0.42, 0.43), 0.45)
POLI = matiere('portée polie', (0.55, 0.55, 0.56), 0.22)


def cylindre_x(nom, x0, x1, rayon, centre_yz, mat, sommets=48):
    """Cylindre d'axe X entre x0 et x1, centré en (y, z)."""
    bpy.ops.mesh.primitive_cylinder_add(vertices=sommets, radius=rayon, depth=x1 - x0,
                                        location=((x0 + x1) / 2, centre_yz[0], centre_yz[1]),
                                        rotation=(0, math.pi / 2, 0))
    o = bpy.context.object
    o.name = nom
    o.data.materials.append(mat)
    bpy.ops.object.shade_smooth()
    return o


def bras(nom, x, epaisseur, angle, mat):
    """Bras de manivelle avec contrepoids : forme en poire dans le plan (Y, Z), extrudée en X.
    Côté maneton (angle) : bossage de rayon 21 ; côté opposé : contrepoids en secteur."""
    pts = []
    # Bossage autour du maneton.
    for k in range(25):
        a = angle - math.pi / 2 + math.pi * k / 24
        pts.append((R * math.cos(angle) + 21 * math.cos(a), R * math.sin(angle) + 21 * math.sin(a)))
    # Contrepoids : arc de rayon 47, ouverture 150°, à l'opposé du maneton.
    for k in range(31):
        a = angle + math.pi / 2 + math.radians(15) + math.radians(150) * k / 30
        pts.append((47 * math.cos(a), 47 * math.sin(a)))
    me = bpy.data.meshes.new(nom)
    n = len(pts)
    verts = [(x - epaisseur / 2, y, z) for y, z in pts] + [(x + epaisseur / 2, y, z) for y, z in pts]
    faces = [list(range(n)), list(range(2 * n - 1, n - 1, -1))]
    faces += [(i, (i + 1) % n, n + (i + 1) % n, n + i) for i in range(n)]
    me.from_pydata(verts, [], faces)
    me.update()
    o = bpy.data.objects.new(nom, me)
    scene.collection.objects.link(o)
    o.data.materials.append(mat)
    # Arêtes adoucies (chanfrein) : une pièce forgée n'a pas d'arête vive.
    b = o.modifiers.new('chanfrein', 'BEVEL')
    b.width = 1.6
    b.segments = 3
    return o


# Vilebrequin, angle 0 = pose de K1. Angles dans le plan (Y, Z) : Y vers l'arrière (loin de la
# caméra), Z vers le haut. À mi-course (K1), le maneton 1 est tourné vers la caméra (Y < 0).
racine = bpy.data.objects.new('vilebrequin', None)
scene.collection.objects.link(racine)
for i, c in enumerate(CYL):
    a = math.pi if i in (0, 3) else 0.0  # vers nous (Y < 0) / vers l arrière
    yz = (R * math.cos(a), R * math.sin(a))
    cylindre_x(f'maneton {i + 1}', c - 21, c + 21, 13, yz, POLI).parent = racine
    for s in (-1, 1):
        bras(f'bras {i + 1}{"ab"[s > 0]}', c + s * 29, 16, a, ACIER).parent = racine
# Tourillons (paliers) entre les cylindres et aux bouts.
bords = [X0] + [(CYL[k] + CYL[k + 1]) / 2 for k in range(3)] + [X1]
for k, xb in enumerate(bords):
    x0 = max(X0, xb - 36) if 0 < k < 4 else xb
    x1 = min(X1, xb + 36) if 0 < k < 4 else xb
    if k == 0:
        x0, x1 = X0, CYL[0] - 33
    if k == 4:
        x0, x1 = CYL[3] + 33, X1
    cylindre_x(f'tourillon {k}', x0, x1, 15, (0, 0), POLI).parent = racine
racine.location = (0, 0, 0)

# Caméra orthographique : 1 px de rendu = 1 px de K1.
cx, cy = (CADRE[0] + CADRE[2]) / 2, (CADRE[1] + CADRE[3]) / 2
cam_data = bpy.data.cameras.new('camera')
cam_data.type = 'ORTHO'
cam_data.ortho_scale = CADRE[2] - CADRE[0]
cam = bpy.data.objects.new('camera', cam_data)
scene.collection.objects.link(cam)
cam.location = (cx, -800, AXE_Y - cy)
cam.rotation_euler = (math.pi / 2, 0, 0)
scene.camera = cam
scene.render.resolution_x = CADRE[2] - CADRE[0]
scene.render.resolution_y = CADRE[3] - CADRE[1]
scene.render.resolution_percentage = 100
scene.render.film_transparent = True

# Lumières : clé chaude en haut à gauche (comme K1), contre-jour froid à droite, débouchage faible.
def lampe(nom, pos, energie, couleur, taille):
    d = bpy.data.lights.new(nom, 'AREA')
    d.energy = energie
    d.color = couleur
    d.size = taille
    o = bpy.data.objects.new(nom, d)
    scene.collection.objects.link(o)
    o.location = pos
    direction = Vector((cx, 0, 0)) - Vector(pos)
    o.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
    return o


lampe('clé', (cx - 700, -600, 500), 4.5e7, (1.0, 0.93, 0.82), 500)
lampe('contre', (cx + 700, 300, 250), 1.5e7, (0.8, 0.87, 1.0), 300)
lampe('débouchage', (cx, -900, -200), 3.0e6, (1, 1, 1), 800)
monde = bpy.data.worlds.new('monde')
monde.use_nodes = True
# Studio : dégradé clair en haut, sombre en bas (le métal poli reflète le studio, comme K1).
arbre = monde.node_tree
fond = arbre.nodes['Background']
coord = arbre.nodes.new('ShaderNodeTexCoord')
sep = arbre.nodes.new('ShaderNodeSeparateXYZ')
rampe = arbre.nodes.new('ShaderNodeValToRGB')
rampe.color_ramp.elements[0].position = 0.45
rampe.color_ramp.elements[0].color = (0.01, 0.01, 0.012, 1)
rampe.color_ramp.elements[1].position = 0.75
rampe.color_ramp.elements[1].color = (0.35, 0.33, 0.31, 1)
arbre.links.new(coord.outputs['Generated'], sep.inputs['Vector'])
arbre.links.new(sep.outputs['Z'], rampe.inputs['Fac'])
arbre.links.new(rampe.outputs['Color'], fond.inputs['Color'])
fond.inputs['Strength'].default_value = 1.0
scene.world = monde

scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.samples = 48
scene.cycles.use_denoising = True
scene.view_settings.view_transform = 'Standard'
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'

for k in range(N):
    racine.rotation_euler = (2 * math.pi * k / N, 0, 0)
    scene.render.filepath = f'{SORTIE}/vilebrequin-{k:03d}.png'
    bpy.ops.render.render(write_still=True)
print('FINI', N)
