/**
 * noyau.ts — moteur commun des heros vidéo mobile et desktop.
 *
 * Chaque format a son composant (HeroMobile.astro / HeroDesktop.astro), son point
 * d'entrée (mobile.ts / desktop.ts) et ses réglages (hero-video.config.ts) ; ce
 * fichier ne contient que ce qui est identique : textes, bidon, filet, étiquettes,
 * séquence.
 *
 * Déroulé (HERO.temps) : l'huile monte dans le bidon debout (t1) ; le bouchon saute,
 * le bidon, à gauche du moteur, se penche et verse un filet en chute libre dans
 * l'orifice (t2) ; pendant t3 la séquence montre l'huile qui descend dans le moteur en
 * coupe (cames, pistons, vilebrequin), le filet se tarit, le bidon se redresse et
 * s'efface, et chaque pièce reçoit son étiquette quand l'huile l'atteint.
 *
 *  - un seul écouteur de scroll passif, rendu dans requestAnimationFrame ;
 *  - DOM : on n'écrit que opacity et transform (tailles et positions au redimensionnement) ;
 *  - séquence : chargée après l'événement load, une image sur 4 d'abord, puis le reste ;
 *    seules les images proches de l'image courante restent décodées (ImageBitmap) ;
 *  - palier lite (économie de données, 2G/3G, ≤ 2 Go, mouvement réduit) : deux images
 *    seulement (moteur sec, moteur huilé), en fondu.
 */
import { APPARITIONS_REPERES, dansImage, MOTEUR, PLANS_T3, type ReglagesHeroVideo } from '@/hero-video.config'
import { HERO } from '@/hero.config'
import { borner, doux, local, mix, opaciteBloc } from '@/lib/hero-timeline'
import { caler, couverture, type Couverture, indexImage, ordreChargement, plusProche, pointCouvert } from '@/lib/sequence-images'
import {
  angleDebut,
  ballottement,
  BEC_ARRIERE,
  BEC_AVANT,
  directionFilet,
  type GeometrieBidon,
  placerGoulot,
  poseBidon,
  type Pt,
  tableVersement,
  tourner,
  vitesseSortie,
} from '@/lib/versement'

type NavigatorEtendu = Navigator & {
  connection?: { saveData?: boolean; effectiveType?: string }
  deviceMemory?: number
}

const plage = (id: string) => HERO.temps.find((t) => t.id === id)!
const T1 = plage('t1')
const T2 = plage('t2')
const T3 = plage('t3')
const FIN = plage('fin')
/** Images gardées décodées autour de l'image courante (avant, après). */
const FENETRE = { avant: 4, apres: 8 }
/** Fin de la séquence dans t3 (ensuite : dernière image, tout est huilé). */
const FIN_SEQUENCE = PLANS_T3[PLANS_T3.length - 1][1]
/**
 * Versement naturel (spec du 29/09, lib/versement.ts) : la séquence du bidon va de juste
 * après le saut du bouchon à son retour, en progression globale. La physique (chute du
 * filet, ballottement) tourne en « secondes simulées » : DUREE pour toute la séquence.
 */
const SEQUENCE_BIDON = [0.37, 0.72] as const
const DUREE = 4
/** Hauteur réelle du bidon de 1 L (m) : échelle pixels ↔ mètres. */
const HAUTEUR_REELLE = 0.25
const G = 9.81
/** Remplissage du bidon : après la montée (t1), puis quand il a versé. */
const REMPLISSAGE = { plein: 0.68, verse: 0.4 }
/** Poignée du bidon (fractions de la photo) : la main le lève par là. */
const POIGNEE = { x: 0.8, y: 0.17 }
/** Couleurs de l'huile neuve, accordées à l'huile du moteur : corps doré, cœur clair, reflet, bord sombre (Fresnel). */
const TEINTES = { corps: '#d9951f', coeur: '#f6c85a', reflet: '#fff1c2', bord: 'rgb(138 75 10 / 0.6)' }

export function lancerHeroVideo(racine: HTMLElement, R: ReglagesHeroVideo): void {
  const scene = racine.querySelector<HTMLElement>('[data-scene]')!
  const canvasMoteur = racine.querySelector<HTMLCanvasElement>('[data-sequence]')!
  const canvasFilet = racine.querySelector<HTMLCanvasElement>('[data-filet]')!
  const bidon = racine.querySelector<HTMLElement>('[data-bidon-hero]')!
  const niveau = bidon.querySelector<HTMLElement>('[data-niveau]')
  const menisque = bidon.querySelector<HTMLElement>('[data-menisque]')
  const lumiere = bidon.querySelector<HTMLElement>('[data-lumiere]')
  const bouchon = bidon.querySelector<HTMLElement>('[data-bouchon]')
  const aspectBidon = Number(bidon.dataset.aspect ?? 0.64)
  const blocs = [...racine.querySelectorAll<HTMLElement>('[data-bloc]')].map((el) => ({
    el,
    debut: Number(el.dataset.debut),
    fin: Number(el.dataset.fin),
    actif: el.hasAttribute('data-actif'),
  }))
  const colonne = R.reperes === 'colonne'
  const aDroite = R.etiquettes === 'droite'
  const reperes = [...racine.querySelectorAll<HTMLElement>('[data-repere]')].map((el, i) => ({
    el,
    point: el.querySelector<HTMLElement>('[data-point]')!,
    trait: el.querySelector<HTMLElement>('[data-trait]')!,
    etiquette: el.querySelector<HTMLElement>('[data-etiquette]')!,
    apparition: APPARITIONS_REPERES[i],
    ancre: { x: 0, y: 0 },
    etiquetteX: 0,
    traitX: 0,
  }))
  // Façon de verser (goulot devant ou derrière) et état du versement pour tout u, intégré une fois.
  const PROFIL = R.bec === 'avant' ? BEC_AVANT : BEC_ARRIERE
  const VERSEMENT = tableVersement(REMPLISSAGE.plein, REMPLISSAGE.verse, PROFIL)
  const ctxMoteur = canvasMoteur.getContext('2d')!
  const ctxFilet = canvasFilet.getContext('2d')!
  const mouvementReduit = matchMedia('(prefers-reduced-motion: reduce)').matches

  // ── Palier : séquence complète, ou deux images en fondu ────────────────────
  const nav = navigator as NavigatorEtendu
  const forcage = new URLSearchParams(location.search).get(HERO.parametreForcage)
  const leger =
    forcage === 'lite' ||
    (!forcage &&
      (mouvementReduit ||
        !!nav.connection?.saveData ||
        /(^|-)(2g|3g)$/.test(nav.connection?.effectiveType ?? '') ||
        (R.nom === 'mobile' && (nav.deviceMemory ?? 4) <= 2)))
  racine.dataset.palier = leger ? 'lite' : 'sequence'

  // ── Séquence d'images ──────────────────────────────────────────────────────
  const S = R.sequence
  const total = S.images
  const url = (i: number) => `${S.dossier}/${String(i).padStart(3, '0')}.webp?v=${S.version}`
  const images: (HTMLImageElement | null)[] = Array(total).fill(null)
  const chargees = new Set<number>()
  const bitmaps = new Map<number, ImageBitmap>()
  const decodage = new Set<number>()
  let courante = 0

  function charger(i: number): Promise<void> {
    return new Promise((resolu) => {
      const img = new Image()
      img.decoding = 'async'
      img.onload = () => {
        images[i] = img
        chargees.add(i)
        if (Math.abs(i - courante) <= FENETRE.apres) garderDecodees()
        demanderRendu()
        resolu()
      }
      img.onerror = () => resolu() // image manquante : on dessine la plus proche
      img.src = url(i)
    })
  }

  async function chargerTout(ordre: number[]) {
    let suivant = 0
    const ouvrier = async () => {
      while (suivant < ordre.length) await charger(ordre[suivant++])
    }
    await Promise.all(Array.from({ length: S.parallele }, ouvrier))
  }

  /** Décode les images autour de la courante, libère les autres. */
  function garderDecodees() {
    const min = courante - FENETRE.avant
    const max = courante + FENETRE.apres
    for (const [i, b] of bitmaps) {
      if (i < min || i > max) {
        b.close()
        bitmaps.delete(i)
      }
    }
    for (let i = Math.max(0, min); i <= Math.min(total - 1, max); i++) {
      const img = images[i]
      if (!img || bitmaps.has(i) || decodage.has(i)) continue
      decodage.add(i)
      createImageBitmap(img)
        .then((b) => {
          decodage.delete(i)
          if (i < courante - FENETRE.avant || i > courante + FENETRE.apres) return b.close()
          bitmaps.set(i, b)
          if (i === courante) demanderRendu()
        })
        .catch(() => decodage.delete(i))
    }
  }

  // ── Géométrie (recalculée au redimensionnement) ────────────────────────────
  let ecran = { l: 0, h: 0 }
  let boite = { x: 0, y: 0, l: 0, h: 0 } // canvas de la séquence, dans la scène
  let dpr = 1
  let couv: Couverture = { x: 0, y: 0, l: 0, h: 0 }
  let orifice: Pt = { x: 0, y: 0 }
  let geo: GeometrieBidon = { pivot: { x: 0, y: 0 }, goulot: { x: 0, y: 0 }, poignee: { x: 0, y: 0 }, hauteur: 1, goulotVerse: { x: 0, y: 0 } }
  let hauteurBidon = 0
  /** Pixels par mètre, gravité en px/s² (le bidon mesure 25 cm). */
  let ppm = 1
  let gpx = G

  function dimensionner(c: HTMLCanvasElement, echelle: number, taille = ecran) {
    const l = Math.round(taille.l * echelle)
    const h = Math.round(taille.h * echelle)
    if (c.width !== l) c.width = l
    if (c.height !== h) c.height = h
  }

  /** Point de la vidéo source → position dans la scène (px). */
  const aLEcran = (p: Pt): Pt => {
    const q = pointCouvert(dansImage(p, S.recadrage), couv)
    return { x: boite.x + q.x, y: boite.y + q.y }
  }

  function mesurer() {
    ecran = { l: scene.clientWidth, h: scene.clientHeight }
    const zm = R.zones.moteur
    boite = { x: zm.x * ecran.l, y: zm.y * ecran.h, l: zm.l * ecran.l, h: zm.h * ecran.h }
    Object.assign(canvasMoteur.style, { left: `${boite.x}px`, top: `${boite.y}px`, width: `${boite.l}px`, height: `${boite.h}px` })
    const image = { l: S.largeur, h: S.hauteur }
    const bordCale = S.cale?.bord === 'gauche' ? MOTEUR.bordGauche : MOTEUR.bordDroit
    couv = S.cale
      ? caler(image, boite, S.zoom, S.focale.y, dansImage({ x: bordCale, y: 0 }, S.recadrage).x, S.cale.x)
      : couverture(image, boite, S.focale.x, S.focale.y, S.zoom)
    // Jamais plus défini que l'image source : inutile de peindre des pixels inventés.
    dpr = Math.min(devicePixelRatio || 1, S.dprMax, Math.max(1, S.largeur / couv.l))
    dimensionner(canvasMoteur, dpr, boite)
    dimensionner(canvasFilet, Math.min(devicePixelRatio || 1, 2))
    orifice = aLEcran(MOTEUR.orifice)

    // Bidon debout, sur le côté. Pendant le versement, son goulot se tient au-dessus de
    // l'orifice, décalé de son côté, là où le filet, à plein débit, tombe dans l'orifice.
    const zb = R.zones.bidon
    const h = zb.h * ecran.h
    const l = h * aspectBidon
    hauteurBidon = h
    ppm = h / HAUTEUR_REELLE
    gpx = G * ppm
    const gauche = zb.x * ecran.l + (zb.l * ecran.l - l) / 2
    const haut = zb.y * ecran.h
    Object.assign(bidon.style, { left: `${gauche}px`, top: `${haut}px`, width: `${l}px`, height: `${h}px` })
    const { spout, bottlePivot } = HERO.ancres.bidon
    bidon.style.transformOrigin = `${bottlePivot.x * 100}% ${bottlePivot.y * 100}%`
    const pivot = { x: gauche + bottlePivot.x * l, y: haut + bottlePivot.y * h }
    const goulot = { x: gauche + spout.x * l, y: haut + spout.y * h }
    const chute = R.chuteFilet * h
    const d = directionFilet((PROFIL.sens * (PROFIL.debutVersement + PROFIL.finVersement)) / 2, 1)
    const v0 = vitesseSortie(1) * ppm
    const t = (-d.y * v0 + Math.sqrt((d.y * v0) ** 2 + 2 * gpx * chute)) / gpx
    const voulu = { x: orifice.x - d.x * v0 * t, y: orifice.y - chute }
    const angleMax = PROFIL.sens * PROFIL.finVersement
    const versPivot = tourner({ x: pivot.x - goulot.x, y: pivot.y - goulot.y }, angleMax)
    const goulotVerse = placerGoulot({
      orifice,
      cible: { x: (voulu.x - orifice.x) / h, y: (voulu.y - orifice.y) / h },
      bidon: { l, h },
      goulotVersPivot: versPivot,
      angle: angleMax,
      gauche: 8,
      droite: ecran.l - 8,
      haut: R.zones.entete.h * ecran.h * 0.7,
    })
    geo = { pivot, goulot, poignee: { x: gauche + POIGNEE.x * l, y: haut + POIGNEE.y * h }, hauteur: h, goulotVerse }

    // Étiquettes : point sur la pièce, trait, étiquette. Colonne : à côté du moteur, du
    // côté R.etiquettes ; pastille : collée au point, de ce côté-là.
    const bord = aLEcran({ x: aDroite ? MOTEUR.bordDroit : MOTEUR.bordGauche, y: 0 }).x
    for (const [i, r] of reperes.entries()) {
      r.ancre = aLEcran(MOTEUR.pieces[i])
      const largeur = r.etiquette.offsetWidth
      const x = colonne ? bord : r.ancre.x
      const ecart = colonne ? 28 : 14
      r.etiquetteX = aDroite ? Math.min(ecran.l - largeur - 16, x + ecart) : Math.max(16, x - ecart - largeur)
      // Le trait va du point au bord de l'étiquette le plus proche.
      r.traitX = aDroite ? r.ancre.x : r.etiquetteX + largeur
      r.trait.style.width = `${Math.max(0, aDroite ? r.etiquetteX - r.ancre.x : r.ancre.x - r.traitX)}px`
      r.trait.style.transformOrigin = aDroite ? '0 50%' : '100% 50%'
      r.point.style.transform = `translate3d(${r.ancre.x}px, ${r.ancre.y}px, 0)`
    }
    derniereDessinee = -1
  }

  // ── Dessin du moteur ───────────────────────────────────────────────────────
  let derniereDessinee = -1
  let dernierFondu = -1
  let affichePresente = true

  function peindre(source: CanvasImageSource, alpha = 1) {
    if (alpha === 1 && S.zoom < 1) {
      ctxMoteur.fillStyle = '#000'
      ctxMoteur.fillRect(0, 0, canvasMoteur.width, canvasMoteur.height)
    }
    ctxMoteur.globalAlpha = alpha
    ctxMoteur.drawImage(source, couv.x * dpr, couv.y * dpr, couv.l * dpr, couv.h * dpr)
    ctxMoteur.globalAlpha = 1
    if (affichePresente) {
      // Le canvas a pris le relais : l'affiche CSS ne doit plus transparaître quand
      // le moteur s'assombrit à la fin.
      canvasMoteur.style.backgroundImage = 'none'
      affichePresente = false
    }
  }

  function dessinerMoteur(t3: number) {
    if (leger) {
      // Deux images : moteur sec, puis moteur huilé, en fondu pendant t3.
      const f = Math.round(doux(local(t3, 0.1, 0.9)) * 100) / 100
      if (f === dernierFondu) return
      const debut = images[0]
      const fin = images[total - 1]
      if (!debut) return
      ctxMoteur.fillStyle = '#000'
      ctxMoteur.fillRect(0, 0, canvasMoteur.width, canvasMoteur.height)
      peindre(debut)
      if (fin && f > 0) peindre(fin, f)
      dernierFondu = f
      return
    }
    // Petit décalage : l'huile apparaît sur les cames juste après que le filet est entré.
    courante = indexImage(local(t3, 0.05, FIN_SEQUENCE), total)
    garderDecodees()
    const i = plusProche(courante, (k) => bitmaps.has(k) || chargees.has(k), total)
    if (i === null || i === derniereDessinee) return
    const source = bitmaps.get(i) ?? images[i]
    if (!source) return
    peindre(source)
    derniereDessinee = i
  }

  // ── Filet d'huile : chaque parcelle suit sa propre chute libre ──────────────
  // Une parcelle émise à l'instant te part du goulot tel qu'il était à te, dans la
  // direction du col (rabattue vers le bas quand le débit faiblit), puis tombe. Tout est
  // calculé depuis u : la tête tombe en premier, le filet s'affine en accélérant, la queue
  // se détache quand le débit s'arrête, et le scroll arrière rembobine.
  const echelleFilet = () => canvasFilet.width / Math.max(1, ecran.l)
  /** Âge maximal d'une parcelle (s) et nombre d'échantillons le long du filet. */
  const AGE_MAX = 0.4
  const ECHANTILLONS = 44

  interface Parcelle {
    p: Pt
    largeur: number
    debit: number
    arrivee: boolean
    /** Instant d'émission (u). */
    ue: number
  }

  /** Parcelle émise il y a `age` secondes, vue à l'instant u (null : pas d'huile, ou déjà entrée). */
  function parcelle(u: number, age: number): Parcelle | null {
    const ue = u - age / DUREE
    if (ue < 0 || ue > 1) return null
    const f = VERSEMENT(ue).debit
    if (f <= 0) return null
    const pose = poseBidon(ue, geo, PROFIL)
    const dir = directionFilet(pose.angle, f)
    const v0 = vitesseSortie(f) * ppm
    const vy = dir.y * v0
    // Instant où elle atteint le fond visible du goulot (un peu sous son centre) ; au-delà, elle est entrée.
    const fond = orifice.y + 0.012 * hauteurBidon
    const aSol = (-vy + Math.sqrt(vy * vy + 2 * gpx * Math.max(0, fond - pose.goulot.y))) / gpx
    if (age > aSol) return null
    const x0 = pose.goulot.x + dir.x * v0 * aSol
    // Petite correction d'entonnoir sur la fin de la chute : l'huile entre toujours pile.
    const k = (age / aSol) ** 2
    const p = {
      x: pose.goulot.x + dir.x * v0 * age + (orifice.x - x0) * k,
      y: pose.goulot.y + vy * age + 0.5 * gpx * age * age,
    }
    const v = Math.hypot(dir.x * v0, vy + gpx * age)
    // Goulot devant : l'air rentre par à-coups (« glouglou ») et le débit pulse un peu ;
    // la pulsation est liée à l'instant d'émission, elle descend donc le long du filet.
    const glouglou = PROFIL.sens < 0 ? 1 + 0.1 * Math.sin(2 * Math.PI * 6 * ue * DUREE) : 1
    return { p, largeur: 0.05 * hauteurBidon * Math.sqrt(f) * Math.sqrt(v0 / v) * glouglou, debit: f, arrivee: age > aSol * 0.97, ue }
  }

  function tracerRuban(points: Parcelle[], echelle: number, style: string, alpha: number, decalage = 0) {
    if (points.length < 2) return
    const g: Pt[] = []
    const d: Pt[] = []
    for (let k = 0; k < points.length; k++) {
      const a = points[Math.max(0, k - 1)].p
      const b = points[Math.min(points.length - 1, k + 1)].p
      const n = Math.hypot(b.x - a.x, b.y - a.y) || 1
      // Normale tournée vers la gauche (côté lampe).
      let nx = -(b.y - a.y) / n
      let ny = (b.x - a.x) / n
      if (nx > 0) {
        nx = -nx
        ny = -ny
      }
      const c = points[k].p
      const demi = (points[k].largeur * echelle) / 2
      const cx = c.x + nx * decalage * points[k].largeur
      const cy = c.y + ny * decalage * points[k].largeur
      g.push({ x: cx + nx * demi, y: cy + ny * demi })
      d.push({ x: cx - nx * demi, y: cy - ny * demi })
    }
    ctxFilet.beginPath()
    g.forEach((p, k) => (k === 0 ? ctxFilet.moveTo(p.x, p.y) : ctxFilet.lineTo(p.x, p.y)))
    for (let k = d.length - 1; k >= 0; k--) ctxFilet.lineTo(d[k].x, d[k].y)
    ctxFilet.closePath()
    ctxFilet.globalAlpha = alpha
    ctxFilet.fillStyle = style
    ctxFilet.fill()
  }

  /** Dessine le filet et les gouttes ; renvoie true s'il y avait quelque chose à dessiner. */
  function dessinerFilet(u: number, temps: number): boolean {
    ctxFilet.clearRect(0, 0, canvasFilet.width, canvasFilet.height)
    ctxFilet.save()
    ctxFilet.scale(echelleFilet(), echelleFilet())
    let dessine = false

    // Ruban (débit suffisant) ; en dessous, perles sur un fil.
    const runs: Parcelle[][] = [[]]
    const perles: Parcelle[] = []
    let arrivee: Parcelle | null = null
    for (let i = 0; i <= ECHANTILLONS; i++) {
      const q = parcelle(u, (i / ECHANTILLONS) * AGE_MAX)
      if (!q) {
        if (runs[runs.length - 1].length) runs.push([])
        continue
      }
      if (q.arrivee && (!arrivee || q.debit > arrivee.debit)) arrivee = q
      if (q.debit < 0.08) {
        // Perles seulement quand le débit s'éteint (coupure) ; au démarrage, le filet naît fin mais continu.
        if (q.ue > 0.7 && i % 2 === 0) perles.push(q)
        if (runs[runs.length - 1].length) runs.push([])
        continue
      }
      // Ondulation discrète, seulement dans le bas du filet (2 à 3 %).
      if (!leger && i > ECHANTILLONS * 0.35) q.largeur *= 1 + 0.025 * Math.sin(temps * 0.011 - i * 0.9)
      runs[runs.length - 1].push(q)
    }
    // Le filet naît sur la lèvre du goulot : il épouse le bord sur quelques pixels.
    const premier = runs[0][0]
    if (premier && Math.abs(premier.ue - u) < 1e-9) {
      const pose = poseBidon(u, geo, PROFIL)
      const dir = directionFilet(pose.angle, premier.debit)
      runs[0].unshift({ ...premier, p: { x: premier.p.x - dir.x * 0.025 * hauteurBidon, y: premier.p.y - dir.y * 0.025 * hauteurBidon } })
    }
    for (const run of runs) {
      if (run.length < 2) continue
      dessine = true
      // Profil d'un cylindre d'huile éclairé : bord sombre, corps ambre, cœur clair, reflet fixe.
      tracerRuban(run, 1.12, TEINTES.bord, 1)
      tracerRuban(run, 1, TEINTES.corps, 0.92)
      tracerRuban(run, 0.55, TEINTES.coeur, 0.9)
      tracerRuban(run, 0.12, TEINTES.reflet, 0.8 + (leger ? 0 : 0.015 * Math.sin(temps * 0.004)), -0.2)
    }
    ctxFilet.globalAlpha = 0.9
    ctxFilet.fillStyle = TEINTES.coeur
    for (const q of perles) {
      dessine = true
      ctxFilet.beginPath()
      ctxFilet.arc(q.p.x, q.p.y, Math.max(0.8, 0.045 * hauteurBidon * Math.sqrt(q.debit)), 0, Math.PI * 2)
      ctxFilet.fill()
    }
    // Pied brillant là où l'huile entre dans l'orifice.
    if (arrivee && arrivee.debit >= 0.08) {
      const w = arrivee.largeur
      ctxFilet.globalAlpha = 0.85
      ctxFilet.fillStyle = TEINTES.coeur
      ctxFilet.beginPath()
      ctxFilet.ellipse(orifice.x, orifice.y + 0.012 * hauteurBidon, 0.8 * w, Math.max(1.5, 0.012 * hauteurBidon), 0, 0, Math.PI * 2)
      ctxFilet.fill()
      ctxFilet.fillStyle = TEINTES.reflet
      ctxFilet.globalAlpha = 0.7
      ctxFilet.beginPath()
      ctxFilet.ellipse(orifice.x - 0.25 * w, orifice.y + 0.012 * hauteurBidon - 0.3, 0.3 * w, 0.7, 0, 0, Math.PI * 2)
      ctxFilet.fill()
    }

    ctxFilet.restore()
    return dessine
  }

  // ── Rendu ──────────────────────────────────────────────────────────────────
  let progression = 0
  let filetVisible = false
  let filetPresent = false

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
        b.actif = actif
        b.el.toggleAttribute('data-actif', actif)
        b.el.inert = !actif // bloc caché = hors du parcours clavier
      }
    }

    const t2 = local(p, T2.debut, T2.fin)
    const t3 = local(p, T3.debut, T3.fin)
    const disparition = local(p, FIN.debut - 0.02, FIN.debut + 0.005)

    // Bouchon : il saute, monte un peu en tournant, repart sur la gauche et s'efface.
    const saut = doux(local(t2, 0, 0.15))
    if (bouchon) {
      const h = hauteurBidon
      // Il part du côté opposé au moteur.
      const s = -PROFIL.sens
      bouchon.style.transform = `translate3d(${s * 0.26 * h * saut}px, ${-0.13 * h * Math.sin(Math.PI * 0.8 * saut)}px, 0) rotate(${s * 20 * saut}deg)`
      bouchon.style.opacity = String(1 - local(saut, 0.55, 1))
    }

    // Bidon : la main le lève par la poignée, l'incline au-dessus de l'orifice en gardant
    // le goulot presque immobile, verse, coupe d'un geste, puis l'emporte vers le haut.
    const u = mouvementReduit ? 0 : local(p, SEQUENCE_BIDON[0], SEQUENCE_BIDON[1])
    const pose = poseBidon(u, geo, PROFIL)
    bidon.style.transform = `translate3d(${pose.translation.x}px, ${pose.translation.y}px, 0) rotate(${pose.angle}deg)`
    // Il s'efface pendant sa sortie, avant de passer sous l'en-tête ou le bord de l'écran.
    const effacement = mouvementReduit ? disparition : Math.max(disparition, local(u, 0.83, 0.95))
    bidon.style.opacity = String(1 - effacement)

    // Huile dans le bidon : surface horizontale (contre-rotation) qui monte en t1, rejoint
    // le goulot quand il penche, reste juste au-dessus tant que l'huile coule, puis
    // retombe au niveau de ce qui reste ; elle ballotte après chaque arrêt du geste.
    if (niveau) {
      const pivotY = HERO.ancres.bidon.bottlePivot.y
      const etat = VERSEMENT(u)
      const remplissage = u > 0 ? etat.remplissage : mix(0, REMPLISSAGE.plein, doux(local(p, T1.debut, T1.fin)))
      const debout = 1 - remplissage - pivotY
      const goulotY = tourner({ x: geo.goulot.x - geo.pivot.x, y: geo.goulot.y - geo.pivot.y }, pose.angle).y / hauteurBidon
      const surface =
        etat.debit > 0
          ? goulotY - 0.01 - 0.03 * etat.debit
          : mix(debout, goulotY - 0.01, doux(borner(Math.abs(pose.angle) / angleDebut(remplissage, PROFIL))))
      const phi = mouvementReduit || u <= 0 || u >= 1 ? 0 : ballottement(u, DUREE, PROFIL)
      const t = `rotate(${-pose.angle + phi}deg) translate3d(0, ${surface * hauteurBidon}px, 0)`
      niveau.style.transform = t
      if (menisque) menisque.style.transform = t
    }
    // Lumière du studio fixée au monde : le haut du bidon reste éclairé quoi qu'il fasse.
    if (lumiere) lumiere.style.transform = `rotate(${-pose.angle}deg)`

    // Filet et gouttes.
    const actif = !mouvementReduit && u > 0.3 && u < 1
    filetVisible = actif && dessinerFilet(u, temps)
    if (!filetVisible && filetPresent) ctxFilet.clearRect(0, 0, canvasFilet.width, canvasFilet.height)
    filetPresent = filetVisible

    // Étiquettes : chaque pièce s'allume quand l'huile l'atteint ; la précédente s'efface à moitié.
    for (const [i, r] of reperes.entries()) {
      const suivante = reperes[i + 1]
      const arrivee = local(t3, r.apparition, r.apparition + 0.02)
      const estompe = suivante ? local(t3, suivante.apparition, suivante.apparition + 0.04) : 0
      r.el.style.opacity = String(arrivee * (1 - 0.5 * estompe) * (1 - disparition))
      const trait = doux(local(t3, r.apparition, r.apparition + 0.035))
      r.trait.style.transform = `translate3d(${r.traitX}px, ${r.ancre.y}px, 0) scaleX(${trait})`
      const o = local(t3, r.apparition + 0.02, r.apparition + 0.06)
      r.etiquette.style.opacity = String(o)
      r.etiquette.style.transform = `translate3d(${r.etiquetteX + (1 - o) * (aDroite ? 12 : -12)}px, ${r.ancre.y}px, 0)`
    }

    dessinerMoteur(t3)
    // Écran de fin : le moteur s'assombrit derrière les produits.
    canvasMoteur.style.opacity = String(1 - 0.7 * local(p, FIN.debut - 0.02, FIN.debut + 0.02))
  }

  let rafEnAttente = false
  function demanderRendu() {
    if (rafEnAttente) return
    rafEnAttente = true
    requestAnimationFrame((temps) => {
      rafEnAttente = false
      lireProgression()
      rendre(temps)
      if (filetVisible && !leger) demanderRendu() // le filet ondule, le reflet défile
    })
  }

  // ── Démarrage ──────────────────────────────────────────────────────────────
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
      dernierFondu = -1
      demanderRendu()
    }, 150)
  })

  // Première image tout de suite (elle est l'affiche du hero), le reste après load.
  charger(0).then(() => {
    const suite = () => (leger ? charger(total - 1) : chargerTout(ordreChargement(total).filter((i) => i !== 0)))
    if (document.readyState === 'complete') suite()
    else addEventListener('load', suite, { once: true })
  })
}
