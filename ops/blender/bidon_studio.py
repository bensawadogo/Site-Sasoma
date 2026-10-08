"""bidon_studio.py — bidon STÄRK en rendu studio (Cycles), fond transparent, qui tourne.

Pour la section « produit phare » au scroll (comme la canette de drinkcollider.com) : une
séquence d'images du bidon sur 360°, que le site fait défiler avec la page.
Éclairage photo produit : grande boîte à lumière principale, débouchage doux, deux
liserés arrière (contours nets sur fond sombre), sol absent (fond transparent).

  blender -b -P ops/blender/bidon_studio.py -- SORTIE_DOSSIER N_IMAGES TAILLE [ECHANTILLONS] [IMAGE_SEULE] [DEBUT FIN]
"""
import math, sys
import bpy
from mathutils import Vector

a = sys.argv[sys.argv.index('--') + 1:]
SORTIE, N, TAILLE = a[0], int(a[1]), int(a[2])
ECH = int(a[3]) if len(a) > 3 else 96
SEULE = int(a[4]) if len(a) > 4 else -1
# Angles (degrés) : de DEBUT à FIN inclus sur N images. Le modèle montre l'étiquette à l'envers
# par transparence au dos : la séquence du site reste entre -90° et +90°.
DEBUT = float(a[5]) if len(a) > 5 else -30
FIN = float(a[6]) if len(a) > 6 else None

# ── Réglages de lumière (06/10 : Ben trouvait le bidon trop lumineux) ──────────────────────
EXPOSITION = -1.0   # exposition générale (IL) : plus bas = plus sombre
CLE = 0.6           # boîte à lumière principale (avant gauche)
DEBOUCHAGE = 0.05   # remplissage des ombres : bas = plus de contraste
LISERES = 1.3       # liserés arrière (contours du bidon)
DESSUS = 0.2        # lumière du dessus (bouchon, épaules)
MONDE = 0.3         # reflets ambiants

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath='C:/SITE-SASOMA/petrovoll-astro/src/assets/bidon/bidon.glb')
objs = [o for o in bpy.context.scene.objects if o.type == 'MESH']

# Pivot : un vide au centre du bidon, parent de tout (rotation autour de l'axe vertical).
pts = [o.matrix_world @ Vector(c) for o in objs for c in o.bound_box]
mn = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
mx = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
centre, dim = (mn + mx) / 2, mx - mn
pivot = bpy.data.objects.new('pivot', None); bpy.context.scene.collection.objects.link(pivot)
pivot.location = centre
for o in bpy.context.scene.objects:
    if o.parent is None and o is not pivot:
        o.parent = pivot; o.matrix_parent_inverse = pivot.matrix_world.inverted()
H = max(dim.x, dim.y, dim.z)

# Dos du bidon : le modèle (Meshy) y projette l'étiquette avant en miroir. On remplace la
# couleur par le plastique gris du bidon sur la moitié arrière (repère du pivot, qui tourne
# avec lui), relief (normal map) gardé : le bidon peut faire un tour complet.
import numpy as np
mat = bpy.data.materials['Material_0']; nt = mat.node_tree
tex = next(n for n in nt.nodes if n.type == 'TEX_IMAGE' and nt.nodes['Principled BSDF'].inputs['Base Color'].links
           and n.outputs['Color'].links and n.outputs['Color'].links[0].to_node.type == 'BSDF_PRINCIPLED'
           and n.outputs['Color'].links[0].to_socket.name == 'Base Color')
px = np.array(tex.image.pixels[:], np.float32).reshape(-1, 4)[:, :3]
sat = px.max(1) - px.min(1); lum = px.mean(1)
gris = np.median(px[(sat < 0.04) & (lum > 0.25) & (lum < 0.85)], axis=0)
gris = ((gris + 0.055) / 1.055) ** 2.4  # pixels de la texture en sRGB -> couleur linéaire
coord = nt.nodes.new('ShaderNodeTexCoord'); coord.object = pivot
sep = nt.nodes.new('ShaderNodeSeparateXYZ'); nt.links.new(coord.outputs['Object'], sep.inputs[0])
rampe = nt.nodes.new('ShaderNodeMapRange'); nt.links.new(sep.outputs['Y'], rampe.inputs['Value'])
rampe.inputs['From Min'].default_value = dim.y * 0.04; rampe.inputs['From Max'].default_value = dim.y * 0.14
mix = nt.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'
nt.links.new(rampe.outputs['Result'], mix.inputs['Factor'])
nt.links.new(tex.outputs['Color'], mix.inputs[6])
mix.inputs[7].default_value = (*[float(v) for v in gris], 1)
nt.links.new(mix.outputs[2], nt.nodes['Principled BSDF'].inputs['Base Color'])
# Le relief (normal map) porte aussi l'étiquette en miroir : il s'efface au dos.
nm = next(n for n in nt.nodes if n.type == 'NORMAL_MAP')
inv = nt.nodes.new('ShaderNodeMath'); inv.operation = 'SUBTRACT'; inv.inputs[0].default_value = 1.0
nt.links.new(rampe.outputs['Result'], inv.inputs[1]); nt.links.new(inv.outputs[0], nm.inputs['Strength'])
print('gris plastique', gris)

sc = bpy.context.scene
sc.render.engine = 'CYCLES'
sc.cycles.device = 'CPU'
sc.cycles.samples = ECH
sc.cycles.use_denoising = True
sc.render.film_transparent = True
sc.render.resolution_x = sc.render.resolution_y = TAILLE
sc.render.image_settings.file_format = 'PNG'
sc.render.image_settings.color_mode = 'RGBA'
sc.view_settings.view_transform = 'Standard'  # AgX délavait le rouge du bouchon et l'étiquette
sc.view_settings.look = 'Medium High Contrast'
sc.view_settings.exposure = EXPOSITION

# Monde : gris très sombre et neutre (reflets doux sur le plastique, pas de couleur parasite).
w = bpy.data.worlds.new('studio'); sc.world = w; w.use_nodes = True
w.node_tree.nodes['Background'].inputs[0].default_value = (0.02, 0.02, 0.022, 1)
w.node_tree.nodes['Background'].inputs[1].default_value = MONDE

cam_d = bpy.data.cameras.new('cam'); cam_d.lens = 85
cam = bpy.data.objects.new('cam', cam_d); sc.collection.objects.link(cam); sc.camera = cam
dist = H * 3.1
cam.location = centre + Vector((0, -dist, H * 0.18))
cam.rotation_euler = (math.radians(90 - math.degrees(math.atan2(H * 0.18, dist))), 0, 0)


def lumiere(nom, pos, energie, taille, couleur=(1, 1, 1), forme='RECTANGLE', sy=None):
    d = bpy.data.lights.new(nom, 'AREA'); d.energy = energie; d.color = couleur
    d.shape = forme; d.size = taille; d.size_y = sy or taille
    o = bpy.data.objects.new(nom, d); sc.collection.objects.link(o)
    o.location = centre + Vector(pos) * H
    o.rotation_euler = (centre - o.location).to_track_quat('-Z', 'Y').to_euler()
    return o

E = 220 * H * H
lumiere('cle', (-1.7, -1.6, 1.2), E * CLE, H * 1.2, (1.0, 0.97, 0.93))         # boîte principale
lumiere('debouchage', (1.9, -1.4, 0.2), E * DEBOUCHAGE, H * 2.0, (0.92, 0.96, 1.0))   # remplissage très doux : modelé
lumiere('lisere_g', (-1.5, 1.6, 0.6), E * LISERES, H * 0.25, (0.85, 0.92, 1.0), sy=H * 2.2)  # contours
lumiere('lisere_d', (1.5, 1.6, 0.6), E * LISERES, H * 0.25, (1.0, 0.85, 0.65), sy=H * 2.2)
lumiere('dessus', (0, -0.3, 2.2), E * DESSUS, H * 1.2)

# Rotation : -45° à +315° (face d'étiquette vers la caméra au premier quart).
for i in range(N):
    if SEULE >= 0 and i != SEULE:
        continue
    ang = DEBUT + (360 * i / N if FIN is None else (FIN - DEBUT) * i / max(N - 1, 1))
    pivot.rotation_euler = (0, 0, math.radians(ang))
    sc.render.filepath = f'{SORTIE}/{i:03d}.png'
    bpy.ops.render.render(write_still=True)
print('OK', N, 'images')
