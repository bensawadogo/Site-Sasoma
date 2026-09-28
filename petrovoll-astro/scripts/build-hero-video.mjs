/**
 * build-hero-video.mjs — séquences d'images du hero vidéo (guide §9), une par format.
 *
 *   ../assets/ai/videos/moteur-v3.mp4   (1344×768, 3 plans enchaînés de 121 images :
 *     C1 l'huile nappe l'arbre à cames, C2 les pistons, C3 le vilebrequin ; moteur en
 *     coupe rigide, caméra fixe ; composée par ops/scripts/composer_huile.py)
 *   Image retournée (miroir) : le goulot du moteur passe en haut à DROITE, côté bidon
 *   (Ben : bidon à droite). Aucun texte dans l'image, le miroir ne trahit rien.
 *     → public/hero-video/desktop/000.webp …   1920×1080 (agrandie : lanczos + netteté)
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
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import sharp from 'sharp'

const ICI = dirname(fileURLToPath(import.meta.url))
const VIDEOS = join(ICI, '..', '..', 'assets', 'ai', 'videos')
const PUBLIC = join(ICI, '..', 'public', 'hero-video')
const MANIFESTE = join(ICI, '..', 'src', 'assets', 'hero', 'video', 'manifest.json')

const VIDEO = join(VIDEOS, 'moteur-v3.mp4')
const SOURCE = { largeur: 1344, hauteur: 768 }
/** Plans enchaînés dans la vidéo (images par plan ; 1re image des plans 2 et 3 déjà retirée). */
const PLANS = [121, 120, 120]

const FORMATS = {
  // Ordinateur : grandes images (1080p), 40 images par plan.
  desktop: { largeur: 1920, hauteur: 1080, parPlan: 40, qualite: 55, recadrage: { x: 0, y: 0, l: 1344, h: 768 }, nettete: true },
  // Téléphone : 24 images par plan (poids ≈ 2 Mo). Recadrage 1100×768 à x = 211 (dans
  // l'image retournée) : moteur entier, orifice à 63 % de la largeur (le bidon basculé
  // tient à sa droite).
  mobile: { largeur: 880, hauteur: 614, parPlan: 24, qualite: 58, recadrage: { x: 211, y: 0, l: 1100, h: 768 } },
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
    version: hash.digest('hex').slice(0, 10),
    octets,
  }
  console.log(`${nom} : ${index} images, ${(octets / 1024 / 1024).toFixed(2)} Mo`)
}
rmSync(brut, { recursive: true, force: true })
mkdirSync(dirname(MANIFESTE), { recursive: true })
writeFileSync(MANIFESTE, `${JSON.stringify(manifeste, null, 2)}\n`)
console.log('manifeste :', MANIFESTE)
