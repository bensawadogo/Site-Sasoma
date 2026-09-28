/**
 * hero-scroll.ts — animation du hero au scroll (BRIEF-MAITRE.md §8).
 *
 *  - un seul écouteur de scroll passif ; tout le rendu dans requestAnimationFrame ;
 *  - on n'écrit que opacity et transform (la mise en page n'est recalculée
 *    qu'au redimensionnement) ;
 *  - moteur vectoriel (MoteurSVG) : vilebrequin, pistons et cames tournent avec
 *    le scroll, la « caméra » zoome pièce par pièce (décision D3, TODO.md) ;
 *    aperçu ?moteur=ia : images IA E1 → E3 en fondu, avec poussée puis recul ;
 *  - garde-fou : si le rendu tombe sous ~40 i/s (24 ms par image) pendant 2 s,
 *    on descend d'un palier (canvas du filet moins défini, reflet fixe).
 * Tous les calculs sont dans src/lib/hero-timeline.ts (testés).
 */
import { type Format, HERO, type Palier } from '@/hero.config'
import {
  borner,
  cadrageA,
  choisirPalier,
  doux,
  local,
  mix,
  opaciteBloc,
  palierInferieur,
  tournerAutour,
  transformCadrage,
} from '@/lib/hero-timeline'
import { animerMoteur } from '@/scripts/moteur-svg'

type Pt = { x: number; y: number }
type NavigatorEtendu = Navigator & {
  connection?: { saveData?: boolean; effectiveType?: string }
  deviceMemory?: number
}

const plage = (id: string) => HERO.temps.find((t) => t.id === id)!
const T1 = plage('t1')
const T2 = plage('t2')
const T3 = plage('t3')
const FIN = plage('fin')
const M = HERO.moteur
const IA = HERO.moteurIA

export function lancerHero(racine: HTMLElement): void {
  const scene = racine.querySelector<HTMLElement>('.hero-scene')!
  const canvasFilet = racine.querySelector<HTMLCanvasElement>('[data-filet]')!
  const bidon = racine.querySelector<HTMLElement>('[data-bidon-hero]')!
  const niveau = bidon.querySelector<HTMLElement>('[data-niveau]')
  const bouchon = bidon.querySelector<HTMLElement>('[data-bouchon]')
  const aspectBidon = Number(bidon.dataset.aspect ?? 0.64)
  const moteur = racine.querySelector<HTMLElement>('[data-moteur-cadre]')!
  const svgMoteur = moteur.querySelector<SVGSVGElement>('svg')!
  const racineIA = moteur.querySelector<HTMLElement>('[data-moteur-ia]')
  const modeIA = !!racineIA && new URLSearchParams(location.search).get(IA.parametre) === IA.valeur
  const imagesIA = modeIA ? [...racineIA.querySelectorAll<HTMLImageElement>('img')] : []
  if (modeIA) {
    for (const img of imagesIA) img.src = img.dataset.src ?? ''
    racineIA.hidden = false
    svgMoteur.style.display = 'none'
    racine.dataset.moteur = 'ia'
  }
  const cadrages = modeIA ? IA.cadrages : M.cadrages
  const blocs = [...racine.querySelectorAll<HTMLElement>('.hero-bloc')].map((el) => ({
    el,
    debut: Number(el.dataset.debut),
    fin: Number(el.dataset.fin),
    actif: false,
  }))
  const ctxFilet = canvasFilet.getContext('2d')
  const mouvementReduit = matchMedia('(prefers-reduced-motion: reduce)').matches

  const nav = navigator as NavigatorEtendu
  const forcage = new URLSearchParams(location.search).get(HERO.parametreForcage)
  let palier: Palier = choisirPalier({
    forcage,
    saveData: nav.connection?.saveData,
    typeConnexion: nav.connection?.effectiveType,
    memoireGo: nav.deviceMemory,
    mouvementReduit,
    tactile: matchMedia('(pointer: coarse)').matches,
    largeur: innerWidth,
  })

  // ── Géométrie (recalculée au redimensionnement uniquement) ────────────────
  let format: Format = 'mobile'
  let ecran = { l: 0, h: 0 }
  let dpr = 1
  let goulotRepos: Pt = { x: 0, y: 0 }
  let pivot: Pt = { x: 0, y: 0 }
  let filler: Pt = { x: 0, y: 0 }
  let deplacement: Pt = { x: 0, y: 0 } // translation du bidon en fin de bascule
  let hauteurBidon = 0
  let carre = { x0: 0, y0: 0, cote: 0 } // dessin du moteur (carré) à l'écran
  let centreMoteur: Pt = { x: 0, y: 0 }

  function mesurer() {
    format = innerWidth >= HERO.pointDeRupture ? 'desktop' : 'mobile'
    ecran = { l: scene.clientWidth, h: scene.clientHeight }
    dpr = Math.min(devicePixelRatio || 1, HERO.paliers[palier].dprMax)
    // Réallouer le canvas seulement si sa taille change (la barre d'adresse
    // Android déclenche resize sans changer la largeur).
    const lc = Math.round(ecran.l * dpr)
    const hc = Math.round(ecran.h * dpr)
    if (canvasFilet.width !== lc) canvasFilet.width = lc
    if (canvasFilet.height !== hc) canvasFilet.height = hc

    // Bidon : hauteur de sa zone, centré dedans.
    const zb = HERO.zones[format].bidon
    const h = zb.h * ecran.h
    const l = h * aspectBidon
    hauteurBidon = h
    const gauche = zb.x * ecran.l + (zb.l * ecran.l - l) / 2
    const haut = zb.y * ecran.h
    Object.assign(bidon.style, { left: `${gauche}px`, top: `${haut}px`, width: `${l}px`, height: `${h}px` })
    const { spout, bottlePivot } = HERO.ancres.bidon
    bidon.style.transformOrigin = `${bottlePivot.x * 100}% ${bottlePivot.y * 100}%`
    goulotRepos = { x: gauche + spout.x * l, y: haut + spout.y * h }
    pivot = { x: gauche + bottlePivot.x * l, y: haut + bottlePivot.y * h }

    // Moteur : le plus grand carré qui tient dans sa zone, centré.
    const zm = HERO.zones[format].moteur
    const cote = Math.min(zm.l * ecran.l, zm.h * ecran.h)
    carre = { x0: zm.x * ecran.l + (zm.l * ecran.l - cote) / 2, y0: zm.y * ecran.h + (zm.h * ecran.h - cote) / 2, cote }
    centreMoteur = { x: carre.x0 + cote / 2, y: carre.y0 + cote / 2 }
    Object.assign(moteur.style, { left: `${carre.x0}px`, top: `${carre.y0}px`, width: `${cote}px`, height: `${cote}px` })
    const orifice = modeIA ? IA.filler : M.filler
    filler = { x: carre.x0 + orifice.x * cote, y: carre.y0 + orifice.y * cote }

    // Arrivée du goulot en fin de bascule.
    const cible = HERO.ancres.cibleGoulot
    const arrivee =
      format === 'mobile'
        ? { x: filler.x, y: cible.mobile.y * ecran.h }
        : { x: cible.desktop.x * ecran.l, y: cible.desktop.y * ecran.h }
    const goulotBascule = tournerAutour(goulotRepos, pivot, HERO.angleVersement)
    deplacement = { x: arrivee.x - goulotBascule.x, y: arrivee.y - goulotBascule.y }
  }

  // ── Filet d'huile (canvas) ────────────────────────────────────────────────
  const courbe = (a: Pt, b: Pt, t: number): Pt => {
    // Mobile : chute verticale. Desktop : départ horizontal puis chute (parabole).
    const c = format === 'mobile' ? { x: a.x, y: (a.y + b.y) / 2 } : { x: (a.x + b.x) / 2, y: a.y }
    const u = 1 - t
    return { x: u * u * a.x + 2 * u * t * c.x + t * t * b.x, y: u * u * a.y + 2 * u * t * c.y + t * t * b.y }
  }

  function dessinerFilet(goulot: Pt, debut: number, fin: number, temps: number) {
    if (!ctxFilet) return
    ctxFilet.clearRect(0, 0, canvasFilet.width, canvasFilet.height)
    if (fin - debut <= 0.001) return
    ctxFilet.save()
    ctxFilet.scale(dpr, dpr)
    ctxFilet.beginPath()
    for (let k = 0; k <= 24; k++) {
      const p = courbe(goulot, filler, mix(debut, fin, k / 24))
      if (k === 0) ctxFilet.moveTo(p.x, p.y)
      else ctxFilet.lineTo(p.x, p.y)
    }
    const degrade = ctxFilet.createLinearGradient(goulot.x, goulot.y, filler.x, filler.y)
    degrade.addColorStop(0, HERO.couleurs.huile[0])
    degrade.addColorStop(1, HERO.couleurs.huile[1])
    ctxFilet.lineCap = 'round'
    ctxFilet.lineWidth = format === 'mobile' ? 6 : 8
    ctxFilet.strokeStyle = degrade
    ctxFilet.stroke()
    // Reflet qui défile vers le bas (fixe sur le palier lite).
    ctxFilet.lineWidth = 2
    ctxFilet.strokeStyle = HERO.couleurs.refletHuile
    ctxFilet.globalAlpha = 0.75
    ctxFilet.setLineDash([14, 26])
    ctxFilet.lineDashOffset = HERO.paliers[palier].refletAnime ? -temps * 0.15 : 0
    ctxFilet.stroke()
    ctxFilet.restore()
  }

  // ── Rendu ──────────────────────────────────────────────────────────────────
  let progression = 0
  let filetVisible = false
  let imageFiletPresente = false // le canvas du filet contient encore un dessin à effacer

  function lireProgression() {
    const r = racine.getBoundingClientRect()
    const course = r.height - ecran.h
    progression = course > 0 ? borner(-r.top / course) : 0
  }

  function rendre(temps: number) {
    const p = progression

    for (const b of blocs) {
      const o = opaciteBloc(p, b.debut, b.fin)
      b.el.style.opacity = String(o)
      b.el.style.transform = `translate3d(0, ${(1 - o) * 12}px, 0)`
      const actif = o > 0.5
      if (actif !== b.actif) {
        // Bloc caché = hors du parcours clavier (liens de la fin invisibles sinon focusables).
        b.actif = actif
        b.el.toggleAttribute('data-actif', actif)
        b.el.inert = !actif
      }
    }

    // t1 : l'huile monte dans le bidon, jusque sous l'épaule (32 % du cadre).
    if (niveau) niveau.style.transform = `translate3d(0, ${mix(100, 32, doux(local(p, T1.debut, T1.fin)))}%, 0)`

    // t2 : le bouchon saute, le bidon bascule et se place au-dessus de l'orifice.
    const t2 = local(p, T2.debut, T2.fin)
    const t3 = local(p, T3.debut, T3.fin)
    const sautBouchon = doux(local(t2, 0, 0.2))
    if (bouchon) {
      const d = hauteurBidon * sautBouchon
      bouchon.style.transform = `translate3d(${d * 0.12}px, ${-d * 0.35}px, 0) rotate(${sautBouchon * 35}deg)`
      bouchon.style.opacity = String(1 - sautBouchon)
    }
    const bascule = mouvementReduit ? 0 : doux(local(t2, 0.15, 0.7))
    const sortie = mouvementReduit ? local(t2, 0, 0.5) : local(t3, 0.1, 0.25)
    bidon.style.transform = `translate3d(${deplacement.x * bascule}px, ${deplacement.y * bascule}px, 0) rotate(${HERO.angleVersement * bascule}deg)`
    bidon.style.opacity = String(1 - sortie)

    // Filet : naît en fin de bascule, se détache du goulot au début de t3.
    const tete = mouvementReduit ? 0 : local(t2, 0.7, 0.9)
    const queue = local(t3, 0.05, 0.25)
    filetVisible = tete > queue && bascule > 0
    if (filetVisible || imageFiletPresente) {
      const g = tournerAutour(goulotRepos, pivot, HERO.angleVersement * bascule)
      dessinerFilet({ x: g.x + deplacement.x * bascule, y: g.y + deplacement.y * bascule }, queue, tete, temps)
      imageFiletPresente = filetVisible
    }

    // t3 : le moteur s'ouvre, tourne, et l'huile le lubrifie pièce par pièce.
    if (modeIA) {
      imagesIA[1].style.opacity = String(doux(local(t3, IA.fondus.e2[0], IA.fondus.e2[1])))
      imagesIA[2].style.opacity = String(doux(local(t3, IA.fondus.e3[0], IA.fondus.e3[1])))
    } else {
      animerMoteur(svgMoteur, {
        angle: mouvementReduit ? 0 : t3 * M.tours * 360,
        coupe: local(t3, M.coupe[0], M.coupe[1]),
        huileCames: local(t3, M.huile.cames[0], M.huile.cames[1]),
        huilePistons: local(t3, M.huile.pistons[0], M.huile.pistons[1]),
        huileVilebrequin: local(t3, M.huile.vilebrequin[0], M.huile.vilebrequin[1]),
      })
    }
    const c = mouvementReduit ? cadrages[0] : cadrageA(t3, cadrages)
    const { tx, ty, s } = transformCadrage(c, carre, centreMoteur)
    moteur.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${s})`
    // Écran de fin : le moteur s'efface derrière les produits.
    moteur.style.opacity = String(1 - 0.75 * local(p, FIN.debut - 0.02, FIN.debut + 0.02))
  }

  // ── Boucle : rendu à la demande, garde-fou de performance ─────────────────
  let rafEnAttente = false
  let dernierTemps = 0
  let echantillons: { t: number; d: number }[] = []

  function demanderRendu() {
    if (rafEnAttente) return
    rafEnAttente = true
    requestAnimationFrame(image)
  }

  function image(temps: number) {
    rafEnAttente = false
    const ecart = temps - dernierTemps
    dernierTemps = temps
    if (ecart < 100) surveiller(temps, ecart) // seules les images consécutives comptent
    lireProgression()
    rendre(temps)
    if (filetVisible && HERO.paliers[palier].refletAnime) demanderRendu() // le reflet défile
  }

  function surveiller(temps: number, ecart: number) {
    if (palier === 'lite' || forcage) return // ?tier= : palier imposé (tests, démonstration)
    echantillons.push({ t: temps, d: ecart })
    while (echantillons.length && temps - echantillons[0].t > HERO.gardeFou.dureeMs) echantillons.shift()
    const couvert = echantillons.length > 1 ? temps - echantillons[0].t : 0
    const moyenne = echantillons.reduce((s, e) => s + e.d, 0) / echantillons.length
    if (couvert >= HERO.gardeFou.dureeMs * 0.9 && moyenne > HERO.gardeFou.msParImage) {
      palier = palierInferieur(palier)
      racine.dataset.palier = palier
      echantillons = []
      console.info(`[hero] rendu trop lent (${moyenne.toFixed(1)} ms/image) → palier ${palier}`)
      mesurer()
    }
  }

  // ── Démarrage ──────────────────────────────────────────────────────────────
  racine.dataset.palier = palier
  racine.dataset.pret = ''
  mesurer()
  lireProgression()
  rendre(0)
  addEventListener('scroll', demanderRendu, { passive: true })

  let minuterie = 0
  addEventListener('resize', () => {
    clearTimeout(minuterie)
    minuterie = window.setTimeout(() => {
      mesurer()
      demanderRendu()
    }, 150)
  })
}
