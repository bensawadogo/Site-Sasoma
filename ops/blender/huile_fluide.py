"""huile_fluide.py — vraie simulation de l'huile (Mantaflow) pour le hero, Blender 5.2.

  Avec l'interface (on regarde le calcul avancer) :
    blender --python ops/blender/huile_fluide.py -- DOSSIER [RES_CARTER=200] [RES_VERSEMENT=110]
  Sans interface (essai ou rendu) :
    blender -b --python ops/blender/huile_fluide.py -- DOSSIER [RES_CARTER] [RES_VERSEMENT] [cuire] [rendre]

Coordonnées du SITE (image K1 retournée en miroir, comme pieces.json) : la photo de fond et
la lumière sont donc retournées aussi (la clé de K1, en haut à gauche, passe en haut à droite).
Échelle réelle : 1 pixel de K1 = 1 mm (le bloc fait ~55 cm, comme un vrai 4 cylindres), donc
gravité, viscosité et éclaboussures sont celles d'une vraie huile. Repère : X = x·S,
Z = (768 − y)·S, Y = profondeur (la caméra regarde vers +Y), orthographique sur toute l'image K1.

Deux domaines de liquide, rendus séparément en images RGBA recadrées :
  versement — le filet sous le goulot (x 907, y 118 → 206) qui s'écrase sur la culasse et
              file vers la droite (retour derrière la chaîne) ;
  carter    — la nappe qui se remplit (niveau 642 → 604), puis, moteur en marche, les gouttes
              qui retombent des pistons et du vilebrequin et font onduler la surface.
La photo K1 nettoyée est posée derrière, invisible pour la caméra mais vue par la réfraction :
l'huile transparente montre le moteur déformé derrière elle, comme dans la réalité.
"""
import math
import os
import random
import sys

import bmesh
import bpy
from mathutils import Vector

args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
DOSSIER = os.path.abspath(args[0] if args else 'assets/ai/v5/fluide')
RES_CARTER = int(args[1]) if len(args) > 1 else 200
RES_VERSEMENT = int(args[2]) if len(args) > 2 else 110
CUIRE = 'cuire' in args
RENDRE = 'rendre' in args
RACINE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FOND = os.path.join(RACINE, 'assets', 'ai', 'v5', 'K1-propre.png')

S = 0.001
L, H = 1344, 768
FPS = 24
# Images de chaque simulation.
VERSE_FIN = 72          # filet continu de 1 à 72 (régime établi dès ~20)
CARTER_FIN = 120        # nappe pleine, moteur en marche (boucle)
# Cadres de rendu (x0, y0, x1, y1) en pixels de K1.
CADRE_VERSE = (872, 100, 946, 236)
CADRE_CARTER = (392, 520, 920, 646)

os.makedirs(DOSSIER, exist_ok=True)
JOURNAL = os.path.join(DOSSIER, 'progres.txt')


def journal(msg):
    print('[huile]', msg, flush=True)
    with open(JOURNAL, 'a', encoding='utf-8') as f:
        f.write(msg + '\n')


def P(x, y, prof=0.0):
    return Vector((x * S, prof, (H - y) * S))


bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.fps = FPS
scene.frame_start = 1
scene.frame_end = CARTER_FIN
scene.gravity = (0, 0, -9.81)
scene.unit_settings.system = 'METRIC'


def objet(nom, remplir, lieu):
    """Objet maillé construit par bmesh (sans opérateur : marche aussi au lancement de
    l'interface, quand le contexte n'a pas encore d'objet actif)."""
    me = bpy.data.meshes.new(nom)
    bm = bmesh.new()
    remplir(bm)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(nom, me)
    o.location = lieu
    scene.collection.objects.link(o)
    return o


def boite(nom, x0, y0, x1, y1, p0, p1):
    """Pavé aligné couvrant [x0, x1] × [y0, y1] pixels et [p0, p1] m de profondeur."""
    def remplir(bm):
        bmesh.ops.create_cube(bm, size=1)
        bmesh.ops.scale(bm, vec=(abs(x1 - x0) * S, abs(p1 - p0), abs(y1 - y0) * S), verts=bm.verts)
    return objet(nom, remplir, ((x0 + x1) / 2 * S, (p0 + p1) / 2, (H - (y0 + y1) / 2) * S))


def cylindre(nom, rayon, hauteur, lieu):
    return objet(nom, lambda bm: bmesh.ops.create_cone(bm, cap_ends=True, segments=24, radius1=rayon,
                                                        radius2=rayon, depth=hauteur), lieu)


def sphere(nom, rayon, lieu):
    return objet(nom, lambda bm: bmesh.ops.create_uvsphere(bm, u_segments=12, v_segments=8, radius=rayon), lieu)


def domaine(nom, cadre_sim, p, res, fin, ouverts, cache):
    x0, y0, x1, y1 = cadre_sim
    o = boite(nom, x0, y0, x1, y1, -p, p)
    m = o.modifiers.new('Fluide', 'FLUID')
    m.fluid_type = 'DOMAIN'
    d = m.domain_settings
    d.domain_type = 'LIQUID'
    d.resolution_max = res
    d.cache_directory = cache
    d.cache_type = 'ALL'
    d.cache_frame_start = 1
    d.cache_frame_end = fin
    d.use_mesh = True
    d.mesh_scale = 2
    d.mesh_smoothen_pos = 2
    d.mesh_smoothen_neg = 1
    d.mesh_particle_radius = 1.6
    d.use_adaptive_timesteps = True
    d.timesteps_max = 8
    d.cfl_condition = 3.0
    # Huile chaude (~1e-4 m²/s) : à cette échelle elle s'étale presque comme de l'eau ; le
    # solveur de viscosité de Mantaflow la figeait en gelée (essai du 02/10), on amortit
    # plutôt le FLIP (moins de giclures que l'eau) avec une légère tension de surface.
    d.flip_ratio = 0.9
    d.use_viscosity = False
    d.surface_tension = 0.02
    for bord in ('front', 'back', 'left', 'right', 'top', 'bottom'):
        setattr(d, 'use_collision_border_' + bord, bord not in ouverts)
    return o


def source(nom, o, vitesse, actif=None):
    """Fait de l'objet o une arrivée d'huile ; actif = [(image, allumé)] pour l'animer."""
    o.name = nom
    m = o.modifiers.new('Fluide', 'FLUID')
    m.fluid_type = 'FLOW'
    f = m.flow_settings
    f.flow_type = 'LIQUID'
    f.flow_behavior = 'INFLOW'
    f.flow_source = 'MESH'
    f.use_initial_velocity = True
    f.velocity_coord = vitesse
    f.subframes = 2
    if actif:
        for image, on in actif:
            f.use_inflow = on
            f.keyframe_insert('use_inflow', frame=image)
        # Marches nettes, pas d'interpolation.
        ad = o.animation_data
        if ad and ad.action:
            for fc in getattr(ad.action, 'fcurves', []):
                for k in fc.keyframe_points:
                    k.interpolation = 'CONSTANT'
    o.hide_render = True
    o.display_type = 'WIRE'
    return o


def obstacle(nom, o):
    o.name = nom
    m = o.modifiers.new('Fluide', 'FLUID')
    m.fluid_type = 'EFFECTOR'
    m.effector_settings.effector_type = 'COLLISION'
    o.hide_render = True
    o.display_type = 'WIRE'
    return o


# ── Matière : huile moteur neuve, ambre transparente, très brillante ──
huile = bpy.data.materials.new('huile moteur')
huile.use_nodes = True
nt = huile.node_tree
huile.diffuse_color = (0.75, 0.38, 0.05, 1)
pb = nt.nodes['Principled BSDF']
pb.inputs['Base Color'].default_value = (1.0, 0.55, 0.12, 1)
pb.inputs['Roughness'].default_value = 0.04
pb.inputs['IOR'].default_value = 1.47
pb.inputs['Transmission Weight'].default_value = 1.0
pb.inputs['Coat Weight'].default_value = 0.3
ab = nt.nodes.new('ShaderNodeVolumeAbsorption')
ab.inputs['Color'].default_value = (0.85, 0.40, 0.04, 1)
ab.inputs['Density'].default_value = 300.0
nt.links.new(ab.outputs['Volume'], nt.nodes['Material Output'].inputs['Volume'])

# ── Domaine 1 : le filet sous le goulot ──
dv = domaine('Huile versement', (866, 96, 950, 240), 0.022, RES_VERSEMENT, VERSE_FIN,
             ('top', 'right'), os.path.join(DOSSIER, 'cache-versement'))
dv.data.materials.append(huile)
source('Bec du bidon', cylindre('Bec du bidon', 4.2 * S, 6 * S, P(907, 104)), (0.0, 0.0, -1.1))
# Culasse sous le goulot : surface penchée vers la chaîne (à droite), l'huile y file sans
# former de flaque.
o = boite('Culasse (choc)', 888, 206, 972, 216, -0.03, 0.03)
o.rotation_euler = (0, math.radians(12), 0)
obstacle('Culasse (choc)', o)

# ── Domaine 2 : le carter ──
dc = domaine('Huile carter', (396, 524, 916, 642), 0.04, RES_CARTER, CARTER_FIN,
             ('top',), os.path.join(DOSSIER, 'cache-carter'))
dc.data.materials.append(huile)
# Nappe déjà pleine (niveau 604) : le débit d'une arrivée Mantaflow dépend de ses sous-pas
# de temps (essai du 02/10 : carter noyé en 10 images), on ne peut pas le régler. Le site
# fait monter cette nappe dans les cavités pendant le remplissage.
o = boite('Huile initiale', 397, 604, 915, 641, -0.039, 0.039)
source('Huile initiale', o, (0, 0, 0)).modifiers['Fluide'].flow_settings.flow_behavior = 'GEOMETRY'
# Retour d'huile derrière la chaîne : un petit filet continu le long de la paroi droite.
o = boite('Retour chaîne', 901, 527, 907, 533, -0.004, 0.004)
source('Retour chaîne', o, (-0.05, 0.0, -0.6))
# Trop-plein invisible (à gauche, loin de l'arrivée) : le niveau ne dépasse pas le plein (604)
# quelle que soit la résolution (le débit d'une arrivée Mantaflow en dépend).
o = boite('Trop-plein', 398, 598, 422, 604, -0.038, 0.038)
source('Trop-plein', o, (0, 0, 0)).modifiers['Fluide'].flow_settings.flow_behavior = 'OUTFLOW'
# Moteur en marche : gouttes qui retombent sous les jupes et du vilebrequin.
random.seed(7)
for i, x in enumerate((452, 505, 590, 650, 728, 790, 868, 470, 700, 840)):
    goutte = sphere(f'Goutte {i + 1}', 3.6 * S, P(x, 530, random.uniform(-0.02, 0.02)))
    cles = [(1, False)]
    t = 4 + random.randint(0, 12)
    while t < CARTER_FIN - 2:
        cles += [(t, True), (t + 1, False)]
        t += random.randint(8, 16)
    source(f'Goutte {i + 1}', goutte,
           (random.uniform(-0.15, 0.15), 0.0, -1.5), cles)

# ── Photo du moteur derrière (vue par la réfraction, pas par la caméra) ──
fond = objet('Photo K1 (fond)', lambda bm: bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=0.5),
             (L / 2 * S, 0.09, H / 2 * S))
fond.rotation_euler = (math.pi / 2, 0, 0)
me = fond.data
uv = me.uv_layers.new()
for boucle in me.loops:
    co = me.vertices[boucle.vertex_index].co
    uv.data[boucle.index].uv = (co.x + 0.5, co.y + 0.5)
fond.scale = (-L * S, H * S, 1)  # miroir : repère du site
mf = bpy.data.materials.new('photo K1')
mf.use_nodes = True
n2 = mf.node_tree
n2.nodes.remove(n2.nodes['Principled BSDF'])
tex = n2.nodes.new('ShaderNodeTexImage')
tex.image = bpy.data.images.load(FOND)
em = n2.nodes.new('ShaderNodeEmission')
n2.links.new(tex.outputs['Color'], em.inputs['Color'])
n2.links.new(em.outputs['Emission'], n2.nodes['Material Output'].inputs['Surface'])
fond.data.materials.append(mf)
fond.visible_camera = False
fond.visible_shadow = False

# ── Lumière : clé en haut à droite (K1 retournée), boîte à lumière pour les reflets ──
def lampe(nom, lieu):
    o = bpy.data.objects.new(nom, bpy.data.lights.new(nom, 'AREA'))
    o.location = lieu
    scene.collection.objects.link(o)
    return o


cle = lampe('Clé', ((L - 150) * S, -0.35, (H + 250) * S))
cle.data.energy = 60
cle.data.size = 0.5
cle.rotation_euler = (math.radians(55), 0, math.radians(35))
contre = lampe('Contre', (L * 0.25 * S, -0.5, (H - 300) * S))
contre.data.energy = 18
contre.data.size = 0.8
contre.rotation_euler = (math.radians(90), 0, 0)
world = bpy.data.worlds.new('atelier')
world.use_nodes = True
world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.05, 0.04, 0.035, 1)
scene.world = world

# ── Caméra orthographique sur toute l'image K1 ──
cam = bpy.data.objects.new('Caméra', bpy.data.cameras.new('Caméra'))
cam.location = (L / 2 * S, -1.0, H / 2 * S)
cam.rotation_euler = (math.pi / 2, 0, 0)
scene.collection.objects.link(cam)
cam.data.type = 'ORTHO'
cam.data.ortho_scale = L * S
cam.data.clip_end = 3
scene.camera = cam
r = scene.render
r.engine = 'CYCLES'
r.resolution_x, r.resolution_y = L, H
r.film_transparent = True
r.image_settings.file_format = 'PNG'
r.image_settings.color_mode = 'RGBA'
scene.cycles.device = 'CPU'
scene.cycles.samples = 96
scene.cycles.use_denoising = True
scene.cycles.max_bounces = 16
scene.cycles.transmission_bounces = 16
scene.cycles.transparent_max_bounces = 16
scene.view_settings.view_transform = 'AgX'
scene.view_settings.look = 'AgX - Medium High Contrast'

FICHIER = os.path.join(DOSSIER, 'huile.blend')


def fini(d):
    dossier = os.path.join(bpy.path.abspath(d.cache_directory), 'mesh')
    fin = d.cache_frame_end
    return os.path.isdir(dossier) and any(f'{fin:04d}' in n for n in os.listdir(dossier))


def compte(d, quoi='mesh'):
    dossier = os.path.join(bpy.path.abspath(d.cache_directory), quoi)
    return len(os.listdir(dossier)) if os.path.isdir(dossier) else 0


def rendre(dom, cadre, debut, fin, sortie):
    for o in (dv, dc):
        o.hide_render = o is not dom
    x0, y0, x1, y1 = cadre
    r.use_border = True
    r.use_crop_to_border = True
    r.border_min_x, r.border_max_x = x0 / L, x1 / L
    r.border_min_y, r.border_max_y = 1 - y1 / H, 1 - y0 / H
    scene.frame_start, scene.frame_end = debut, fin
    os.makedirs(sortie, exist_ok=True)
    r.filepath = sortie + os.sep
    bpy.ops.render.render(animation=True)


if bpy.app.background:
    bpy.ops.wm.save_as_mainfile(filepath=FICHIER)
    if CUIRE:
        for d in ((dc,) if 'carter' in args else (dv, dc)):
            with bpy.context.temp_override(object=d, active_object=d):
                journal(f'cuisson {d.name}…')
                bpy.ops.fluid.bake_all()
        bpy.ops.wm.save_as_mainfile(filepath=FICHIER)
        # Niveau de la nappe à chaque image (le site choisit l'image du niveau voulu) : point
        # le plus haut du liquide au milieu du carter, sous y 590 (hors gouttes en vol).
        niveaux = {}
        for f in range(1, CARTER_FIN + 1):
            scene.frame_set(f)
            e = dc.evaluated_get(bpy.context.evaluated_depsgraph_get())
            m = e.to_mesh()
            ys = [H - (dc.matrix_world @ v.co).z / S for v in m.vertices]
            xs = [(dc.matrix_world @ v.co).x / S for v in m.vertices]
            dedans = [y for x, y in zip(xs, ys) if 480 < x < 820 and y > 590]
            niveaux[f] = round(min(dedans), 1) if dedans else 642
            e.to_mesh_clear()
        import json
        json.dump(niveaux, open(os.path.join(DOSSIER, 'niveaux.json'), 'w'))
        journal('niveaux : ' + ' '.join(f'{f}:{niveaux[f]:.0f}' for f in range(10, CARTER_FIN + 1, 10)))
    if RENDRE:
        if 'carter' not in args:
            rendre(dv, CADRE_VERSE, 1, VERSE_FIN, os.path.join(DOSSIER, 'rendu', 'versement'))
        rendre(dc, CADRE_CARTER, 1, CARTER_FIN, os.path.join(DOSSIER, 'rendu', 'carter'))
        journal('RENDU FINI')
else:
    # Interface = écran de suivi. Pendant une cuisson, Blender verrouille sa fenêtre (vue noire,
    # seule la barre de progression bouge) : la cuisson tourne donc dans un Blender sans
    # interface (même script, option « cuire »), et cette fenêtre relit le cache au fur et à
    # mesure — on voit l'huile apparaître image par image sur la photo du moteur.
    open(JOURNAL, 'a').close()
    os.makedirs(os.path.join(DOSSIER, 'cache-versement', 'mesh'), exist_ok=True)

    def regler_vue():
        fen = bpy.context.window_manager.windows[0]
        for zone in fen.screen.areas:
            if zone.type == 'VIEW_3D':
                esp = zone.spaces.active
                esp.region_3d.view_perspective = 'CAMERA'
                esp.shading.type = 'SOLID'
                esp.shading.color_type = 'TEXTURE'
                esp.shading.light = 'FLAT'
                esp.overlay.show_floor = False
                esp.overlay.show_axis_x = esp.overlay.show_axis_y = False
                with bpy.context.temp_override(window=fen, area=zone,
                                               region=[g for g in zone.regions if g.type == 'WINDOW'][0]):
                    bpy.ops.view3d.view_center_camera()
        for o in (dv, dc):
            for ps in o.particle_systems:
                ps.settings.display_method = 'NONE'  # pas les billes de couleur du FLIP
        fond.visible_camera = True  # simple écran de suivi, sans rendu
        return None

    def suivre():
        # Avance la vue jusqu'à la dernière image maillée (moins une : elle peut être en écriture).
        faits = [compte(o.modifiers['Fluide'].domain_settings) for o in (dv, dc)]
        # Un domaine pas encore cuit s'affiche comme un bloc plein : caché jusqu'à ses images.
        for o, n in zip((dv, dc), faits):
            o.hide_viewport = n < 2
        cible = max(1, max(faits) - 1)
        if scene.frame_current != cible:
            scene.frame_set(cible)
        return 2.0

    def telecommande():
        # Pilotage à distance : DOSSIER/commande.py est exécuté dans la fenêtre puis effacé
        # (régler la vue, capturer l'écran… sans toucher à la cuisson en cours).
        c = os.path.join(DOSSIER, 'commande.py')
        if os.path.exists(c):
            code = open(c, encoding='utf-8').read()
            os.remove(c)
            fen = bpy.context.window_manager.windows[0]
            zone = [z for z in fen.screen.areas if z.type == 'VIEW_3D'][0]
            try:
                with bpy.context.temp_override(window=fen, area=zone,
                                               region=[g for g in zone.regions if g.type == 'WINDOW'][0]):
                    exec(code, {'bpy': bpy, 'zone': zone, 'fen': fen, 'DOSSIER': DOSSIER})
                journal('commande exécutée')
            except Exception as e:  # noqa: BLE001
                journal(f'commande en erreur : {e!r}')
        return 1.0

    bpy.app.timers.register(telecommande, first_interval=1.0, persistent=True)
    bpy.app.timers.register(regler_vue, first_interval=1.5)
    bpy.app.timers.register(suivre, first_interval=3.0, persistent=True)
