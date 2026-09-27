import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import {
  angleArbreCames,
  angleBielle,
  angleCycle,
  axePiston,
  GEOMETRIE,
  leveeCame,
  leveeSoupape,
  maneton,
  rotationCame,
  tempsMoteur,
} from './moteur-svg'

const G = GEOMETRIE
const PMH = G.axePistonPMH
const PMB = PMH + 2 * G.rayonManivelle
const angles = Array.from({ length: 720 }, (_, k) => k)
const leveeMax = G.came.excentration + G.came.nez - G.came.base

describe('moteur SVG : bielle-manivelle', () => {
  it('cylindre 1 au PMH à 0°, au PMB à 180°', () => {
    expect(axePiston(0, 0)).toBeCloseTo(PMH)
    expect(axePiston(180, 0)).toBeCloseTo(PMB)
    expect(axePiston(360, 0)).toBeCloseTo(PMH)
  })

  it('cylindres 1 et 4 en phase, 2 et 3 en phase et opposés à 1', () => {
    for (const a of angles) {
      expect(axePiston(a, 3)).toBeCloseTo(axePiston(a, 0))
      expect(axePiston(a, 2)).toBeCloseTo(axePiston(a, 1))
      expect(axePiston(a, 1)).toBeCloseTo(axePiston(a + 180, 0))
    }
  })

  it('le piston reste entre PMH et PMB, la bielle garde sa longueur', () => {
    for (const a of angles) {
      for (let i = 0; i < 4; i++) {
        const y = axePiston(a, i)
        expect(y).toBeGreaterThanOrEqual(PMH - 1e-9)
        expect(y).toBeLessThanOrEqual(PMB + 1e-9)
        const m = maneton(a, i)
        expect(Math.hypot(m.x - G.cylindres[i], m.y - y)).toBeCloseTo(G.longueurBielle)
      }
    }
  })

  it('l’inclinaison de la bielle pointe du maneton vers l’axe de piston', () => {
    for (const a of [30, 90, 200, 300]) {
      const m = maneton(a, 0)
      const t = (angleBielle(a, 0) * Math.PI) / 180
      // vecteur « haut » (0, -L) tourné de t (sens horaire à l'écran)
      expect(m.x + G.longueurBielle * Math.sin(t)).toBeCloseTo(G.cylindres[0])
      expect(m.y - G.longueurBielle * Math.cos(t)).toBeCloseTo(axePiston(a, 0))
    }
  })

  it('ordre d’allumage 1-3-4-2 (début de la détente tous les 180°)', () => {
    const debutDetente = [0, 1, 2, 3].map((i) => angles.find((a) => angleCycle(a, i) === 360))
    const ordre = [0, 1, 2, 3].sort((p, q) => debutDetente[p]! - debutDetente[q]!).map((i) => i + 1)
    // ordre cyclique : on le fait commencer au cylindre 1
    const k = ordre.indexOf(1)
    expect([...ordre.slice(k), ...ordre.slice(0, k)]).toEqual([1, 3, 4, 2])
    // les débuts de détente sont espacés de 180°
    expect([...debutDetente].sort((p, q) => p! - q!)).toEqual([0, 180, 360, 540])
    expect(tempsMoteur(0, 0)).toBe('admission')
    expect(tempsMoteur(370, 0)).toBe('detente')
  })
})

describe('moteur SVG : distribution', () => {
  it('arbre à cames à demi-vitesse du vilebrequin', () => {
    expect(angleArbreCames(720)).toBe(360)
    for (const a of [0, 45, 300]) {
      expect(rotationCame(a + 100, 2, 'admission') - rotationCame(a, 2, 'admission')).toBeCloseTo(50)
    }
  })

  it('cycle de 720° : la levée se répète tous les 2 tours, pas à chaque tour', () => {
    expect(leveeSoupape(90, 0, 'admission')).toBeCloseTo(leveeMax)
    expect(leveeSoupape(90 + 360, 0, 'admission')).toBe(0)
    for (const a of angles) {
      for (let i = 0; i < 4; i++) {
        expect(leveeSoupape(a + 720, i, 'echappement')).toBeCloseTo(leveeSoupape(a, i, 'echappement'))
      }
    }
  })

  it('admission ouverte en admission, échappement en échappement, tout fermé en compression et détente', () => {
    for (let i = 0; i < 4; i++) {
      for (const a of angles) {
        const t = tempsMoteur(a, i)
        const c = angleCycle(a, i)
        const adm = leveeSoupape(a, i, 'admission')
        const ech = leveeSoupape(a, i, 'echappement')
        // ouverture un peu avant le PMH, fermeture un peu après le PMB (croisement réaliste)
        if (t === 'admission' && c > 20 && c < 160) expect(adm).toBeGreaterThan(0)
        if (t === 'echappement' && c > 560 && c < 700) expect(ech).toBeGreaterThan(0)
        if (c > 210 && c < 510) expect(adm + ech).toBe(0)
      }
    }
    expect(leveeSoupape(630, 0, 'echappement')).toBeCloseTo(leveeMax)
    expect(leveeCame(0)).toBeCloseTo(leveeMax)
    expect(leveeCame(180)).toBe(0)
  })

  it('aucune soupape ne touche le piston', () => {
    for (let a = 0; a < 720; a += 0.5) {
      for (let i = 0; i < 4; i++) {
        const calotte = axePiston(a, i) - G.hauteurCalotte
        for (const sens of ['admission', 'echappement'] as const) {
          expect(G.faceSoupape + leveeSoupape(a, i, sens)).toBeLessThan(calotte - 4)
        }
      }
    }
  })
})

describe('moteur SVG : cohérence avec le dessin', () => {
  const svg = readFileSync(new URL('../components/hero/MoteurSVG.astro', import.meta.url), 'utf8')
  const transforms = (crochet: string) =>
    [...svg.matchAll(new RegExp(`<(?:use|g)[^>]*${crochet}[^>]*transform="([^"]+)"`, 'g'))].map((m) => m[1])

  it('un seul <svg> racine, repère 1000×1000, décoratif', () => {
    expect(svg.match(/<svg/g)).toHaveLength(1)
    expect(svg).toContain('viewBox="0 0 1000 1000"')
    expect(svg).toMatch(/<svg[^>]*data-moteur[^>]*aria-hidden="true"/)
    expect(svg).not.toMatch(/<text|<filter/)
  })

  it('4 pistons, bielles, manivelles et 8 cames, soupapes, ressorts, placés sur la géométrie', () => {
    const x = (t: string) => Number(/translate\(([-\d.]+)/.exec(t)?.[1])
    const pistons = transforms('data-piston')
    expect(pistons.map(x)).toEqual([...G.cylindres])
    expect(pistons.map((t) => Number(/translate\([-\d.]+ ([-\d.]+)/.exec(t)?.[1]))).toEqual(
      [0, 1, 2, 3].map((i) => Math.round(axePiston(0, i) * 100) / 100),
    )
    expect(transforms('data-manivelle')).toHaveLength(4)
    expect(transforms('data-bielle')).toHaveLength(4)
    const soupapesX = G.cylindres.flatMap((c) => [c - G.ecartSoupapes, c + G.ecartSoupapes])
    expect(transforms('data-came').map(x)).toEqual(soupapesX)
    expect(transforms('data-soupape').map(x)).toEqual(soupapesX)
    expect(transforms('data-came').every((t) => t.includes(` ${G.axeCames})`))).toBe(true)
    expect(transforms('data-ressort')).toHaveLength(8)
  })

  it('l’en-tête annonce l’ouverture de remplissage de GEOMETRIE', () => {
    expect(svg).toContain(`x = ${G.remplissage.x}, y = ${G.remplissage.y}`)
    expect(svg).toContain(`<ellipse cx="${G.remplissage.x}" cy="${G.remplissage.y}"`)
  })
})
