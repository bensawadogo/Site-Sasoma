import { describe, expect, it } from 'vitest'

import catalogue from '../../research/catalogue.json'

import { HERO, type Point, type Zone } from './hero.config'

const dansImage = (p: Point) => p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1
const seChevauchent = (a: Zone, b: Zone) =>
  a.x < b.x + b.l && b.x < a.x + a.l && a.y < b.y + b.h && b.y < a.y + a.h

describe('hero.config', () => {
  it('timeline : plages contiguës de 0 à 1, dans l’ordre du brief', () => {
    const t = HERO.temps
    expect(t.map((x) => x.id)).toEqual(['ouverture', 't1', 't2', 't3', 'fin'])
    expect(t[0].debut).toBe(0)
    expect(t.at(-1)?.fin).toBe(1)
    t.slice(1).forEach((x, i) => expect(x.debut).toBe(t[i].fin))
    expect(HERO.partageSequence.v1 + HERO.partageSequence.v2).toBeCloseTo(1)
  })

  it('ancres dans l’image, filler mobile dans la zone toujours visible', () => {
    const { bidon, filler, zoneSure } = HERO.ancres
    ;[bidon.spout, bidon.bottlePivot, filler.mobile, filler.desktop].forEach((p) => expect(dansImage(p)).toBe(true))
    expect(filler.mobile.x).toBeGreaterThanOrEqual(zoneSure.mobile.xMin)
    expect(filler.mobile.x).toBeLessThanOrEqual(zoneSure.mobile.xMax)
  })

  it('mise en page : le bidon et les textes évitent l’en-tête et se chevauchent pas', () => {
    for (const z of Object.values(HERO.zones)) {
      expect(seChevauchent(z.bidon, z.entete)).toBe(false)
      expect(seChevauchent(z.textes, z.entete)).toBe(false)
      expect(seChevauchent(z.bidon, z.textes)).toBe(false)
      expect(z.textes.y).toBeGreaterThanOrEqual(0.7) // bas assombri (§6.2)
    }
  })

  it('produits présents dans le catalogue de recherche', () => {
    const ids = new Set(catalogue.categories.flatMap((c) => c.produits.map((p) => p.id)))
    expect(ids.has(HERO.produitVerse)).toBe(true)
    HERO.produitsFin.forEach((p) => expect(ids.has(p.id)).toBe(true))
  })

  it('budgets de paliers conformes au brief', () => {
    expect(HERO.paliers.lite.images).toBe(0)
    expect(HERO.paliers.standard.images).toBe(48)
    expect(HERO.paliers.full.images).toBeGreaterThanOrEqual(96)
    expect([HERO.paliers.lite.dprMax, HERO.paliers.standard.dprMax, HERO.paliers.full.dprMax]).toEqual([1, 1.5, 2])
  })
})
