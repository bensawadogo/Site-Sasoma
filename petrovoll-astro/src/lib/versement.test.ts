import { describe, expect, it } from 'vitest'

import { demiEncombrement, placerGoulot, pointFilet } from '@/lib/versement'

describe('pointFilet', () => {
  const a = { x: 100, y: 100 }
  const b = { x: 300, y: 260 }

  it('part du goulot et arrive dans l’orifice', () => {
    expect(pointFilet(a, b, 0.2, 0)).toEqual(a)
    expect(pointFilet(a, b, 0.2, 1)).toEqual(b)
  })

  it('avance régulièrement en x (chute libre : vitesse horizontale constante)', () => {
    const xs = [0, 0.25, 0.5, 0.75, 1].map((t) => pointFilet(a, b, 0.2, t).x)
    const pas = xs.slice(1).map((x, i) => x - xs[i])
    for (const d of pas) expect(d).toBeCloseTo(50)
  })

  it('accélère en y : la chute est plus rapide à la fin', () => {
    const y = (t: number) => pointFilet(a, b, 0.2, t).y
    expect(y(1) - y(0.9)).toBeGreaterThan(y(0.1) - y(0))
  })

  it('verticale quand le goulot est juste au-dessus de l’orifice', () => {
    const p = pointFilet({ x: 50, y: 0 }, { x: 50, y: 100 }, 0.2, 0.5)
    expect(p.x).toBe(50)
  })
})

describe('demiEncombrement', () => {
  it('droit : moitié des côtés ; couché : côtés échangés', () => {
    expect(demiEncombrement(60, 100, 0)).toEqual({ l: 30, h: 50 })
    const couche = demiEncombrement(60, 100, 90)
    expect(couche.l).toBeCloseTo(50)
    expect(couche.h).toBeCloseTo(30)
  })
})

describe('placerGoulot', () => {
  const base = {
    orifice: { x: 500, y: 300 },
    cible: { x: -0.5, y: -0.4 },
    bidon: { l: 64, h: 100 },
    goulotVersPivot: { x: -43, y: -3 },
    angle: 115,
    gauche: 8,
    haut: 80,
  }

  it('garde la cible quand le bidon tient dans l’écran', () => {
    expect(placerGoulot(base)).toEqual({ x: 450, y: 260 })
  })

  it('décale à droite si le bidon sortait à gauche, sans dépasser l’orifice', () => {
    const g = placerGoulot({ ...base, orifice: { x: 60, y: 300 } })
    expect(g.x).toBe(56)
  })

  it('descend si le bidon passait sous l’en-tête, en restant au-dessus de l’orifice', () => {
    const g = placerGoulot({ ...base, orifice: { x: 500, y: 150 }, haut: 120 })
    expect(g.y).toBeGreaterThan(110)
    expect(g.y).toBeLessThanOrEqual(150 - 20)
  })
})
