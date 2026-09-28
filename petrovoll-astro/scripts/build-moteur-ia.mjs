/**
 * build-moteur-ia.mjs — prépare les images IA du moteur (E1 à E3) pour l'aperçu
 * du hero (?moteur=ia). Décision D3 : le moteur SVG reste celui du site tant que
 * Ben n'a pas validé la version IA.
 *
 *   ../assets/ai/E1.png, E2.png, E3.png (720×1280, non commitées, journal : ops/credits.md)
 *     → src/assets/hero/moteur-ia/E1.webp … E3.webp   carré 720×720 centré sur le moteur
 *
 * Le carré remplace exactement le carré du dessin SVG : mêmes cadrages de caméra,
 * même zone à l'écran. L'orifice de remplissage (arrivée du filet) est réglé dans
 * hero.config.ts (moteurIA.filler), en fractions de ce carré.
 *
 * USAGE : npm run hero:moteur-ia
 */
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import sharp from 'sharp'

const ICI = dirname(fileURLToPath(import.meta.url))
const SOURCE = join(ICI, '..', '..', 'assets', 'ai')
const SORTIE = join(ICI, '..', 'src', 'assets', 'hero', 'moteur-ia')
/** Carré retenu dans l'image 720×1280 : le moteur occupe le bas (§7 du guide). */
const CARRE = { left: 0, top: 430, width: 720, height: 720 }

mkdirSync(SORTIE, { recursive: true })
for (const nom of ['E1', 'E2', 'E3']) {
  const image = sharp(join(SOURCE, `${nom}.png`))
  const { width, height } = await image.metadata()
  if (width !== 720 || height !== 1280) throw new Error(`${nom}.png : 720×1280 attendu, reçu ${width}×${height}`)
  const info = await image.extract(CARRE).webp({ quality: 72, effort: 6 }).toFile(join(SORTIE, `${nom}.webp`))
  console.log(`${nom}.webp ${info.width}×${info.height} ${(info.size / 1024).toFixed(1)} Ko`)
}
