/**
 * build-hero-video.mjs — séquences d'images du hero vidéo (guide §9), une par format.
 *
 *   ../assets/ai/videos/moteur-v3.mp4   (1344×768, 3 plans enchaînés de 121 images :
 *     C1 l'huile nappe l'arbre à cames, C2 les pistons, C3 le vilebrequin ; moteur en
 *     coupe rigide, pistons en mouvement ; calculée par ops/scripts/animer_moteur.py)
 *   Images retournées (miroir) : le goulot du moteur passe en haut à DROITE, côté bidon
 *   (le bidon verse depuis la droite, goulot devant). Aucun texte dans l'image.
 *     → public/hero-video/desktop/000.webp …   1344×768 (définition native)
 *     → public/hero-video/mobile/000.webp …    880×614 : moteur entier, découpé dans la
 *       MÊME vidéo, décalé pour laisser l'orifice loin du bord gauche (place du bidon)
 *     → src/assets/hero/video/manifest.json    nombre d'images, tailles, recadrage, version
 *
 * Les vidéos brutes ne sont pas commitées (journal : ops/credits.md) ; les images le sont.
 * Nombre d'images choisi pour la course de scroll de chaque format (docs/hero.md).
 *
 * USAGE : npm run hero:video
 */
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import sharp from 'sharp'

const ICI = dirname(fileURLToPath(import.meta.url))
const VIDEOS = join(ICI, '..', '..', 'assets', 'ai', 'videos')
const PUBLIC = join(ICI, '..', 'public', 'hero-video')
const MANIFESTE = join(ICI, '..', 'src', 'assets', 'hero', 'video', 'manifest.json')

const VIDEO = join(VIDEOS, 'moteur-v3.mp4')
/** Moteur complet, pour l'affiche. */
const AFFICHE = existsSync(join(ICI, '..', '..', 'assets', 'ai', 'v5', 'affiche-decor.png'))
  ? join(ICI, '..', '..', 'assets', 'ai', 'v5', 'affiche-decor.png') // dans le garage (moteur_v5.py --fond)
  : join(ICI, '..', '..', 'assets', 'ai', 'v3', 'K1.png')
/**
 * Décor « garage » plein écran (ops/blender/decor.py CHAMP = 2, repère du site) : même
 * caméra et même échelle que la vidéo, champ deux fois plus large et plus haut (la vidéo en
 * occupe le centre). Le site le pose derrière l'image du moteur, découpée par le masque
 * (rembg, repère de K1) : seul le moteur vibre quand il tourne, pas le garage.
 */
const DECOR = process.env.HERO_DECOR ?? join(ICI, '..', '..', 'assets', 'ai', 'decor', 'rendu') // HERO_DECOR : essais
const MASQUE = join(ICI, '..', '..', 'assets', 'ai', 'v5', 'masque-moteur-site.png') // ops/scripts/masque_site.py
const AVEC_DECOR = ['penombre', 'allume'].every((e) => existsSync(join(DECOR, `champ-${e}.png`))) && existsSync(MASQUE)
const SOURCE = { largeur: 1344, hauteur: 768 }
/** Plans enchaînés dans la vidéo (images par plan ; 1re image des plans 2 et 3 déjà retirée). */
const PLANS = [121, 120, 120]

const FORMATS = {
  // Ordinateur : définition native de la source (1344×768) ; l'agrandir n'ajoutait aucun
  // détail, seulement du poids : le canvas met à l'échelle. 32 images par plan (pistons :
  // moins de 30° de vilebrequin par image).
  // Décor : pleine définition de la vidéo (decor.py à 100 %, 2688×1536 : 1080p réel à l'écran).
  desktop: { largeur: 1344, hauteur: 768, parPlan: 32, qualite: 60, recadrage: { x: 0, y: 0, l: 1344, h: 768 }, decor: 1 },
  // Téléphone : 24 images par plan (poids ≈ 2 Mo). Recadrage 1100×768 à x = 184 dans
  // l'image retournée : moteur entier ; son goulot, en haut à droite, reste côté bidon.
  mobile: { largeur: 880, hauteur: 614, parPlan: 24, qualite: 58, recadrage: { x: 184, y: 0, l: 1100, h: 768 }, decor: 0.5 },
}

function nbImages(video) {
  const sortie = execFileSync('ffprobe', ['-v', 'error', '-count_frames', '-select_streams', 'v:0',
    '-show_entries', 'stream=nb_read_frames', '-of', 'csv=p=0', video]).toString().trim()
  return Number(sortie)
}

const total = nbImages(VIDEO)
if (total !== PLANS.reduce((a, b) => a + b)) throw new Error(`${VIDEO} : ${total} images, ${PLANS.join(' + ')} attendues`)

// Toutes les images de la vidéo, une fois ; chaque format y pioche, recadre et redimensionne.
const brut = mkdtempSync(join(tmpdir(), 'hero-video-'))
execFileSync('ffmpeg', ['-v', 'error', '-i', VIDEO, join(brut, '%03d.png')])
const pngs = readdirSync(brut).sort()

const manifeste = {}
for (const [nom, f] of Object.entries(FORMATS)) {
  const dossier = join(PUBLIC, nom)
  rmSync(dossier, { recursive: true, force: true })
  mkdirSync(dossier, { recursive: true })
  const hash = createHash('sha1')
  // Dans chaque plan, images réparties régulièrement, première et dernière comprises.
  const choix = []
  let decalage = 0
  for (const n of PLANS) {
    for (let i = 0; i < f.parPlan; i++) choix.push(decalage + Math.round((i * (n - 1)) / (f.parPlan - 1)))
    decalage += n
  }
  const r = f.recadrage
  for (const [index, n] of choix.entries()) {
    const sortie = join(dossier, `${String(index).padStart(3, '0')}.webp`)
    // Retourner d'abord (tampon), puis recadrer dans l'image retournée.
    const retournee = await sharp(join(brut, pngs[n])).flop().toBuffer()
    let image = sharp(retournee)
      .extract({ left: r.x, top: r.y, width: r.l, height: r.h })
      .resize(f.largeur, f.hauteur, { kernel: 'lanczos3' })
    if (f.nettete) image = image.sharpen({ sigma: 0.8 })
    await image.webp({ quality: f.qualite, effort: 6 }).toFile(sortie)
    hash.update(readFileSync(sortie))
  }
  // Affiche (sans JS, et avant que le canvas prenne le relais) : le moteur COMPLET (K1, avec
  // pistons et bielles), car la séquence ne montre plus que le moteur sans ses pièces mobiles.
  {
    const retournee = await sharp(AFFICHE).flop().toBuffer()
    let image = sharp(retournee).extract({ left: r.x, top: r.y, width: r.l, height: r.h }).resize(f.largeur, f.hauteur, { kernel: 'lanczos3' })
    await image.webp({ quality: f.qualite, effort: 6 }).toFile(join(dossier, 'affiche.webp'))
    hash.update(readFileSync(join(dossier, 'affiche.webp')))
  }
  if (AVEC_DECOR) {
    // Définition de la vidéo pour ce format (pixels de sortie par pixel source), puis réduite.
    const echelle = (f.largeur / r.l) * f.decor
    for (const e of ['penombre', 'allume']) {
      const sortie = join(dossier, `decor-${e}.webp`)
      await sharp(join(DECOR, `champ-${e}.png`))
        .removeAlpha()
        .resize(Math.round(2 * SOURCE.largeur * echelle), Math.round(2 * SOURCE.hauteur * echelle), { kernel: 'lanczos3' })
        .webp({ quality: 62, effort: 6 })
        .toFile(sortie)
      hash.update(readFileSync(sortie))
    }
    // Masque du moteur, cadré comme les images : blanc, opacité = masque.
    const alpha = await sharp(MASQUE)
      .flop()
      .extract({ left: r.x, top: r.y, width: r.l, height: r.h })
      .resize(f.largeur, f.hauteur, { kernel: 'lanczos3' })
      .extractChannel(0)
      .raw()
      .toBuffer()
    await sharp({ create: { width: f.largeur, height: f.hauteur, channels: 3, background: '#fff' } })
      .joinChannel(alpha, { raw: { width: f.largeur, height: f.hauteur, channels: 1 } })
      .webp({ quality: 90, alphaQuality: 100, effort: 6 })
      .toFile(join(dossier, 'masque.webp'))
    hash.update(readFileSync(join(dossier, 'masque.webp')))
  }
  const index = choix.length
  const octets = readdirSync(dossier).reduce((s, n) => s + statSync(join(dossier, n)).size, 0)
  manifeste[nom] = {
    images: index,
    parPlan: f.parPlan,
    largeur: f.largeur,
    hauteur: f.hauteur,
    // Partie de la vidéo gardée, en fractions : les points du moteur (config) s'y ramènent.
    recadrage: {
      x: +(r.x / SOURCE.largeur).toFixed(4),
      y: +(r.y / SOURCE.hauteur).toFixed(4),
      l: +(r.l / SOURCE.largeur).toFixed(4),
      h: +(r.h / SOURCE.hauteur).toFixed(4),
    },
    decor: AVEC_DECOR,
    version: hash.digest('hex').slice(0, 10),
    octets,
  }
  console.log(`${nom} : ${index} images, ${(octets / 1024 / 1024).toFixed(2)} Mo`)
}
rmSync(brut, { recursive: true, force: true })
mkdirSync(dirname(MANIFESTE), { recursive: true })
writeFileSync(MANIFESTE, `${JSON.stringify(manifeste, null, 2)}\n`)
console.log('manifeste :', MANIFESTE)
