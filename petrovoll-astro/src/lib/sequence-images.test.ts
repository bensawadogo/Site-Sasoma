import { describe, expect, it } from 'vitest'

import { caler, couverture, indexImage, ordreChargement, plusProche, pointCouvert } from './sequence-images'

describe('séquences d’images du hero vidéo', () => {
  it('indexImage : bornes et arrondi', () => {
    expect(indexImage(0, 96)).toBe(0)
    expect(indexImage(1, 96)).toBe(95)
    expect(indexImage(0.5, 3)).toBe(1)
    expect(indexImage(-1, 10)).toBe(0)
    expect(indexImage(2, 10)).toBe(9)
    expect(indexImage(0.5, 1)).toBe(0)
  })

  it('ordreChargement : une image sur 4 d’abord (dernière comprise), puis le reste, sans doublon', () => {
    const o = ordreChargement(10)
    expect(o.slice(0, 4)).toEqual([0, 4, 8, 9])
    expect([...o].sort((a, b) => a - b)).toEqual([...Array(10).keys()])
  })

  it('plusProche : cherche des deux côtés, null si rien n’est chargé', () => {
    const pretes = new Set([2, 9])
    expect(plusProche(4, (k) => pretes.has(k), 10)).toBe(2)
    expect(plusProche(8, (k) => pretes.has(k), 10)).toBe(9)
    expect(plusProche(3, () => false, 10)).toBeNull()
  })

  it('couverture : remplit l’écran sans déformer, focale respectée', () => {
    const c = couverture({ l: 1920, h: 1080 }, { l: 1440, h: 900 })
    expect(c.l / c.h).toBeCloseTo(1920 / 1080)
    expect(c.l).toBeGreaterThanOrEqual(1440)
    expect(c.h).toBeCloseTo(900)
    expect(c.x).toBeCloseTo((1440 - c.l) / 2)
    const droite = couverture({ l: 1920, h: 1080 }, { l: 900, h: 900 }, 1)
    expect(droite.x + droite.l).toBeCloseTo(900) // bord droit collé
  })

  it('couverture avec zoom < 1 : image réduite, placée selon la focale', () => {
    const c = couverture({ l: 1920, h: 1080 }, { l: 1440, h: 900 }, 0.7, 0.5, 0.8)
    expect(c.h).toBeCloseTo(720)
    expect(c.x).toBeCloseTo((1440 - c.l) * 0.7)
    expect(c.y).toBeCloseTo(90)
  })

  it('pointCouvert : un point de l’image suit la couverture', () => {
    const c = { x: -80, y: 0, l: 1600, h: 900 }
    expect(pointCouvert({ x: 0.5, y: 0.5 }, c)).toEqual({ x: 720, y: 450 })
  })

  it('caler : le point choisi de l’image tombe à l’abscisse voulue', () => {
    const c = caler({ l: 1920, h: 1080 }, { l: 1440, h: 900 }, 0.8, 1, 0.795, 0.95)
    expect(c.l).toBeCloseTo(1280)
    expect(c.y).toBeCloseTo(180)
    expect(c.x + 0.795 * c.l).toBeCloseTo(0.95 * 1440)
  })
})
