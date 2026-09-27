/**
 * build-frames.mjs — séquences d'images, affiches et manifeste du hero (brief §7-8).
 *
 *   Source (par format mobile 9:16 / desktop 16:9) :
 *     réel      : ../assets/ai/V1-M.mp4 + V2-M.mp4 (V1-D / V2-D) et E1/E2/E3-916|169.png
 *     provisoire: --provisoire → dégradé animé ffmpeg + repères (phase 3, aucun asset IA)
 *
 *   Sorties :
 *     public/hero/frames/<palier>-<format>/000.<ext>   standard 48 WebP q55, full 96 AVIF
 *     src/assets/hero/posters/<e1|e2|e3>-<format>.<avif|webp>   affiches (palier lite + LCP)
 *     src/assets/hero/manifest.json                    lu par src/scripts/hero-scroll.ts
 *
 * USAGE : npm run hero:frames -- --provisoire
 */
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import sharp from 'sharp'

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..')
const IA = join(RACINE, '..', 'assets', 'ai')
const TRAVAIL = join(RACINE, '.tmp-frames')
const FRAMES = join(RACINE, 'public', 'hero', 'frames')
const POSTERS = join(RACINE, 'src', 'assets', 'hero', 'posters')
const MANIFESTE = join(RACINE, 'src', 'assets', 'hero', 'manifest.json')
const PROVISOIRE = process.argv.includes('--provisoire')

const FORMATS = {
  mobile: { source: [1080, 1920], suffixe: 'M', ratio: '916', affiche: [720, 1280], filler: [0.5, 0.5] },
  desktop: { source: [1920, 1080], suffixe: 'D', ratio: '169', affiche: [1600, 900], filler: [0.6, 0.46] },
}
// Mêmes valeurs que HERO.paliers dans src/hero.config.ts (le test de la config les vérifie).
const PALIERS = {
  standard: { images: 48, echelle: 0.5, ext: 'webp', encoder: (s) => s.webp({ quality: 55, effort: 5 }) },
  full: { images: 96, echelle: 1, ext: 'avif', encoder: (s) => s.avif({ quality: 50, effort: 4 }) },
}
const AFFICHES = { e1: 0, e2: 0.5, e3: 1 } // position dans la séquence (provisoire uniquement)

const ffmpeg = (...args) => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'pipe' })
const ko = (octets) => `${Math.round(octets / 1024)} Ko`

/** Repères du prototype : libellés + croix sur l'ancre filler. */
function repere([l, h], i, n, filler) {
  const t = i / Math.max(1, n - 1)
  const plan = t < 0.5 ? 'V1 · arbre à cames' : 'V2 · pistons → vilebrequin'
  const fs = Math.round(l / 22)
  const [fx, fy] = [filler[0] * l, filler[1] * h]
  const croix = t === 0 ? `<g stroke="#f0cc30" stroke-width="${fs / 6}" fill="none"><circle cx="${fx}" cy="${fy}" r="${fs * 1.2}"/><path d="M${fx - fs * 2} ${fy}h${fs * 4}M${fx} ${fy - fs * 2}v${fs * 4}"/></g>` : ''
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${l}" height="${h}">
    ${croix}
    <g font-family="Arial, sans-serif" fill="#f0cc30" text-anchor="middle">
      <text x="${l / 2}" y="${h * 0.2}" font-size="${fs}" opacity="0.8">PROVISOIRE · ${plan}</text>
      <text x="${l / 2}" y="${h * 0.62}" font-size="${fs * 2.4}" font-weight="bold" opacity="0.35">${String(i + 1).padStart(3, '0')} / ${n}</text>
    </g></svg>`)
}

/** Extrait toutes les images de la source en PNG ; renvoie leurs chemins. */
function extraire(nom, { source: [l, h], suffixe }) {
  const dossier = join(TRAVAIL, nom)
  mkdirSync(dossier, { recursive: true })
  if (PROVISOIRE) {
    ffmpeg('-f', 'lavfi', '-i', `gradients=s=${l}x${h}:r=12:d=10:type=radial:nb_colors=3:c0=0x000000:c1=0x3a2404:c2=0x8a5a08:speed=0.02:seed=7`, join(dossier, '%04d.png'))
  } else {
    const [v1, v2] = ['V1', 'V2'].map((v) => join(IA, `${v}-${suffixe}.mp4`))
    for (const v of [v1, v2]) if (!existsSync(v)) throw new Error(`Vidéo manquante : ${v} (ou lancer avec --provisoire)`)
    ffmpeg('-i', v1, '-i', v2, '-filter_complex', `[0:v]scale=${l}:${h}[a];[1:v]scale=${l}:${h}[b];[a][b]concat=n=2:v=1[v]`, '-map', '[v]', join(dossier, '%04d.png'))
  }
  return readdirSync(dossier).sort().map((f) => join(dossier, f))
}

rmSync(TRAVAIL, { recursive: true, force: true })
rmSync(FRAMES, { recursive: true, force: true })
mkdirSync(POSTERS, { recursive: true })

const manifeste = { provisoire: PROVISOIRE, formats: {}, paliers: {} }
const empreinte = createHash('sha1')
try {
  for (const [nom, f] of Object.entries(FORMATS)) {
    const images = extraire(nom, f)
    manifeste.formats[nom] = { source: f.source }

    for (const [palier, p] of Object.entries(PALIERS)) {
      const [l, h] = f.source.map((c) => Math.round(c * p.echelle))
      const dossier = join(FRAMES, `${palier}-${nom}`)
      mkdirSync(dossier, { recursive: true })
      let total = 0
      for (let i = 0; i < p.images; i++) {
        const src = images[Math.round((i * (images.length - 1)) / (p.images - 1))]
        let img = sharp(src)
        if (PROVISOIRE) img = sharp(await img.composite([{ input: repere(f.source, i, p.images, f.filler) }]).png().toBuffer())
        const sortie = join(dossier, `${String(i).padStart(3, '0')}.${p.ext}`)
        await p.encoder(img.resize(l, h)).toFile(sortie)
        total += statSync(sortie).size
        empreinte.update(readFileSync(sortie))
      }
      manifeste.paliers[palier] ??= {}
      manifeste.paliers[palier][nom] = { dossier: `/hero/frames/${palier}-${nom}`, images: p.images, ext: p.ext, l, h, octets: total }
      console.log(`✅ ${palier}-${nom} : ${p.images} × ${l}×${h} ${p.ext} = ${ko(total)}`)
    }

    // Affiches : images fixes du palier lite, et première image affichée (LCP).
    for (const [id, position] of Object.entries(AFFICHES)) {
      const still = join(IA, `${id.toUpperCase()}-${f.ratio}.png`)
      let img
      if (PROVISOIRE) {
        const i = Math.round(position * (images.length - 1))
        img = sharp(await sharp(images[i]).composite([{ input: repere(f.source, position === 0 ? 0 : i, images.length, f.filler) }]).png().toBuffer())
      } else {
        if (!existsSync(still)) throw new Error(`Image manquante : ${still}`)
        img = sharp(still)
      }
      const [l, h] = f.affiche
      const base = join(POSTERS, `${id}-${nom}`)
      await img.clone().resize(l, h).avif({ quality: 50, effort: 4 }).toFile(`${base}.avif`)
      await img.clone().resize(l, h).webp({ quality: 60, effort: 5 }).toFile(`${base}.webp`)
      console.log(`✅ affiche ${id}-${nom} : avif ${ko(statSync(`${base}.avif`).size)}, webp ${ko(statSync(`${base}.webp`).size)}`)
    }
  }
} finally {
  rmSync(TRAVAIL, { recursive: true, force: true })
}
// L'empreinte change avec le contenu : ?v= dans les URL, jamais d'ancienne image en cache.
manifeste.version = empreinte.digest('hex').slice(0, 10)
writeFileSync(MANIFESTE, `${JSON.stringify(manifeste, null, 2)}\n`)
console.log(`📄 manifeste ${manifeste.version}${PROVISOIRE ? ' (PROVISOIRE)' : ''}`)
