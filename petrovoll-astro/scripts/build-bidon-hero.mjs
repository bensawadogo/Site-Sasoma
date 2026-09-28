/**
 * build-bidon-hero.mjs — prépare la photo du bidon pour le hero (phase 4 du brief).
 *
 *   ../assets/photos/stark/P1.png (photo détourée, fond transparent)
 *     → src/assets/hero/bidon/corps.webp        le bidon SANS bouchon (sert aussi de
 *                                              masque pour l'huile qui monte, en t1)
 *     → src/assets/hero/bidon/bouchon.webp      le bouchon seul (il saute en t2)
 *     → src/assets/hero/bidon/vignette.webp     le bidon entier, pour l'écran de fin
 *     → src/assets/hero/bidon/geometrie.json    cadre, goulot (spout), pivot, bouchon
 *
 * Le bouchon est repéré par sa couleur rouge, puis découpé dans la photo elle-même.
 * Aucune IA, et l'étiquette n'est pas modifiée. L'ouverture du goulot, cachée sous
 * le bouchon, est dessinée en CSS par le hero.
 *
 * USAGE : npm run hero:bidon
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import sharp from 'sharp'

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..')
const SOURCE = join(RACINE, '..', 'assets', 'photos', 'stark', 'P1.png')
const SORTIE = join(RACINE, 'src', 'assets', 'hero', 'bidon')
const MARGE = 4 // px autour du bidon
const opaque = (a) => a > 128
const rougeBouchon = (r, g, b) => r > 150 && g < 110 && b < 120

const { data, info } = await sharp(SOURCE).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const { width: L, height: H } = info
const px = (x, y) => data.subarray((y * L + x) * 4, (y * L + x) * 4 + 4)

// 1. Cadre du bidon (pixels opaques) et centre de masse (pivot).
const cadre = { x0: L, y0: H, x1: 0, y1: 0 }
let sx = 0
let sy = 0
let n = 0
for (let y = 0; y < H; y++) {
  for (let x = 0; x < L; x++) {
    if (!opaque(px(x, y)[3])) continue
    Object.assign(cadre, { x0: Math.min(cadre.x0, x), y0: Math.min(cadre.y0, y), x1: Math.max(cadre.x1, x), y1: Math.max(cadre.y1, y) })
    sx += x
    sy += y
    n++
  }
}
// Bouchon : pixels rouges du QUART SUPÉRIEUR seulement (l'étiquette a aussi un bandeau rouge).
const rouge = { x0: L, y0: H, x1: 0, y1: 0 }
for (let y = cadre.y0; y < cadre.y0 + (cadre.y1 - cadre.y0) / 4; y++) {
  for (let x = cadre.x0; x <= cadre.x1; x++) {
    const [r, g, bl, a] = px(x, y)
    if (opaque(a) && rougeBouchon(r, g, bl)) Object.assign(rouge, { x0: Math.min(rouge.x0, x), y0: Math.min(rouge.y0, y), x1: Math.max(rouge.x1, x), y1: Math.max(rouge.y1, y) })
  }
}
if (rouge.x1 === 0) throw new Error('Bouchon rouge introuvable dans P1.png')

// 2. Bouchon = pixels opaques dans la boîte rouge (élargie de 3 px, jusqu'au bas du rouge).
// Bornée à l'image : une photo détourée au ras du bouchon ne doit pas déborder.
const b = {
  x0: Math.max(0, rouge.x0 - 3),
  y0: Math.max(0, rouge.y0 - 3),
  x1: Math.min(L - 1, rouge.x1 + 3),
  y1: Math.min(H - 2, rouge.y1 + 1),
}
const corps = Buffer.from(data)
const bouchon = Buffer.alloc(data.length) // transparent
for (let y = b.y0; y <= b.y1; y++) {
  for (let x = b.x0; x <= b.x1; x++) {
    const i = (y * L + x) * 4
    data.copy(bouchon, i, i, i + 4)
    corps[i + 3] = 0
  }
}

// 3. Goulot : centre de la ligne opaque juste sous le bouchon, dans la colonne du bouchon.
const yGoulot = b.y1 + 1
let gx0 = L
let gx1 = 0
for (let x = b.x0; x <= b.x1; x++) {
  if (opaque(px(x, yGoulot)[3])) {
    gx0 = Math.min(gx0, x)
    gx1 = Math.max(gx1, x)
  }
}

if (gx1 < gx0) throw new Error(`Goulot introuvable sous le bouchon (ligne y = ${yGoulot}) : vérifier P1.png`)

// 4. Export dans un cadre commun (bidon + marge) : corps et bouchon se superposent au pixel.
const c = { left: Math.max(0, cadre.x0 - MARGE), top: Math.max(0, cadre.y0 - MARGE) }
c.width = Math.min(L, cadre.x1 + MARGE + 1) - c.left
c.height = Math.min(H, cadre.y1 + MARGE + 1) - c.top
const brut = (buf) => sharp(buf, { raw: { width: L, height: H, channels: 4 } }).extract(c)
mkdirSync(SORTIE, { recursive: true })
await brut(corps).webp({ quality: 90, alphaQuality: 100, effort: 6 }).toFile(join(SORTIE, 'corps.webp'))
const bc = { left: b.x0 - c.left, top: b.y0 - c.top, width: b.x1 - b.x0 + 1, height: b.y1 - b.y0 + 1 }
await sharp(await brut(bouchon).png().toBuffer()).extract(bc).webp({ quality: 90, alphaQuality: 100 }).toFile(join(SORTIE, 'bouchon.webp'))

// Vignette de l'écran de fin : le bidon entier (avec bouchon), 240 px de haut.
await brut(data).resize({ height: 240 }).webp({ quality: 85, alphaQuality: 100 }).toFile(join(SORTIE, 'vignette.webp'))

const f = (v, total) => +(v / total).toFixed(4)
const geometrie = {
  source: 'assets/photos/stark/P1.png',
  cadre: { l: c.width, h: c.height },
  spout: { x: f((gx0 + gx1) / 2 - c.left, c.width), y: f(yGoulot - c.top, c.height) },
  bottlePivot: { x: f(sx / n - c.left, c.width), y: f(sy / n - c.top, c.height) },
  ouverture: { l: f((gx1 - gx0 + 1) * 0.7, c.width) }, // diamètre intérieur ≈ 70 % du goulot
  bouchon: { x: f(bc.left, c.width), y: f(bc.top, c.height), l: f(bc.width, c.width), h: f(bc.height, c.height) },
}
writeFileSync(join(SORTIE, 'geometrie.json'), `${JSON.stringify(geometrie, null, 2)}\n`)
console.log(JSON.stringify(geometrie, null, 2))
