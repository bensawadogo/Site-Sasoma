import { describe, expect, it } from 'vitest'

import catalogue from '../../research/catalogue.json'

import { HERO, type Point, type Zone } from './hero.config'
import { GEOMETRIE } from './scripts/moteur-svg'

const dansCadre = (p: Point) => p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1
const seChevauchent = (a: Zone, b: Zone) =>
  a.x < b.x + b.l && b.x < a.x + a.l && a.y < b.y + b.h && b.y < a.y + a.h
const dansEcran = (z: Zone) => z.x >= 0 && z.y >= 0 && z.x + z.l <= 1 && z.y + z.h <= 1

describe('hero.config', () => {
  it('timeline : plages contiguës de 0 à 1, dans l’ordre du brief', () => {
    const t = HERO.temps
    expect(t.map((x) => x.id)).toEqual(['ouverture', 't1', 't2', 't3', 'fin'])
    expect(t[0].debut).toBe(0)
    expect(t.at(-1)?.fin).toBe(1)
    t.slice(1).forEach((x, i) => expect(x.debut).toBe(t[i].fin))
  })

  it('ancres du bidon et orifice du moteur dans leur cadre', () => {
    const { spout, bottlePivot } = HERO.ancres.bidon
    ;[spout, bottlePivot, HERO.moteur.filler].forEach((p) => expect(dansCadre(p)).toBe(true))
  })

  it('mise en page : zones dans l’écran, sans chevauchement, textes dans le bas assombri', () => {
    for (const z of Object.values(HERO.zones)) {
      Object.values(z).forEach((zone) => expect(dansEcran(zone)).toBe(true))
      for (const zone of [z.bidon, z.moteur, z.textes, z.fin]) expect(seChevauchent(zone, z.entete)).toBe(false)
      expect(seChevauchent(z.bidon, z.textes)).toBe(false)
      expect(z.textes.y).toBeGreaterThanOrEqual(0.7) // §6.2
    }
  })

  it('orifice du moteur : même point que le dessin SVG (repère 1000×1000)', () => {
    expect(HERO.moteur.filler).toEqual({ x: GEOMETRIE.remplissage.x / 1000, y: GEOMETRIE.remplissage.y / 1000 })
  })

  it('moteur : cadrages dans l’ordre, huile pièce par pièce', () => {
    const { cadrages, huile, coupe } = HERO.moteur
    cadrages.slice(1).forEach((c, i) => expect(c.t).toBeGreaterThanOrEqual(cadrages[i].t))
    expect([cadrages[0].t, cadrages.at(-1)?.t]).toEqual([0, 1])
    cadrages.forEach((c) => expect(dansCadre(c)).toBe(true))
    expect(huile.cames[1]).toBeLessThanOrEqual(huile.pistons[0])
    expect(huile.pistons[1]).toBeLessThanOrEqual(huile.vilebrequin[0])
    expect(coupe[0]).toBeLessThan(coupe[1])
  })

  it('produits présents dans le catalogue de recherche', () => {
    const ids = new Set(catalogue.categories.flatMap((c) => c.produits.map((p) => p.id)))
    expect(ids.has(HERO.produitVerse)).toBe(true)
    HERO.produitsFin.forEach((p) => expect(ids.has(p.id)).toBe(true))
  })

  it('paliers : définition croissante (brief §8)', () => {
    expect([HERO.paliers.lite.dprMax, HERO.paliers.standard.dprMax, HERO.paliers.full.dprMax]).toEqual([1, 1.5, 2])
  })
})
