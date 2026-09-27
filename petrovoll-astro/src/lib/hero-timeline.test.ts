import { describe, expect, it } from 'vitest'

import { cadrageA, choisirPalier, opaciteBloc, palierInferieur, tournerAutour, transformCadrage } from './hero-timeline'

describe('tournerAutour', () => {
  it('90° dans le sens horaire à l’écran (y vers le bas)', () => {
    const r = tournerAutour({ x: 10, y: 0 }, { x: 0, y: 0 }, 90)
    expect(r.x).toBeCloseTo(0)
    expect(r.y).toBeCloseTo(10)
  })
})

describe('opaciteBloc', () => {
  it('visible au milieu, invisible hors plage, pas de fondu aux bornes 0 et 1', () => {
    expect(opaciteBloc(0.2, 0.08, 0.35)).toBe(1)
    expect(opaciteBloc(0.5, 0.08, 0.35)).toBe(0)
    expect(opaciteBloc(0, 0, 0.08)).toBe(1)
    expect(opaciteBloc(1, 0.92, 1)).toBe(1)
  })
  it('deux blocs voisins ne se superposent jamais', () => {
    for (let p = 0.3; p <= 0.4; p += 0.001) {
      expect(Math.min(opaciteBloc(p, 0.08, 0.35), opaciteBloc(p, 0.35, 0.55))).toBe(0)
    }
  })
})

describe('choisirPalier', () => {
  const base = { largeur: 360, tactile: true }
  it('?tier= est prioritaire', () => {
    expect(choisirPalier({ ...base, forcage: 'full', saveData: true })).toBe('full')
  })
  it('lite : économie de données, 3G, ≤ 2 Go, mouvement réduit', () => {
    expect(choisirPalier({ ...base, saveData: true })).toBe('lite')
    expect(choisirPalier({ ...base, typeConnexion: '3g' })).toBe('lite')
    expect(choisirPalier({ ...base, memoireGo: 2 })).toBe('lite')
    expect(choisirPalier({ ...base, mouvementReduit: true })).toBe('lite')
  })
  it('standard par défaut sur mobile, full si ≥ 6 Go en 4G ou ordinateur', () => {
    expect(choisirPalier({ ...base, typeConnexion: '4g', memoireGo: 4 })).toBe('standard')
    expect(choisirPalier({ ...base, typeConnexion: '4g', memoireGo: 8 })).toBe('full')
    expect(choisirPalier({ largeur: 1440, tactile: false })).toBe('full')
  })
  it('garde-fou : descend d’un palier', () => {
    expect(palierInferieur('full')).toBe('standard')
    expect(palierInferieur('standard')).toBe('lite')
  })
})

describe('cadrage du moteur', () => {
  const cles = [
    { t: 0, x: 0.5, y: 0.5, zoom: 1 },
    { t: 0.5, x: 0.5, y: 0.2, zoom: 2 },
    { t: 1, x: 0.5, y: 0.2, zoom: 2 },
  ]
  it('interpole entre deux clés, tient le plan entre deux clés identiques', () => {
    expect(cadrageA(0, cles)).toEqual({ x: 0.5, y: 0.5, zoom: 1 })
    expect(cadrageA(0.25, cles).zoom).toBeCloseTo(1.5)
    expect(cadrageA(0.75, cles)).toEqual({ x: 0.5, y: 0.2, zoom: 2 })
    expect(cadrageA(2, cles)).toEqual({ x: 0.5, y: 0.2, zoom: 2 })
  })
  it('amène le point visé du dessin sur la cible de l’écran', () => {
    const carre = { x0: 10, y0: 20, cote: 300 }
    const c = { x: 0.5, y: 0.2, zoom: 2 }
    const { tx, ty, s } = transformCadrage(c, carre, { x: 180, y: 400 })
    expect(carre.x0 + tx + s * c.x * carre.cote).toBeCloseTo(180)
    expect(carre.y0 + ty + s * c.y * carre.cote).toBeCloseTo(400)
  })
})
