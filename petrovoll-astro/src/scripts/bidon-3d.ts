/**
 * bidon-3d.ts — rendu Three.js du bidon, chargé À LA DEMANDE par BidonScene.
 *
 * Ce module n'est jamais dans le bundle initial : BidonScene l'importe avec
 * `import()` une fois la page chargée. three.js (~150 Ko gzip) ne coûte donc
 * rien au premier affichage — l'image WebP du bidon occupe la place.
 *
 * Le cadrage (caméra, échelle, angle de repos, éclairage) est IDENTIQUE à celui
 * qui a servi à générer src/assets/bidon/bidon-800.webp : le fondu image → 3D se fait
 * sans aucun saut visible. Toute modification ici doit être répercutée sur
 * l'image (rendre une frame à t=0 et l'exporter en WebP transparent).
 */
import {
  CanvasTexture,
  DirectionalLight,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  NeutralToneMapping,
  PMREMGenerator,
  PerspectiveCamera,
  PlaneGeometry,
  SRGBColorSpace,
  Scene,
  Vector3,
  Box3,
  WebGLRenderer,
} from 'three'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

// `?url` : Vite copie le modèle avec une empreinte dans le nom de fichier
// (pas de cache périmé après une mise à jour du bidon).
import urlBidon from '@/assets/bidon/bidon.glb?url'
import urlBidonLite from '@/assets/bidon/bidon-lite.glb?url'

export type Qualite = 'lite' | 'full'

const MODELES: Record<Qualite, string> = {
  lite: urlBidonLite, // ~161k triangles, couleur 2048 / relief 1024 px, 1,0 Mo — smartphones
  full: urlBidon, //     ~269k triangles, couleur + relief 2048 px, 1,5 Mo — ordinateurs
}

/** Angle de départ (trois-quarts) : identique à l'image d'attente. */
const ANGLE_REPOS = -0.35
/** Rotation automatique : un tour complet toutes les 14 s. */
const VITESSE_ROTATION = (2 * Math.PI) / 14
/** Après un glisser au doigt, la rotation automatique reprend au bout de 1,5 s. */
const PAUSE_APRES_GLISSER = 1500
const Y_REPOS = 0.1
/** Couleur du plastique du bidon (albédo linéaire, mesurée sur la texture du scan). */
const GRIS_PLASTIQUE = '0.216, 0.227, 0.235'
/**
 * Contour de l'étiquette fantôme au dos, dans le plan (x, y) du modèle, sens
 * trigonométrique, marge de 2 cm incluse. Calculé sur le scan original :
 * enveloppe convexe des points de la face arrière qui ont la couleur de
 * l'étiquette, simplifiée à 8 sommets (forme « maison », pointe vers la poignée).
 */
const CONTOUR_ETIQUETTE_DOS: ReadonlyArray<[number, number]> = [
  [-0.543, -0.684], [-0.316, -0.761], [0.233, -0.829], [0.314, 0.005],
  [0.189, 0.186], [-0.095, 0.41], [-0.388, 0.098], [-0.526, -0.46],
]

/**
 * Monte la scène dans `hote`. Rejette si WebGL ou le modèle échoue.
 * `surProgression` reçoit l'avancement du téléchargement du modèle (0 → 1).
 */
export async function monterBidon(
  hote: HTMLElement,
  qualite: Qualite,
  surProgression?: (fraction: number) => void,
): Promise<void> {
  const canvas = hote.querySelector<HTMLCanvasElement>('canvas')
  if (!canvas) throw new Error('bidon-3d : canvas absent')

  const lite = qualite === 'lite'
  const renderer = new WebGLRenderer({
    canvas,
    alpha: true,
    // Les GPU mobiles (Mali, PowerVR) sont à tuiles : le MSAA y est quasi
    // gratuit, et c'est lui qui évite l'escalier sur les bords du bidon.
    antialias: true,
    powerPreference: lite ? 'default' : 'high-performance',
  })
  // 1,5 suffit sur un écran 720p et divise presque par deux le coût par
  // rapport à un DPR de 2-3 ; peut encore baisser si le téléphone rame.
  let dprMax = lite ? 1.5 : 2
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, dprMax))
  renderer.outputColorSpace = SRGBColorSpace
  // Neutral (Khronos PBR Neutral) : conçu pour le rendu produit, il garde les
  // couleurs de l'étiquette fidèles là où ACES les délave.
  renderer.toneMapping = NeutralToneMapping
  renderer.toneMappingExposure = 0.95

  const scene = new Scene()
  const camera = new PerspectiveCamera(35, 1, 0.1, 100)
  camera.position.set(0, 0.4, 4.2)
  camera.lookAt(0, 0, 0)

  // Éclairage studio généré en mémoire (aucun fichier HDR à télécharger) :
  // donne au plastique ses reflets doux.
  const pmrem = new PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  scene.environmentIntensity = 0.55
  pmrem.dispose()

  const cle = new DirectionalLight(0xffffff, 1.6)
  cle.position.set(2.5, 4, 4)
  scene.add(cle)
  // Contre-jour chaud : détache le bidon du fond sombre du hero.
  const contour = new DirectionalLight(0xffb060, 1.6)
  contour.position.set(-3, 2.5, -3.5)
  scene.add(contour)

  const ombre = creerOmbre()
  scene.add(ombre)

  const draco = new DRACOLoader()
  draco.setDecoderPath('/draco/')
  const loader = new GLTFLoader()
  loader.setDRACOLoader(draco)

  let gltf
  try {
    gltf = await loader.loadAsync(MODELES[qualite], (e) => {
      if (e.total) surProgression?.(e.loaded / e.total)
    })
  } finally {
    draco.dispose() // libère le worker de décodage dès que le modèle est prêt
  }

  const modele = gltf.scene
  const boite = new Box3().setFromObject(modele)
  modele.position.sub(boite.getCenter(new Vector3()))
  const taille = boite.getSize(new Vector3())
  const pivot = new Group()
  pivot.add(modele)
  pivot.scale.setScalar(2.0 / Math.max(taille.x, taille.y, taille.z))
  pivot.rotation.y = ANGLE_REPOS
  pivot.position.y = Y_REPOS
  scene.add(pivot)

  const anisotropie = Math.min(lite ? 2 : 4, renderer.capabilities.getMaxAnisotropy())
  modele.traverse((objet) => {
    if (!(objet instanceof Mesh) || !(objet.material instanceof MeshStandardMaterial)) return
    // Étiquette plus nette quand le bidon tourne (texture vue de biais).
    if (objet.material.map) objet.material.map.anisotropy = anisotropie
    neutraliserDosEtiquette(objet.material)
  })

  /* ── Taille : suit la boîte du hero ─────────────────────────────────── */
  const redimensionner = () => {
    const l = hote.clientWidth
    const h = hote.clientHeight
    if (!l || !h) return
    renderer.setSize(l, h, false)
    camera.aspect = l / h
    camera.updateProjectionMatrix()
  }
  redimensionner()
  new ResizeObserver(redimensionner).observe(hote)

  /* ── Glisser au doigt / à la souris (horizontal uniquement) ─────────── */
  const mouvementReduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  let angleAuto = 0 // rotation automatique accumulée
  let decalage = 0 // rotation ajoutée au doigt
  let decalageCible = 0
  let glisse = false
  let dernierX = 0
  let derniereInteraction = -Infinity

  canvas.addEventListener('pointerdown', (e) => {
    glisse = true
    dernierX = e.clientX
    canvas.setPointerCapture(e.pointerId)
  })
  canvas.addEventListener('pointermove', (e) => {
    if (!glisse) return
    decalageCible += (e.clientX - dernierX) * 0.01
    dernierX = e.clientX
    derniereInteraction = performance.now()
  })
  const relacher = () => {
    glisse = false
    derniereInteraction = performance.now()
  }
  canvas.addEventListener('pointerup', relacher)
  canvas.addEventListener('pointercancel', relacher)

  /* ── Boucle : ne tourne que si le bidon est visible ─────────────────── */
  // 30 i/s sur mobile : la rotation est lente, la différence ne se voit
  // pas, mais le téléphone chauffe et vide sa batterie deux fois moins vite.
  const intervalle = lite ? 1000 / 30 : 0
  let rafId = 0
  let visible = true
  let dernierRendu = 0
  const debut = performance.now()

  // Qualité adaptative : si les premières images sont trop lentes, on baisse
  // la résolution du canvas (le téléphone le plus faible reste fluide).
  let echantillons = 0
  let tempsCumule = 0

  const frame = (maintenant: number) => {
    rafId = requestAnimationFrame(frame)
    if (maintenant - dernierRendu < intervalle) return
    const ecart = maintenant - dernierRendu
    dernierRendu = maintenant

    const t = (maintenant - debut) / 1000
    // Pas de temps plafonné : après une pause (onglet masqué), pas de saut.
    const dt = Math.min(ecart, 100) / 1000
    // Rotation TOUJOURS active (demande du client), même avec « Supprimer les
    // animations » : elle est lente, et le glisser au doigt permet de l'arrêter.
    if (!glisse && maintenant - derniereInteraction > PAUSE_APRES_GLISSER) {
      angleAuto += dt * VITESSE_ROTATION
    }
    decalage += (decalageCible - decalage) * 0.12
    pivot.rotation.y = ANGLE_REPOS + angleAuto + decalage
    if (!mouvementReduit) {
      const flottement = Math.sin(t * 1.3) * 0.035
      pivot.position.y = Y_REPOS + flottement
      // L'ombre se resserre quand le bidon monte : renforce l'effet de lévitation.
      ombre.scale.setScalar(1 - flottement * 2)
    }
    renderer.render(scene, camera)

    if (echantillons < 45 && ecart < 500) {
      echantillons++
      tempsCumule += ecart
      if (echantillons === 45 && tempsCumule / 45 > 45 && dprMax > 1) {
        dprMax = 1
        renderer.setPixelRatio(1)
        redimensionner()
      }
    }
  }

  const demarrer = () => {
    if (!rafId && visible && !document.hidden) rafId = requestAnimationFrame(frame)
  }
  const arreter = () => {
    cancelAnimationFrame(rafId)
    rafId = 0
  }

  new IntersectionObserver(
    ([entree]) => {
      visible = entree.isIntersecting
      if (visible) demarrer()
      else arreter()
    },
    { threshold: 0.05 },
  ).observe(hote)
  document.addEventListener('visibilitychange', () => (document.hidden ? arreter() : demarrer()))

  // Contexte GPU perdu (fréquent sur les téléphones à 1-2 Go de RAM quand
  // l'utilisateur change d'appli) : on rend la main à l'image fixe.
  canvas.addEventListener('webglcontextlost', () => {
    arreter()
    hote.dataset.etat = 'image'
  })

  renderer.render(scene, camera) // 1re image prête AVANT le fondu
  demarrer()
}

/**
 * Le scan Meshy a recopié l'étiquette EN MIROIR sur le dos du bidon (texte
 * « KRÄTS » à l'envers, visible pendant la rotation). Sur les faces tournées
 * vers l'arrière, tout ce qui n'a pas la couleur du plastique reçoit le gris
 * du bidon, et le relief gravé de l'étiquette fantôme est ignoré : le dos
 * devient un plastique uni, comme un vrai bidon.
 * Repère du modèle : l'avant regarde vers +z, le bouchon est au-dessus de
 * y = 0,55 ; l'étiquette fantôme est dans CONTOUR_ETIQUETTE_DOS, z < -0,2.
 */
function neutraliserDosEtiquette(materiau: MeshStandardMaterial): void {
  materiau.onBeforeCompile = (shader) => {
    const varyings = `
      varying vec3 vPositionObjet;
      varying vec3 vNormaleObjet;
      varying vec3 vNormaleArriereVue;`
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>${varyings}`)
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        vPositionObjet = position;
        vNormaleObjet = normal;
        vNormaleArriereVue = normalize(normalMatrix * vec3(0.0, 0.0, -1.0));`,
      )
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>${varyings}
        const vec2 CONTOUR[${CONTOUR_ETIQUETTE_DOS.length}] = vec2[](
          ${CONTOUR_ETIQUETTE_DOS.map(([x, y]) => `vec2(${x}, ${y})`).join(', ')}
        );
        // Polygone convexe parcouru dans le sens trigo : le point est dedans
        // s'il est à gauche de chaque arête.
        bool dansEtiquetteDos(vec2 p) {
          for (int i = 0; i < ${CONTOUR_ETIQUETTE_DOS.length}; i++) {
            vec2 a = CONTOUR[i];
            vec2 b = CONTOUR[(i + 1) % ${CONTOUR_ETIQUETTE_DOS.length}];
            if ((b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x) < 0.0) return false;
          }
          return true;
        }`,
      )
      .replace(
        'void main() {',
        `void main() {
        bool dosEtiquette = false;`,
      )
      .replace(
        '#include <map_fragment>',
        `#include <map_fragment>
        float saturation = max(max(diffuseColor.r, diffuseColor.g), diffuseColor.b)
          - min(min(diffuseColor.r, diffuseColor.g), diffuseColor.b);
        float luminance = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
        // Dans le contour de l'étiquette fantôme (face arrière) : tout devient
        // plastique lisse, couleur ET relief — le texte est aussi gravé dans la
        // forme. La poignée est hors du contour : elle n'est pas touchée.
        if (vPositionObjet.z < -0.2 && dansEtiquetteDos(vPositionObjet.xy)) {
          diffuseColor.rgb = vec3(${GRIS_PLASTIQUE});
          dosEtiquette = vNormaleObjet.z < 0.0;
        } else if (vNormaleObjet.z < 0.0 && vPositionObjet.y < 0.55
            && (saturation > 0.06 || luminance > 0.5)) {
          // Reste du dos et côtés : seules les taches colorées ou blanches sont
          // effacées. Les zones sombres sont des ombres peintes par le scan
          // (creux de la poignée) : les éclaircir ferait des plaques claires.
          diffuseColor.rgb = vec3(${GRIS_PLASTIQUE});
        }`,
      )
      .replace(
        '#include <normal_fragment_maps>',
        `if (dosEtiquette) {
          normal = normalize(vNormaleArriereVue);
        } else {
        #include <normal_fragment_maps>
        }`,
      )
  }
  materiau.needsUpdate = true
}

/** Ombre de contact : dégradé peint dans un canvas 128 px (aucun fichier). */
function creerOmbre(): Mesh {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const ctx = c.getContext('2d')
  if (ctx) {
    const degrade = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
    degrade.addColorStop(0, 'rgba(0,0,0,0.55)')
    degrade.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = degrade
    ctx.fillRect(0, 0, 128, 128)
  }
  const ombre = new Mesh(
    new PlaneGeometry(2.2, 1.2),
    new MeshBasicMaterial({
      map: new CanvasTexture(c),
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    }),
  )
  ombre.rotation.x = -Math.PI / 2
  ombre.position.y = -1.18
  return ombre
}
