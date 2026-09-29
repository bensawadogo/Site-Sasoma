import { describe, expect, it } from 'vitest'

import {
  angleBidon,
  BEC_AVANT,
  angleDebut,
  ballottement,
  courbe,
  debit,
  demiEncombrement,
  directionFilet,
  PHASES,
  placerGoulot,
  poseBidon,
  pointFilet,
  tableVersement,
} from '@/lib/versement'

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

  it('part vers le bas aussi quand le bidon verse vers la gauche', () => {
    const p = pointFilet({ x: 300, y: 100 }, { x: 100, y: 260 }, 0.2, 0.05)
    expect(p.x).toBeLessThan(300)
    expect(p.y).toBeGreaterThan(100)
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
    droite: 1432,
    haut: 80,
  }

  it('garde la cible quand le bidon tient dans l’écran', () => {
    expect(placerGoulot(base)).toEqual({ x: 450, y: 260 })
  })

  it('décale à droite si le bidon sortait à gauche, sans dépasser l’orifice', () => {
    const g = placerGoulot({ ...base, orifice: { x: 60, y: 300 } })
    expect(g.x).toBe(56)
  })

  it('bidon à droite : décalé à gauche s’il sortait à droite, sans dépasser l’orifice', () => {
    const g = placerGoulot({ ...base, orifice: { x: 1400, y: 300 }, cible: { x: 0.5, y: -0.4 }, goulotVersPivot: { x: 43, y: -3 } })
    expect(g.x).toBe(1404)
    expect(placerGoulot({ ...base, cible: { x: 0.5, y: -0.4 }, goulotVersPivot: { x: 43, y: -3 } })).toEqual({ x: 550, y: 260 })
  })

  it('descend si le bidon passait sous l’en-tête, en restant au-dessus de l’orifice', () => {
    const g = placerGoulot({ ...base, orifice: { x: 500, y: 150 }, haut: 120 })
    expect(g.y).toBeGreaterThan(110)
    expect(g.y).toBeLessThanOrEqual(150 - 20)
  })
})

describe('chorégraphie naturelle', () => {
  it('courbe : bornes et monotonie', () => {
    const e = courbe(0.45, 0, 0.25, 1)
    expect(e(0)).toBe(0)
    expect(e(1)).toBe(1)
    expect(e(0.3)).toBeLessThan(e(0.6))
    expect(courbe(0, 0, 1, 1)(0.5)).toBeCloseTo(0.5, 3)
  })

  it('angleBidon : debout, 80° en fin de levée, 128° en fin de versement, 40° en sortant', () => {
    expect(angleBidon(PHASES.approche[0])).toBeCloseTo(80, 0)
    expect(angleBidon(PHASES.coupure[0])).toBeCloseTo(128, 0)
    expect(angleBidon(1)).toBeCloseTo(40, 5)
    expect(Math.abs(angleBidon(0))).toBe(0)
    expect(angleBidon(0.03)).toBeLessThan(0) // anticipation
  })

  it('debit : nul avant que l’huile atteigne le bec, plein ensuite', () => {
    expect(angleDebut(2 / 3)).toBeCloseTo(97)
    expect(debit(90, 2 / 3)).toBe(0)
    expect(debit(115, 2 / 3)).toBe(1)
    expect(debit(103, 2 / 3)).toBeGreaterThan(0)
  })

  it('tableVersement : le bidon se vide de 0,67 à 0,40 et le débit s’arrête au retour', () => {
    const etat = tableVersement(0.67, 0.4)
    expect(etat(0).remplissage).toBeCloseTo(0.67)
    expect(etat(1).remplissage).toBeCloseTo(0.4, 2)
    expect(etat(0.2).debit).toBe(0)
    expect(etat(0.6).debit).toBeGreaterThan(0.5)
    expect(etat(0.95).debit).toBe(0)
  })

  it('ballottement : borné, et amorti longtemps après les arrêts', () => {
    for (let u = 0; u <= 1; u += 0.01) expect(Math.abs(ballottement(u, 4))).toBeLessThan(12)
    // Pendant le versement, rotation lente : la surface est presque calme.
    expect(Math.abs(ballottement(0.74, 4))).toBeLessThan(2.5)
  })
})

describe('pose du bidon', () => {
  const g = { pivot: { x: 100, y: 200 }, goulot: { x: 75, y: 140 }, poignee: { x: 130, y: 150 }, hauteur: 200, goulotVerse: { x: 300, y: 120 } }

  it('au repos : aucune translation', () => {
    const p = poseBidon(0, g)
    expect(p.translation.x).toBeCloseTo(0)
    expect(p.translation.y).toBeCloseTo(0)
    expect(p.goulot.x).toBeCloseTo(75)
  })

  it('pendant le versement, le goulot reste au-dessus de sa place (à 2 px près)', () => {
    for (const u of [0.5, 0.6, 0.7, 0.78]) {
      const p = poseBidon(u, g)
      expect(Math.abs(p.goulot.x - 300)).toBeLessThan(2)
      expect(Math.abs(p.goulot.y - 120)).toBeLessThan(2)
    }
  })

  it('aucun saut entre deux phases', () => {
    for (let u = 0.001; u < 1; u += 0.002) {
      const a = poseBidon(u, g).goulot
      const b = poseBidon(u + 0.002, g).goulot
      expect(Math.hypot(b.x - a.x, b.y - a.y)).toBeLessThan(12)
    }
  })

  it('sort vers le haut et la gauche', () => {
    const coupe = poseBidon(PHASES.sortie[0], g).goulot
    const fin = poseBidon(1, g).goulot
    expect(fin.x).toBeLessThan(coupe.x - 100)
    expect(fin.y).toBeLessThan(coupe.y - 100)
  })

  it('directionFilet : le long du col à plein débit, vers le bas quand il faiblit', () => {
    const plein = directionFilet(115, 1)
    const faible = directionFilet(115, 0.1)
    expect(plein.x).toBeGreaterThan(faible.x)
    expect(faible.y).toBeGreaterThan(plein.y)
  })
})

describe('bidon à droite, goulot devant (BEC_AVANT)', () => {
  const g = { pivot: { x: 400, y: 200 }, goulot: { x: 375, y: 140 }, poignee: { x: 430, y: 150 }, hauteur: 200, goulotVerse: { x: 250, y: 150 } }

  it('penche vers la gauche ; l’huile arrive au bec vers 60° (bidon aux deux tiers)', () => {
    expect(angleBidon(PHASES.coupure[0], BEC_AVANT)).toBeCloseTo(-92, 0)
    expect(angleDebut(2 / 3, BEC_AVANT)).toBeCloseTo(60)
    expect(debit(-50, 2 / 3, BEC_AVANT)).toBe(0)
    expect(debit(-75, 2 / 3, BEC_AVANT)).toBe(1)
  })

  it('le bidon verse vraiment et se vide', () => {
    const etat = tableVersement(0.67, 0.4, BEC_AVANT)
    expect(etat(0.6).debit).toBeGreaterThan(0.5)
    expect(etat(1).remplissage).toBeCloseTo(0.4, 2)
    expect(etat(0.95).debit).toBe(0)
  })

  it('goulot tenu au-dessus de sa place, puis sortie vers le haut et la droite', () => {
    const p = poseBidon(0.6, g, BEC_AVANT)
    expect(Math.abs(p.goulot.x - 250)).toBeLessThan(4)
    expect(Math.abs(p.goulot.y - 150)).toBeLessThan(4)
    const fin = poseBidon(1, g, BEC_AVANT).goulot
    expect(fin.y).toBeLessThan(150 - 100)
    expect(fin.x).toBeGreaterThan(poseBidon(PHASES.sortie[0], g, BEC_AVANT).goulot.x)
  })

  it('le filet ne part jamais vers le haut, et part vers le moteur (à gauche)', () => {
    for (const a of [-40, -64, -80, -92]) expect(directionFilet(a, 1).y).toBeGreaterThan(0)
    expect(directionFilet(-70, 1).x).toBeLessThan(0)
  })
})
