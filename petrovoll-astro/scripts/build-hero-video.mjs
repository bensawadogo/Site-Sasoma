/**
 * build-hero-video.mjs — séquences d'images du hero vidéo (guide §9), une par format.
 *
 *   ../assets/ai/videos/V1-desktop.mp4, V2-desktop.mp4   (2688×1536, agrandies ×2)
 *   ../assets/ai/videos/V1-mobile.mp4,  V2-mobile.mp4    (768×1344)
 *     → public/hero-video/desktop/000.webp …   1920×1080, V1 puis V2
 *     → public/hero-video/mobile/000.webp …    720×1260, V1 puis V2
 *     → src/assets/hero/video/manifest.json    nombre d'images, tailles, version (cache)
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

const FORMATS = {
  // Ordinateur : grandes images (1080p), 48 images par vidéo.
  desktop: { largeur: 1920, hauteur: 1080, parVideo: 48, qualite: 62 },
  // Téléphone : 720 px de large (net jusqu'en DPR 2), 32 images par vidéo pour rester léger.
  mobile: { largeur: 720, hauteur: 1260, parVideo: 32, qualite: 58 },
}

function nbImages(video) {
  const sortie = execFileSync('ffprobe', ['-v', 'error', '-count_frames', '-select_streams', 'v:0',
    '-show_entries', 'stream=nb_read_frames', '-of', 'csv=p=0', video]).toString().trim()
  return Number(sortie)
}

const manifeste = {}
for (const [nom, f] of Object.entries(FORMATS)) {
  const dossier = join(PUBLIC, nom)
  rmSync(dossier, { recursive: true, force: true })
  mkdirSync(dossier, { recursive: true })
  const hash = createHash('sha1')
  let index = 0
  for (const v of ['V1', 'V2']) {
    const video = join(VIDEOS, `${v}-${nom}.mp4`)
    const total = nbImages(video)
    // Images réparties régulièrement, première et dernière comprises.
    const choix = Array.from({ length: f.parVideo }, (_, i) => Math.round((i * (total - 1)) / (f.parVideo - 1)))
    const tmp = mkdtempSync(join(tmpdir(), 'hero-video-'))
    const filtre = `select='${choix.map((n) => `eq(n\\,${n})`).join('+')}',scale=${f.largeur}:${f.hauteur}:flags=lanczos`
    execFileSync('ffmpeg', ['-v', 'error', '-i', video, '-vf', filtre, '-fps_mode', 'passthrough', join(tmp, '%03d.png')])
    for (const png of readdirSync(tmp).sort()) {
      const sortie = join(dossier, `${String(index).padStart(3, '0')}.webp`)
      await sharp(join(tmp, png)).webp({ quality: f.qualite, effort: 6 }).toFile(sortie)
      hash.update(readFileSync(sortie))
      index++
    }
    rmSync(tmp, { recursive: true, force: true })
    console.log(`${nom} ${v} : ${f.parVideo} images sur ${total}`)
  }
  const octets = readdirSync(dossier).reduce((s, n) => s + statSync(join(dossier, n)).size, 0)
  manifeste[nom] = {
    images: index,
    parVideo: f.parVideo,
    largeur: f.largeur,
    hauteur: f.hauteur,
    version: hash.digest('hex').slice(0, 10),
    octets,
  }
  console.log(`${nom} : ${index} images, ${(octets / 1024 / 1024).toFixed(2)} Mo`)
}
mkdirSync(dirname(MANIFESTE), { recursive: true })
writeFileSync(MANIFESTE, `${JSON.stringify(manifeste, null, 2)}\n`)
console.log('manifeste :', MANIFESTE)
