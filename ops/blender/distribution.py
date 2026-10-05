"""distribution.py — arbre à cames, poussoirs et soupapes, rendus de côté pour le hero (Blender 5.2).

  blender --background --python ops/blender/distribution.py -- SORTIE_DOSSIER [N_ANGLES=36]

Mêmes conventions que vilebrequin.py : 1 unité = 1 pixel de K1, X = x, Z = AXE − y, la caméra
regarde vers +Y, rendu orthographique sur fond transparent, clé à gauche.

Distribution : l'arbre à cames (visible ici : admission, deux soupapes par cylindre) tourne
à la moitié du vilebrequin. Ordre d'allumage 1-3-4-2 ; la came d'un cylindre est au plus
haut de sa levée 110° de vilebrequin après le PMH d'admission. CAMES (ci-dessous) est la
même formule que moteur-vivant.ts (levée des soupapes) : la garder identique des deux côtés.

Sorties : cames-000.png … (angle d'arbre k × 360/N), soupape.png (poussoir + ressort + queue,
au repos, axe en x = 0), tete-soupape.png (tête de soupape vue de profil).
"""
import math
import sys

import bpy
from mathutils import Vector

args = sys.argv[sys.argv.index('--') + 1:]
SORTIE = args[0]
N = int(args[1]) if len(args) > 1 else 36

AXE = 176                       # axe de l'arbre à cames (y de K1)
CYL = (478, 617, 757, 897)
BASE, LEVEE, DEMI_OUVERTURE = 18.0, 10.0, math.radians(72)
ECART_SOUPAPES = 18             # deux soupapes par cylindre, à c ± 18
CADRE = (440, 138, 962, 216)    # zone des cames (x0, y0, x1, y1)

# Nez de came de chaque cylindre (angle dans le plan (Y, Z) quand l'arbre est à 0).
PMH_ALLUMAGE_1 = 3 * math.pi / 2            # θ vilebrequin où le cylindre 1 est au PMH (moteur-vivant.ts)
PIC_1 = PMH_ALLUMAGE_1 + 2 * math.pi + math.radians(110)
BETA = {0: -math.pi / 2 - PIC_1 / 2}
for i, retard in ((2, 1), (3, 2), (1, 3)):  # 1-3-4-2 : cylindres d'indice 0, 2, 3, 1
    BETA[i] = BETA[0] - retard * math.pi / 2


def bosse(phi):
    phi = (phi + math.pi) % (2 * math.pi) - math.pi
    return math.cos(phi / DEMI_OUVERTURE * math.pi / 2) ** 2 if abs(phi) < DEMI_OUVERTURE else 0.0


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


# Teintes relevées sur K1 : arbre bronze (fonte trempée), chapeaux aluminium.
ARBRE = matiere('arbre', (0.24, 0.20, 0.155), 0.1)
TOURILLON = matiere('tourillon', (0.15, 0.13, 0.11), 0.35)
CHAPEAU = matiere('chapeau', (0.11, 0.105, 0.095), 0.62)
ACIER = matiere('acier', (0.55, 0.55, 0.57), 0.25)
RESSORT = matiere('ressort', (0.18, 0.18, 0.19), 0.45)


def objet(nom, me, mat, parent=None, biseau=0.0):
    o = bpy.data.objects.new(nom, me)
    scene.collection.objects.link(o)
    o.data.materials.append(mat)
    if parent:
        o.parent = parent
    if biseau:
        b = o.modifiers.new('chanfrein', 'BEVEL')
        b.width = biseau
        b.segments = 2
    for f in o.data.polygons:
        f.use_smooth = True
    return o


def extrusion_x(nom, profil, x, largeur):
    """Profil fermé dans le plan (Y, Z), extrudé le long de X."""
    me = bpy.data.meshes.new(nom)
    n = len(profil)
    v = [(x - largeur / 2, y, z) for y, z in profil] + [(x + largeur / 2, y, z) for y, z in profil]
    f = [list(range(n)), list(range(2 * n - 1, n - 1, -1))] + [(i, (i + 1) % n, n + (i + 1) % n, n + i) for i in range(n)]
    me.from_pydata(v, [], f)
    me.update()
    return me


def cylindre(nom, x0, x1, r, mat, parent=None, yz=(0, 0)):
    profil = [(yz[0] + r * math.cos(2 * math.pi * k / 48), yz[1] + r * math.sin(2 * math.pi * k / 48)) for k in range(48)]
    return objet(nom, extrusion_x(nom, profil, (x0 + x1) / 2, x1 - x0), mat, parent, 0.8)


def boite(nom, x0, x1, z0, z1, y0, y1, mat, parent=None):
    profil = [(y0, z0), (y1, z0), (y1, z1), (y0, z1)]
    return objet(nom, extrusion_x(nom, profil, (x0 + x1) / 2, x1 - x0), mat, parent, 1.5)


# ── Arbre à cames (tourne) ─────────────────────────────────────────────────
arbre = bpy.data.objects.new('arbre à cames', None)
scene.collection.objects.link(arbre)
cylindre('arbre', CADRE[0] + 6, CADRE[2] - 6, 14, ARBRE, arbre)
for i, c in enumerate(CYL):
    for s in (-1, 1):
        profil = []
        for k in range(96):
            a = 2 * math.pi * k / 96
            r = BASE + LEVEE * bosse(a - BETA[i])
            profil.append((r * math.cos(a), r * math.sin(a)))
        objet(f'came {i + 1}{"ab"[s > 0]}', extrusion_x('came', profil, c + s * ECART_SOUPAPES, 16), ARBRE, arbre, 0.8)

# ── Paliers et chapeaux (fixes) : entre les cylindres et aux bouts ──────────
for xp in (446, 548, 687, 827, CADRE[2] - 14):
    cylindre('tourillon', xp - 11, xp + 11, 17, TOURILLON)
    boite('chapeau', xp - 14, xp + 14, -28, 25, -22, 22, CHAPEAU)
    for dx in (-7, 7):
        cylindre('vis', xp + dx - 3, xp + dx + 3, 3.2, ACIER, None, (-14, 24))

# Caméra, lumières, monde : comme vilebrequin.py.
def camera(cadre, centre_z):
    cx, cy = (cadre[0] + cadre[2]) / 2, (cadre[1] + cadre[3]) / 2
    d = bpy.data.cameras.new('camera')
    d.type = 'ORTHO'
    d.ortho_scale = max(cadre[2] - cadre[0], cadre[3] - cadre[1])
    o = bpy.data.objects.new('camera', d)
    scene.collection.objects.link(o)
    o.location = (cx, -800, centre_z - cy)
    o.rotation_euler = (math.pi / 2, 0, 0)
    scene.camera = o
    scene.render.resolution_x = int(round(cadre[2] - cadre[0]))
    scene.render.resolution_y = int(round(cadre[3] - cadre[1]))
    return o


cam = camera(CADRE, AXE)
cx = (CADRE[0] + CADRE[2]) / 2


def lampe(nom, pos, energie, couleur, taille):
    d = bpy.data.lights.new(nom, 'AREA')
    d.energy, d.color, d.size = energie, couleur, taille
    o = bpy.data.objects.new(nom, d)
    scene.collection.objects.link(o)
    o.location = pos
    o.rotation_euler = (Vector((cx, 0, 0)) - Vector(pos)).to_track_quat('-Z', 'Y').to_euler()


lampe('clé', (cx - 700, -600, 500), 4.5e7, (1.0, 0.93, 0.82), 500)
lampe('contre', (cx + 700, 300, 250), 1.5e7, (0.8, 0.87, 1.0), 300)
lampe('débouchage', (cx, -900, -200), 3.0e6, (1, 1, 1), 800)
# Bande lumineuse en haut, face à la caméra : le dos des cames l'accroche, le reflet tourne avec elles.
bande = bpy.data.lights.new('bande', 'AREA')
bande.shape = 'RECTANGLE'
bande.size, bande.size_y = 900, 40
bande.energy = 1.1e7
o_bande = bpy.data.objects.new('bande', bande)
scene.collection.objects.link(o_bande)
o_bande.location = (cx, -260, 220)
o_bande.rotation_euler = (Vector((cx, 0, 0)) - Vector(o_bande.location)).to_track_quat('-Z', 'Y').to_euler()
monde = bpy.data.worlds.new('monde')
monde.use_nodes = True
arbre_n = monde.node_tree
coord = arbre_n.nodes.new('ShaderNodeTexCoord')
sep = arbre_n.nodes.new('ShaderNodeSeparateXYZ')
rampe = arbre_n.nodes.new('ShaderNodeValToRGB')
rampe.color_ramp.elements[0].position = 0.45
rampe.color_ramp.elements[0].color = (0.01, 0.01, 0.012, 1)
rampe.color_ramp.elements[1].position = 0.75
rampe.color_ramp.elements[1].color = (0.35, 0.33, 0.31, 1)
arbre_n.links.new(coord.outputs['Generated'], sep.inputs['Vector'])
arbre_n.links.new(sep.outputs['Z'], rampe.inputs['Fac'])
arbre_n.links.new(rampe.outputs['Color'], arbre_n.nodes['Background'].inputs['Color'])
scene.world = monde

scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.samples = 48
scene.cycles.use_denoising = True
scene.view_settings.view_transform = 'AgX'
scene.view_settings.look = 'AgX - Medium High Contrast'
scene.view_settings.exposure = -0.9
scene.render.film_transparent = True
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'

for k in range(N):
    arbre.rotation_euler = (2 * math.pi * k / N, 0, 0)
    scene.render.filepath = f'{SORTIE}/cames-{k:03d}.png'
    bpy.ops.render.render(write_still=True)

# ── Pièces de soupape, au repos, axe x = 0 (le site les déplace et comprime le ressort) ──
def vider():
    for o in list(scene.objects):
        if o.type in ('MESH', 'EMPTY', 'CURVE'):
            bpy.data.objects.remove(o)
    if scene.objects.get('camera'):
        bpy.data.objects.remove(scene.objects['camera'])


Y_POUSSOIR = AXE + BASE                  # haut du poussoir, contre le cercle de base de la came
H_POUSSOIR = 9
Y_RESSORT = (Y_POUSSOIR + H_POUSSOIR, 240)  # du dessous du poussoir à sa coupelle (cachée par la culasse)

# Poussoir (godet) seul.
vider()
boite('poussoir', -11, 11, AXE - Y_POUSSOIR - H_POUSSOIR, AXE - Y_POUSSOIR, -11, 11, ACIER)
camera((-16, Y_POUSSOIR - 3, 16, Y_POUSSOIR + H_POUSSOIR + 3), AXE)
scene.render.filepath = f'{SORTIE}/poussoir.png'
bpy.ops.render.render(write_still=True)

# Ressort : vraie hélice (6 spires, fil de 1,6), au repos, et la queue de soupape au centre.
vider()
courbe = bpy.data.curves.new('ressort', 'CURVE')
courbe.dimensions = '3D'
courbe.bevel_depth = 1.6
courbe.bevel_resolution = 3
sp = courbe.splines.new('POLY')
spires, pas_ = 6, 96
z0, z1 = AXE - Y_RESSORT[1], AXE - Y_RESSORT[0]
sp.points.add(spires * pas_)
for k in range(spires * pas_ + 1):
    a = 2 * math.pi * k / pas_
    sp.points[k].co = (8.5 * math.cos(a), 8.5 * math.sin(a), z0 + (z1 - z0) * k / (spires * pas_), 1)
o = bpy.data.objects.new('ressort', courbe)
scene.collection.objects.link(o)
o.data.materials.append(RESSORT)
boite('queue', -2.2, 2.2, z0, z1, -2.2, 2.2, ACIER)
camera((-14, Y_RESSORT[0] - 1, 14, Y_RESSORT[1] + 1), AXE)
scene.render.filepath = f'{SORTIE}/ressort.png'
bpy.ops.render.render(write_still=True)

# Tête de soupape (champignon vu de profil, plus grande et plus claire), siège en y = 243.
vider()
TETE = matiere('tête de soupape', (0.72, 0.72, 0.74), 0.18)
z_siege = AXE - 243
boite('queue', -2.4, 2.4, z_siege, z_siege + 14, -2.4, 2.4, TETE)
bpy.ops.mesh.primitive_cone_add(vertices=48, radius1=17, radius2=3.5, depth=6, location=(0, 0, z_siege - 3))
c = bpy.context.object
c.data.materials.append(TETE)
bpy.ops.object.shade_smooth()
camera((-21, 235, 21, 253), AXE)
scene.render.filepath = f'{SORTIE}/tete-soupape.png'
bpy.ops.render.render(write_still=True)
print('FINI', N)
