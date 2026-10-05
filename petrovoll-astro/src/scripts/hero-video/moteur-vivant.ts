/**
 * moteur-vivant.ts — le moteur tourne en temps réel, dessiné par le navigateur.
 *
 * La séquence d'images (pilotée par le scroll) ne montre que le moteur SANS ses pièces
 * mobiles. Ce module dessine par-dessus, à chaque image d'écran : vilebrequin 3D (Blender,
 * une image par 10°), bielles (fût étiré selon l'inclinaison, tête rigide), pistons, puis le
 * rebord du carter devant. Pièces : public/hero-video/pieces (ops/scripts/pieces_mobiles.py).
 *
 * Cinématique (vue de côté : tout monte et descend) : vilebrequin plat à 180°, pistons 1 et 4
 * ensemble, 2 et 3 opposés ; à θ = 0 les pistons sont à mi-course (pose de la photo K1).
 * Démarrage : démarreur (≈ 2,5 tr/s, à-coups des compressions), puis le moteur prend son
 * régime ; à l'arrêt, il ralentit et s'arrête sur une compression. Flou de mouvement : les
 * deux positions précédentes, en traînée.
 */
type Rect = [number, number, number, number]
type Disque = Place & { centreY: number; rayon: number }
export interface Place {
  atlas: [number, number, number, number]
  pos: [number, number]
}
export interface Pieces {
  version: string
  source: [number, number]
  rayon: number
  bielle: number
  axePied: number
  teteHaut: number
  cylindres: { piston: Place; fut: Place; tete: Place; phase: 'a' | 'b' }[]
  vilebrequin: Place[]
  avant: Place
  /** Arbre à cames (une image par 10° d'arbre), soupapes et came (ops/blender/distribution.py). */
  cames: Place[]
  soupapes: { x: number; cyl: number }[]
  poussoir: { atlas: Rect; dx: number; y: number }
  ressort: { atlas: Rect; dx: number; y: number; haut: number; bas: number }
  pontY: number
  teteSoupape: { atlas: Rect; dx: number; y: number; chambreY: number }
  /** Poulie de vilebrequin (vue de profil) : une bande de la photo, déroulée sur un cylindre. */
  poulie: Disque
  /** Carter de distribution de la photo, redessiné devant la chaîne. */
  cache: Place
  versionHuile: string
  /** Fond du carter : masque des cavités où la nappe d'huile se forme. */
  carter: Place & { niveauVide: number; niveauPlein: number }
  /** Huile versée : chute sous le goulot, filet le long de la paroi avant jusqu'au carter. */
  filets: { chute: { x: number; haut: number; bas: number }; paroi: { x: number; haut: number; bas: number } }
  /** Flasque du volant moteur (arrière), même principe. */
  volant: Disque
  /** Chaîne de distribution (vue de profil), du pignon de vilebrequin au pignon d'arbre à cames. */
  chaine: {
    x: number
    largeur: number
    came: { y: number; rayon: number }
    vilebrequin: { y: number; rayon: number }
    /** Fenêtre découpée dans le carter de distribution : seule partie visible de la chaîne. */
    fenetre: [number, number]
  }
  came: { base: number; levee: number; demiOuverture: number; beta: number[] }
}
/** Passage des pixels de la source retournée (1344×768) au canvas (pixels physiques). */
export interface Repere {
  x: (sx: number) => number
  y: (sy: number) => number
  echelle: number
}

const TOUR = 2 * Math.PI
/**
 * Régime de ralenti montré (tr/s). Un vrai ralenti (≈ 12 tr/s) se lirait mal à 60 images/s ;
 * à 7 tr/s, avec le flou de mouvement, on voit un moteur qui tourne vite, pas un ralenti filmé.
 */
const RALENTI = 7
const DEMARREUR = { duree: 0.8, vitesse: 2.4 }

/** θ (sur deux tours) où chaque cylindre (ordre de K1) est au PMH d'allumage : 1-3-4-2. */
const ALLUMAGE = [1.5, 4.5, 2.5, 3.5].map((k) => k * Math.PI)

/** Levée d'une soupape (px source) : nez de came tourné vers le bas (même formule que Blender). */
export function levee(theta: number, beta: number, came: Pieces['came']) {
  const nez = beta + theta / 2
  let phi = (nez + Math.PI / 2) % TOUR
  phi = ((phi + 3 * Math.PI) % TOUR) - Math.PI
  const ouverture = (came.demiOuverture * Math.PI) / 180
  return Math.abs(phi) < ouverture ? came.levee * Math.cos(((phi / ouverture) * Math.PI) / 2) ** 2 : 0
}

/** Course du piston et de la tête de bielle (px source, vers le bas > 0), échelle du fût. */
export function pose(theta: number, phase: 'a' | 'b', rayon: number, bielle: number) {
  const a = theta + (phase === 'a' ? Math.PI / 2 : -Math.PI / 2)
  const maneton = -rayon * Math.cos(a)
  const phi = Math.asin((rayon * Math.sin(a)) / bielle)
  const phi0 = Math.asin(rayon / bielle)
  const piston = maneton - (bielle * Math.cos(phi) - bielle * Math.cos(phi0))
  return { piston, maneton }
}

/** Simulation Mantaflow de l'huile (ops/blender/huile_fluide.py), en planches d'images. */
interface Fluide {
  version: string
  fps: number
  versement: { pos: [number, number]; taille: [number, number]; colonnes: number; images: number; boucle: [number, number] }
  carter: {
    pos: [number, number]
    taille: [number, number]
    colonnes: number
    calme: number
    boucle: [number, number]
    niveau: number
  }
}

export function creerMoteurVivant(url: string, reduit: boolean, echantillonsMax = 6, avecHuile = true, avecFluide = false) {
  let pieces: Pieces | null = null
  let atlas: ImageBitmap | null = null
  let theta = 0
  let omega = 0 // rad/s
  let enMarche = false
  let demarrage = -1 // instant (s) du démarreur, -1 : pas en cours
  let horloge = 0

  /** Pièces huilées (même disposition que l'atlas), chargées après lui. */
  let atlasHuile: ImageBitmap | null = null
  /**
   * Huile, pilotée par le scroll : `verse` débit du versement (0 → 1), `carter` remplissage du
   * fond, puis avancement de l'huile sous pression : `bas` (paliers, têtes de bielle),
   * `pistons` (projections sur les cylindres), `cames` (distribution).
   */
  const huile = { verse: 0, carter: 0, bas: 0, pistons: 0, cames: 0 }
  /** Gouttes en vol (px source) et rides à la surface de la nappe. */
  const gouttes: { x: number; y: number; vx: number; vy: number; r: number }[] = []
  const rides: { x: number; age: number }[] = []
  /** Goutte pendante sous chaque jupe de piston : grosseur (0 → 1) et position le long de la jupe. */
  const pendantes = [0, 1, 2, 3].map((i) => ({ g: (i * 0.27) % 1, dx: 0.3 + 0.13 * i }))
  let poolCanvas: HTMLCanvasElement | null = null
  /**
   * Huile simulée (Blender, palier « sequence ») : filet sous le goulot et nappe du carter.
   * Tant qu'elles ne sont pas chargées (ou sur les paliers légers), l'huile dessinée en 2D prend
   * le relais.
   */
  let fluide: Fluide | null = null
  let planVerse: ImageBitmap | null = null
  let planCarter: ImageBitmap | null = null
  let tempsVerse = 0
  /** Masque des cavités du carter, adouci une fois pour toutes (taille d'écran courante). */
  let masqueCarter: HTMLCanvasElement | null = null

  const pret = fetch(url.replace('atlas.webp', 'pieces.json'))
    .then((r) => r.json() as Promise<Pieces>)
    .then(async (p) => {
      const blob = await fetch(`${url}?v=${p.version}`).then((r) => r.blob())
      atlas = await createImageBitmap(blob)
      pieces = p
      if (avecHuile) {
        fetch(`${url.replace('atlas.webp', 'atlas-huile.webp')}?v=${p.versionHuile}`, { priority: 'low' } as RequestInit)
          .then((r) => r.blob())
          .then((b) => createImageBitmap(b))
          .then((b) => (atlasHuile = b))
          .catch(() => {})
      }
      if (avecFluide) {
        const base = url.replace('atlas.webp', '')
        fetch(`${base}fluide.json`, { priority: 'low' } as RequestInit)
          .then((r) => r.json() as Promise<Fluide>)
          .then(async (f) => {
            const charger = (nom: string) =>
              fetch(`${base}${nom}?v=${f.version}`, { priority: 'low' } as RequestInit)
                .then((r) => r.blob())
                .then((b) => createImageBitmap(b))
            ;[planVerse, planCarter] = await Promise.all([charger('fluide-versement.webp'), charger('fluide-carter.webp')])
            fluide = f
          })
          .catch(() => {})
      }
    })
    .catch(() => {})

  /** Avance la physique de dt secondes ; renvoie true si le moteur bouge encore. */
  function avancer(dt: number): boolean {
    horloge += dt
    // « Mouvement réduit » : le moteur tourne quand même à son régime (c'est le sujet du hero,
    // comme le versement) ; seules la secousse du bloc et les lueurs de combustion sont coupées.
    const ralenti = RALENTI * TOUR
    if (enMarche) {
      if (demarrage < 0 && omega < 0.5 * ralenti) demarrage = horloge
      const t = demarrage < 0 ? Infinity : horloge - demarrage
      if (t < DEMARREUR.duree) {
        // Démarreur : vitesse basse, freinée à chaque compression (deux par tour).
        omega = DEMARREUR.vitesse * TOUR * (1 - 0.45 * Math.max(0, Math.cos(2 * theta)))
      } else {
        demarrage = -1
        // Le moteur « prend » : il monte à son régime en ≈ 0,4 s.
        omega += (ralenti - omega) * Math.min(1, dt * 6)
      }
    } else {
      demarrage = -1
      // Coupé : il ralentit, puis s'arrête sur une compression.
      omega *= Math.exp(-dt * 2.2)
      if (omega < 0.6 * TOUR) omega = Math.max(0, omega - dt * TOUR * (1 + Math.cos(2 * theta)))
    }
    theta = (theta + omega * dt) % (TOUR * 2)
    return omega > 0
  }

  /** Dessine le moteur à l'angle th. `complet` : aussi la distribution (pas dans les traînées). */
  function dessinerA(ctx: CanvasRenderingContext2D, r: Repere, th: number, alpha: number, complet: boolean) {
    const p = pieces!
    const a = atlas!
    // Une pièce : sèche, puis sa version huilée par-dessus (poids w : l'huile l'a atteinte).
    const deux = (sx: number, sy: number, sl: number, sh: number, dx: number, dy: number, dl: number, dh: number, w: number) => {
      ctx.drawImage(a, sx, sy, sl, sh, dx, dy, dl, dh)
      if (w <= 0.01 || !atlasHuile || !complet) return
      // Chaque pièce a son retard (0 à 25 %) : elles ne se mouillent pas toutes ensemble.
      const retard = (((sx * 7919 + sy * 104729) % 1000) / 1000) * 0.25
      const f = Math.min(1, Math.max(0, (w - retard) / (1 - retard)))
      if (f <= 0) return
      const g = ctx.globalAlpha
      if (f >= 1) {
        ctx.drawImage(atlasHuile, sx, sy, sl, sh, dx, dy, dl, dh)
        return
      }
      // Front qui monte : partie mouillée pleine, puis une bande de bord à demi.
      const hs = sh * f
      const hd = dh * f
      ctx.drawImage(atlasHuile, sx, sy + sh - hs, sl, hs, dx, dy + dh - hd, dl, hd)
      const bande = Math.min(sh - hs, 5)
      if (bande > 0.5) {
        ctx.globalAlpha = g * 0.45
        ctx.drawImage(atlasHuile, sx, sy + sh - hs - bande, sl, bande, dx, dy + dh - hd - (bande * dh) / sh, dl, (bande * dh) / sh)
        ctx.globalAlpha = g
      }
    }
    const morceau = (pl: Place, dy = 0, hauteur?: number, haut?: number, w = 0) => {
      const [ax, ay, l, h] = pl.atlas
      const [px, py] = pl.pos
      const y = haut ?? py + dy
      deux(ax, ay, l, h, r.x(px), r.y(y), l * r.echelle, (hauteur ?? h) * r.echelle, w)
    }
    const brut = (at: Rect, x: number, y: number, h = at[3], w = 0) =>
      deux(at[0], at[1], at[2], at[3], r.x(x), r.y(y), at[2] * r.echelle, h * r.echelle, w)
    const zone = (y0: number, y1: number, dessin: () => void) => {
      ctx.save()
      ctx.beginPath()
      ctx.rect(0, r.y(y0), ctx.canvas.width, r.y(y1) - r.y(y0))
      ctx.clip()
      dessin()
      ctx.restore()
    }
    ctx.globalAlpha = alpha
    const n = p.vilebrequin.length
    const k = Math.round(((((th % TOUR) + TOUR) % TOUR) / TOUR) * n) % n
    morceau(p.vilebrequin[k], 0, undefined, undefined, huile.bas)
    const leveeSoupape = complet ? p.soupapes.map((s) => levee(th, p.came.beta[s.cyl], p.came)) : []
    if (complet) {
      // Têtes de soupape qui s'ouvrent dans la chambre : le piston passera devant.
      zone(p.teteSoupape.chambreY, p.teteSoupape.chambreY + 40, () =>
        p.soupapes.forEach((s, i) => brut(p.teteSoupape.atlas, s.x + p.teteSoupape.dx, p.teteSoupape.y + leveeSoupape[i], undefined, huile.pistons)),
      )
    }
    for (const c of p.cylindres) {
      const { piston, maneton } = pose(th, c.phase, p.rayon, p.bielle)
      // Fût : du pied (sous l'axe du piston) au haut de la tête, étiré entre les deux.
      const y0 = p.axePied
      const y1 = p.teteHaut
      const n0 = y0 + piston
      const k2 = (y1 + maneton - n0) / (y1 - y0)
      const [, , , hf] = c.fut.atlas
      morceau(c.fut, 0, hf * k2, n0 + (c.fut.pos[1] - y0) * k2, huile.bas)
      morceau(c.tete, maneton, undefined, undefined, huile.bas)
      morceau(c.piston, piston, undefined, undefined, huile.pistons)
    }
    if (complet) {
      // Ressorts comprimés par la levée, poussoirs, puis l'arbre à cames qui les pousse.
      zone(0, p.pontY, () =>
        p.soupapes.forEach((s, i) => {
          const L = leveeSoupape[i]
          const rs = p.ressort
          const k3 = (rs.bas - rs.haut - L) / (rs.bas - rs.haut)
          brut(rs.atlas, s.x + rs.dx, rs.haut + L - (rs.haut - rs.y) * k3, rs.atlas[3] * k3, huile.cames)
          brut(p.poussoir.atlas, s.x + p.poussoir.dx, p.poussoir.y + L, undefined, huile.cames)
          // Ombre de contact : la came couvre le haut du poussoir.
          ctx.fillStyle = 'rgba(0, 0, 0, 0.35)'
          ctx.fillRect(r.x(s.x - 11), r.y(p.poussoir.y + 3 + L), 22 * r.echelle, 2.5 * r.echelle)
        }),
      )
      const nc = p.cames.length
      const kc = Math.round((((((th / 2) % TOUR) + TOUR) % TOUR) / TOUR) * nc) % nc
      morceau(p.cames[kc], 0, undefined, undefined, huile.cames)
      dessinerChaine(ctx, r, th)
      morceau(p.cache)
      dessinerDisque(ctx, r, th, p.poulie, true)
      dessinerDisque(ctx, r, th, p.volant, false)
    }
    ctx.globalAlpha = 1
  }

  /**
   * Disque vu de profil (poulie avant, flasque du volant) : la bande de la photo est
   * « enroulée » sur un cylindre qui tourne, avec un repère de calage blanc.
   */
  function dessinerDisque(ctx: CanvasRenderingContext2D, r: Repere, th: number, pl: Disque, ombre: boolean) {
    const [ax, ay, l, h] = pl.atlas
    if (ombre) {
      // Ombre portée sur le bloc, côté moteur.
      const x0 = r.x(pl.pos[0])
      const g = ctx.createLinearGradient(x0, 0, r.x(pl.pos[0] - 20), 0)
      g.addColorStop(0, 'rgba(0,0,0,0.65)')
      g.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = g
      ctx.fillRect(Math.min(x0, r.x(pl.pos[0] - 20)), r.y(pl.centreY - pl.rayon), Math.abs(r.x(pl.pos[0] - 20) - x0), 2 * pl.rayon * r.echelle)
    }
    ctx.drawImage(atlas!, ax, ay, l, h, r.x(pl.pos[0]), r.y(pl.pos[1]), l * r.echelle, h * r.echelle)
    // Voile de vitesse : reflet adouci sur la jante quand le moteur tourne vite.
    if (omega > TOUR) {
      const xg = Math.min(r.x(pl.pos[0]), r.x(pl.pos[0] + l))
      const v = ctx.createLinearGradient(0, r.y(pl.centreY - pl.rayon), 0, r.y(pl.centreY + pl.rayon))
      v.addColorStop(0, 'rgba(0,0,0,0)')
      v.addColorStop(0.5, `rgba(200, 200, 200, ${Math.min(0.12, omega / (RALENTI * TOUR) * 0.12)})`)
      v.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = v
      ctx.fillRect(xg, r.y(pl.centreY - pl.rayon), l * r.echelle, 2 * pl.rayon * r.echelle)
    }
    // Repère de calage (blanc) : visible quand il passe devant.
    const m = th + 0.4
    if (Math.cos(m) > 0.1) {
      // Marque gravée sur la jante : ovale blanc cassé au milieu de la jante, écrasé et estompé
      // quand il tourne vers la face cachée.
      const c = Math.cos(m)
      const y = pl.centreY + pl.rayon * Math.sin(m)
      const cx = (r.x(pl.pos[0]) + r.x(pl.pos[0] + l)) / 2
      const g = ctx.createRadialGradient(cx, r.y(y), 0, cx, r.y(y), l * 0.3 * r.echelle)
      g.addColorStop(0, `rgba(236, 232, 222, ${Math.min(0.95, c * 1.2)})`)
      g.addColorStop(1, 'rgba(236, 232, 222, 0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.ellipse(cx, r.y(y), l * 0.3 * r.echelle, 3.5 * c * r.echelle, 0, 0, TOUR)
      ctx.fill()
    }
  }

  /**
   * Chaîne de distribution vue de profil, dans une fenêtre découpée du carter avant (entre
   * les pignons, cachés) : brin tendu qui descend à la vitesse du pignon de vilebrequin
   * (ω × rayon 20 ; pignon d'arbre à cames de rayon 40, rapport 2:1), brin de retour qui
   * remonte, patin de guidage.
   */
  function dessinerChaine(ctx: CanvasRenderingContext2D, r: Repere, th: number) {
    const c = pieces!.chaine
    const [haut, bas] = c.fenetre
    const lf = c.largeur + 8
    const xg = Math.min(r.x(c.x - lf / 2), r.x(c.x + lf / 2))
    // Fenêtre découpée : fond sombre, arêtes de coupe claires.
    ctx.fillStyle = '#0d0e0f'
    ctx.fillRect(xg, r.y(haut), lf * r.echelle, (bas - haut) * r.echelle)
    ctx.fillStyle = 'rgba(190, 192, 195, 0.7)'
    ctx.fillRect(xg, r.y(haut), r.echelle, (bas - haut) * r.echelle)
    ctx.fillRect(xg + (lf - 1) * r.echelle, r.y(haut), r.echelle, (bas - haut) * r.echelle)
    ctx.fillRect(xg, r.y(haut), lf * r.echelle, r.echelle)
    ctx.fillRect(xg, r.y(bas) - r.echelle, lf * r.echelle, r.echelle)
    ctx.save()
    ctx.beginPath()
    ctx.rect(xg + r.echelle, r.y(haut) + r.echelle, (lf - 2) * r.echelle, (bas - haut - 2) * r.echelle)
    ctx.clip()
    // Patin de guidage (plastique sombre), derrière le brin tendu.
    const x0 = Math.min(r.x(c.x - c.largeur / 2), r.x(c.x + c.largeur / 2))
    const lx = c.largeur * r.echelle
    const y0 = c.came.y + c.came.rayon * 0.3
    const y1 = c.vilebrequin.y - c.vilebrequin.rayon * 0.3
    ctx.fillStyle = '#2a1d14'
    ctx.fillRect(x0 - 1.5 * r.echelle, r.y(y0 + 30), lx + 3 * r.echelle, (y1 - y0 - 60) * r.echelle)
    const pas = 10
    // Brin de retour (derrière, même plan vu de profil) : il remonte, on le voit entre les maillons.
    const dRetour = ((((-th * c.vilebrequin.rayon) % pas) + pas) % pas)
    // Brin de retour : vu très légèrement de biais, décalé de 4 px côté bloc, plus clair.
    const dx = 4 * Math.sign(r.x(1) - r.x(0)) * -1
    for (let y = y0 - pas + dRetour; y < y1; y += pas) {
      const yy = Math.max(y0, y)
      const hh = Math.min(y1, y + pas - 2.5) - yy
      if (hh <= 0) continue
      ctx.fillStyle = '#8a7a66'
      ctx.fillRect(x0 + (1.5 + dx) * r.echelle, r.y(yy), lx - 3 * r.echelle, hh * r.echelle)
      ctx.fillStyle = 'rgba(30, 24, 18, 0.8)'
      ctx.fillRect(x0 + (1.5 + dx) * r.echelle, r.y(yy + hh - 1), lx - 3 * r.echelle, r.echelle)
    }
    // Brin tendu (devant) : plaques extérieures (larges, claires) et intérieures (étroites), qui
    // descendent à la vitesse du pignon de vilebrequin.
    const decalage = (((th * c.vilebrequin.rayon) % pas) + pas) % pas
    for (let y = y0 - pas + decalage; y < y1; y += pas) {
      const yy = Math.max(y0, y)
      const hh = Math.min(y1, y + pas - 3.5) - yy
      if (hh <= 0) continue
      const n = Math.round((y - decalage) / pas)
      const exterieure = n % 2 === 0
      const marge = exterieure ? 0.6 : 3
      // Chaque plaque a son propre éclat (usure, huile) : pas deux maillons identiques.
      const eclat = Math.round(14 * Math.sin(n * 12.9898 + 4.1) * Math.sin(n * 3.7))
      const base = (exterieure ? 152 : 102) + eclat
      ctx.fillStyle = `rgb(${base}, ${base + 3}, ${base + 7})`
      ctx.fillRect(x0 + marge * r.echelle, r.y(yy), lx - 2 * marge * r.echelle, hh * r.echelle)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)' // ombre de contact sous la plaque
      ctx.fillRect(x0 + marge * r.echelle, r.y(yy + hh - 0.8), lx - 2 * marge * r.echelle, 0.8 * r.echelle)
      ctx.fillStyle = `rgba(225, 227, 230, ${0.4 + 0.25 * Math.abs(Math.sin(n * 7.3))})`
      ctx.fillRect(x0 + (marge + 1) * r.echelle, r.y(yy + hh / 2 - 0.6), lx - 2 * (marge + 1) * r.echelle, 1.2 * r.echelle)
    }
    // Ombre portée du carter sur le haut et le bas de la fenêtre.
    const og = ctx.createLinearGradient(0, r.y(haut), 0, r.y(bas))
    og.addColorStop(0, 'rgba(0,0,0,0.6)')
    og.addColorStop(0.12, 'rgba(0,0,0,0)')
    og.addColorStop(0.88, 'rgba(0,0,0,0)')
    og.addColorStop(1, 'rgba(0,0,0,0.6)')
    ctx.fillStyle = og
    ctx.fillRect(xg, r.y(haut), lf * r.echelle, (bas - haut) * r.echelle)
    ctx.restore()
  }

  // ── Huile ────────────────────────────────────────────────────────────────────

  /**
   * Ruban d'huile vertical (px source) : largeur qui ondule et s'étrangle, léger serpentement,
   * corps ambré translucide, cœur clair, reflet net d'un côté (lampe à gauche), perles qui
   * descendent à la vitesse du liquide. `meandre` : amplitude du serpentement (px) ;
   * `vitesse` : vitesse relative des perles.
   */
  function ruban(ctx: CanvasRenderingContext2D, r: Repere, x: number, haut: number, bas: number, largeur: number, t: number, meandre: number, vitesse: number) {
    if (largeur < 0.4 || bas <= haut + 1) return
    const n = Math.max(8, Math.ceil((bas - haut) / 4))
    const pts: { x: number; y: number; w: number }[] = []
    for (let i = 0; i <= n; i++) {
      const y = haut + ((bas - haut) * i) / n
      const v = (y - haut) / Math.max(1, bas - haut)
      // Section : s'affine en accélérant (conservation du débit), ondule (gouttes en formation).
      const w = largeur * (1 - 0.35 * v) * (1 + 0.16 * Math.sin(y / 9 - t * 14 * vitesse) + 0.08 * Math.sin(y / 3.7 - t * 23 * vitesse))
      pts.push({ x: x + meandre * Math.sin(y / 23 + t * 0.7) + 0.5 * meandre * Math.sin(y / 8.5), y, w })
    }
    const contour = (k: number, dx = 0) => {
      ctx.beginPath()
      pts.forEach((q, i) => (i ? ctx.lineTo : ctx.moveTo).call(ctx, r.x(q.x - (q.w * k) / 2 + dx), r.y(q.y)))
      for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(r.x(pts[i].x + (pts[i].w * k) / 2 + dx), r.y(pts[i].y))
      ctx.closePath()
    }
    ctx.fillStyle = 'rgba(150, 82, 12, 0.45)' // bord ambre (Fresnel)
    contour(1.12)
    ctx.fill()
    ctx.fillStyle = 'rgba(240, 168, 42, 0.8)' // corps doré translucide
    contour(1)
    ctx.fill()
    ctx.fillStyle = 'rgba(255, 214, 108, 0.9)' // cœur clair (la lumière traverse)
    contour(0.45)
    ctx.fill()
    ctx.fillStyle = 'rgba(255, 248, 220, 0.95)' // reflet net côté lampe
    contour(0.14, -0.22 * largeur)
    ctx.fill()
    // Perles (épaississements) qui descendent.
    for (let y = haut + ((t * 90 * vitesse) % 26) - 26; y < bas; y += 26) {
      if (y < haut) continue
      const i = Math.min(pts.length - 1, Math.round(((y - haut) / (bas - haut)) * n))
      const q = pts[i]
      ctx.fillStyle = 'rgba(245, 180, 52, 0.7)'
      ctx.beginPath()
      ctx.ellipse(r.x(q.x), r.y(y), q.w * 0.75 * r.echelle, q.w * 1.3 * r.echelle, 0, 0, TOUR)
      ctx.fill()
      ctx.fillStyle = 'rgba(255, 248, 220, 0.85)'
      ctx.fillRect(r.x(q.x - q.w * 0.25), r.y(y - q.w * 0.5), Math.max(1, q.w * 0.18 * r.echelle), q.w * 0.5 * r.echelle)
    }
  }

  /** Impact du filet sur le fond de la culasse : flaque qui s'étale et couronne de gouttelettes. */
  function eclaboussure(ctx: CanvasRenderingContext2D, r: Repere, x: number, y: number, debit: number, t: number) {
    const w = 14 + 10 * debit
    const g = ctx.createRadialGradient(r.x(x), r.y(y), 0, r.x(x), r.y(y), w * r.echelle)
    g.addColorStop(0, 'rgba(255, 226, 140, 0.9)')
    g.addColorStop(0.6, 'rgba(240, 160, 40, 0.55)')
    g.addColorStop(1, 'rgba(200, 120, 20, 0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.ellipse(r.x(x), r.y(y), w * r.echelle, w * 0.28 * r.echelle, 0, 0, TOUR)
    ctx.fill()
    for (let k = 0; k < 5; k++) {
      const ph = (t * 3.1 + k / 5) % 1
      const dx = (k - 2) * 3.2 * ph * (1 + debit)
      const dy = -14 * debit * ph * (1 - ph) * 4 * (0.6 + 0.4 * Math.sin(k * 2.3))
      ctx.fillStyle = `rgba(255, 196, 80, ${0.85 * (1 - ph)})`
      ctx.beginPath()
      ctx.arc(r.x(x + dx), r.y(y + dy), (2.4 - ph * 1.2) * r.echelle, 0, TOUR)
      ctx.fill()
    }
  }

  /**
   * Nappe au fond du carter, vue en coupe : surface qui ondule (agitée par le vilebrequin
   * moteur lancé), rides circulaires aux impacts, reflet inversé du dessous des pièces,
   * huile translucide qui s'assombrit en profondeur, ménisque clair contre les parois.
   */
  function nappe(ctx: CanvasRenderingContext2D, r: Repere, t: number) {
    const p = pieces!
    const c = p.carter
    if (huile.carter <= 0.01) return
    const [ax, ay, l, h] = c.atlas
    const niveau = c.niveauVide + (c.niveauPlein - c.niveauVide) * huile.carter
    const W = Math.max(1, Math.round(l * r.echelle))
    const Hh = Math.max(1, Math.round(h * r.echelle))
    poolCanvas ??= document.createElement('canvas')
    if (poolCanvas.width !== W || poolCanvas.height !== Hh) Object.assign(poolCanvas, { width: W, height: Hh })
    const g = poolCanvas.getContext('2d')!
    g.clearRect(0, 0, W, Hh)
    const e = r.echelle
    const flip = r.x(1) < r.x(0)
    const agite = 0.7 + 1.1 * Math.min(1, omega / (RALENTI * TOUR))
    const ys = (yy: number) => (yy - c.pos[1]) * e
    if (fluide && planCarter && !flip) {
      nappeSimulee(ctx, g, r, t, W, Hh, niveau)
      return
    }
    const surf = (xx: number) => {
      // Houle douce, basse fréquence (l'huile est visqueuse : pas de clapot fin).
      let z = Math.sin(xx / 23 + t * 3) * 0.7 + Math.sin(xx / 47 - t * 1.3) * 0.6
      for (const rd of rides) {
        const d = Math.abs(xx - rd.x)
        const front = rd.age * 70
        z += Math.exp(-(((d - front) / 7) ** 2)) * Math.cos((d - front) / 5) * 2.4 * (1 - rd.age / 0.6)
      }
      return niveau + z * agite
    }
    const X = (i: number) => (i / 80) * W
    const XS = (i: number) => (flip ? c.pos[0] + l - (i / 80) * l : c.pos[0] + (i / 80) * l)
    const tracer = () => {
      g.beginPath()
      for (let i = 0; i <= 80; i++) (i ? g.lineTo : g.moveTo).call(g, X(i), ys(surf(XS(i))))
      g.lineTo(W, Hh)
      g.lineTo(0, Hh)
      g.closePath()
    }
    // Corps : translucide sous la surface, ambre profond en bas.
    const grad = g.createLinearGradient(0, ys(niveau - 2), 0, Hh)
    grad.addColorStop(0, 'rgba(255, 206, 100, 0.42)')
    grad.addColorStop(0.12, 'rgba(236, 156, 36, 0.58)')
    grad.addColorStop(0.45, 'rgba(160, 84, 10, 0.72)')
    grad.addColorStop(1, 'rgba(70, 30, 3, 0.85)')
    g.fillStyle = grad
    tracer()
    g.fill()
    // Reflet : les pièces au-dessus de la surface, inversées, ondulées, atténuées.
    const src = ctx.canvas
    const x0 = r.x(flip ? c.pos[0] + l : c.pos[0]) - (flip ? W : 0)
    const yS = r.y(niveau) // ligne de surface sur le canvas des pièces
    g.save()
    tracer()
    g.clip()
    g.globalAlpha = 0.75
    g.globalCompositeOperation = 'screen'
    // Miroir autour de la surface : ce qui est au-dessus (têtes de bielle, vilebrequin) se
    // reflète dessous, décalé par l'ondulation.
    const yN = ys(niveau)
    const hR = Math.min(yN, 40 * e)
    if (hR > 2 && cout < 8) {
      g.translate(Math.sin(t * 5) * 1.5 * e, 2 * yN)
      g.scale(1, -1)
      g.drawImage(src, x0, yS - hR, W, hR, 0, yN - hR, W, hR)
    }
    g.restore()
    // Ménisque et ligne de surface : reflet fin et chaud.
    g.strokeStyle = 'rgba(255, 232, 160, 0.8)'
    g.lineWidth = Math.max(1.2, 1.8 * e)
    g.beginPath()
    for (let i = 0; i <= 80; i++) (i ? g.lineTo : g.moveTo).call(g, X(i), ys(surf(XS(i))) + 0.6)
    g.stroke()
    // Seulement dans les cavités du carter (bord adouci : ménisque contre les parois).
    if (!masqueCarter || masqueCarter.width !== W || masqueCarter.height !== Hh) {
      masqueCarter = document.createElement('canvas')
      Object.assign(masqueCarter, { width: W, height: Hh })
      const m = masqueCarter.getContext('2d')!
      m.filter = `blur(${Math.max(0.5, 0.8 * e)}px)`
      m.drawImage(atlas!, ax, ay, l, h, 0, 0, W, Hh)
    }
    g.globalCompositeOperation = 'destination-in'
    g.drawImage(masqueCarter, 0, 0)
    g.globalCompositeOperation = 'source-over'
    ctx.drawImage(poolCanvas, x0, r.y(c.pos[1]), W, Hh)
  }

  /**
   * Nappe simulée (pleine, niveau 604) : moteur arrêté, l'image calme ; en marche, la boucle des
   * gouttes qui retombent (rides réelles). Au remplissage, la nappe est descendue d'autant :
   * elle monte dans les cavités avec le scroll. Puis le reflet des pièces,
   * posé seulement sur l'huile, et le masque des cavités.
   */
  function nappeSimulee(ctx: CanvasRenderingContext2D, g: CanvasRenderingContext2D, r: Repere, t: number, W: number, Hh: number, niveau: number) {
    const p = pieces!
    const c = p.carter
    const f = fluide!.carter
    const e = r.echelle
    const k = omega > 0.5 * TOUR ? f.boucle[0] + (Math.floor(t * fluide!.fps) % (f.boucle[1] - f.boucle[0] + 1)) : f.calme
    const [l, h] = f.taille
    g.drawImage(planCarter!, (k % f.colonnes) * l, Math.floor(k / f.colonnes) * h, l, h,
      (f.pos[0] - c.pos[0]) * e, (f.pos[1] + niveau - f.niveau - c.pos[1]) * e, l * e, h * e)
    // Reflet des têtes de bielle et du vilebrequin dans la surface, sur l'huile seulement.
    const yN = (niveau - c.pos[1]) * e
    const hR = Math.min(yN, 40 * e)
    const x0 = r.x(c.pos[0])
    if (hR > 2 && cout < 8) {
      g.save()
      g.globalCompositeOperation = 'source-atop'
      g.globalAlpha = 0.35
      g.translate(Math.sin(t * 5) * 1.5 * e, 2 * yN)
      g.scale(1, -1)
      g.drawImage(ctx.canvas, x0, r.y(niveau) - hR, W, hR, 0, yN - hR, W, hR)
      g.restore()
    }
    const [ax, ay, la, ha] = c.atlas
    if (!masqueCarter || masqueCarter.width !== W || masqueCarter.height !== Hh) {
      masqueCarter = document.createElement('canvas')
      Object.assign(masqueCarter, { width: W, height: Hh })
      const m = masqueCarter.getContext('2d')!
      m.filter = `blur(${Math.max(0.5, 0.8 * e)}px)`
      m.drawImage(atlas!, ax, ay, la, ha, 0, 0, W, Hh)
    }
    g.globalCompositeOperation = 'destination-in'
    g.drawImage(masqueCarter, 0, 0)
    g.globalCompositeOperation = 'source-over'
    ctx.drawImage(poolCanvas!, x0, r.y(c.pos[1]), W, Hh)
  }

  /**
   * Gouttes : projetées par le vilebrequin moteur lancé (barbotage) et retombant de la
   * distribution. Lentilles ambrées étirées par la vitesse, traînée, point de lumière ;
   * dans la nappe, chacune lance une ride circulaire.
   */
  function gouttelettes(ctx: CanvasRenderingContext2D, r: Repere, dt: number) {
    const p = pieces!
    const niveau = p.carter.niveauVide + (p.carter.niveauPlein - p.carter.niveauVide) * huile.carter
    const vite = Math.min(1, omega / (RALENTI * TOUR))
    const max = cout > 8 ? 18 : 56
    if (huile.bas > 0 && vite > 0.3) {
      for (const c of p.cylindres) {
        if (gouttes.length >= max || Math.random() > dt * 18 * vite * huile.bas) continue
        const x = c.tete.pos[0] + c.tete.atlas[2] * (0.2 + 0.6 * Math.random())
        const { maneton } = pose(theta, c.phase, p.rayon, p.bielle)
        gouttes.push({ x, y: c.tete.pos[1] + c.tete.atlas[3] + maneton - 8, vx: (Math.random() - 0.5) * 110, vy: -(180 + 300 * Math.random()) * vite, r: 3 + Math.random() * 2 })
      }
    }
    if (huile.cames > 0 && gouttes.length < max && Math.random() < dt * 4 * huile.cames) {
      const s = p.soupapes[Math.floor(Math.random() * p.soupapes.length)]
      gouttes.push({ x: s.x + (Math.random() - 0.5) * 20, y: 200, vx: 0, vy: 0, r: 1.4 + Math.random() })
    }
    // Pendantes : l'huile s'accumule au bas de la jupe, la goutte grossit, se détache.
    if (huile.pistons > 0.3) {
      p.cylindres.forEach((c, i) => {
        const pd = pendantes[i]
        pd.g += dt * (0.8 + 0.25 * i) * huile.pistons
        const { piston } = pose(theta, c.phase, p.rayon, p.bielle)
        const x = c.piston.pos[0] + c.piston.atlas[2] * pd.dx
        const y = c.piston.pos[1] + c.piston.atlas[3] + piston - 4
        if (pd.g >= 1) {
          pd.g = 0
          pd.dx = 0.2 + Math.random() * 0.6
          if (gouttes.length < max) gouttes.push({ x, y: y + 6, vx: 0, vy: 40, r: 3.6 })
          return
        }
        const rr = 1.6 + 3.6 * pd.g
        // Coulure qui descend la jupe et alimente la goutte, bourrelet au bord inférieur.
        ctx.fillStyle = 'rgba(240, 168, 42, 0.75)'
        ctx.fillRect(r.x(x) - 0.8 * r.echelle, r.y(y - 26), 1.6 * r.echelle, 26 * r.echelle)
        ctx.fillStyle = 'rgba(255, 236, 180, 0.8)'
        ctx.fillRect(r.x(x) - 0.3 * r.echelle, r.y(y - 26), 0.6 * r.echelle, 26 * r.echelle)
        ctx.fillStyle = 'rgba(235, 150, 36, 0.55)'
        ctx.fillRect(r.x(x - 7), r.y(y - 1.5), 14 * r.echelle, 2 * r.echelle)
        const gr = ctx.createRadialGradient(r.x(x), r.y(y + rr), 0, r.x(x), r.y(y + rr), rr * 1.4 * r.echelle)
        gr.addColorStop(0, 'rgba(255, 226, 140, 0.95)')
        gr.addColorStop(1, 'rgba(190, 104, 14, 0.85)')
        ctx.fillStyle = gr
        ctx.beginPath()
        ctx.ellipse(r.x(x), r.y(y + rr * 0.9), rr * r.echelle, rr * (1 + 0.5 * pd.g) * r.echelle, 0, 0, TOUR)
        ctx.fill()
        ctx.fillStyle = 'rgba(255, 250, 230, 0.95)'
        ctx.fillRect(r.x(x - rr * 0.3), r.y(y + rr * 0.5), Math.max(1, 0.6 * rr * r.echelle), Math.max(1, 0.6 * rr * r.echelle))
      })
    }
    const G = 900
    for (let i = gouttes.length - 1; i >= 0; i--) {
      const d = gouttes[i]
      d.vy += G * dt
      d.x += d.vx * dt
      d.y += d.vy * dt
      const fond = d.y < 230 ? p.pontY : niveau
      if (d.vy > 0 && d.y >= fond) {
        if (fond === niveau && huile.carter > 0.05) rides.push({ x: d.x, age: 0 })
        gouttes.splice(i, 1)
        continue
      }
      const v = Math.hypot(d.vx, d.vy)
      const ang = Math.atan2(d.vy, d.vx) - Math.PI / 2
      const etire = 1 + Math.min(2.5, v / 220)
      const X = r.x(d.x)
      const Y = r.y(d.y)
      // Traînée (flou de mouvement) dans le sens contraire de la vitesse.
      ctx.strokeStyle = 'rgba(245, 175, 50, 0.45)'
      ctx.lineWidth = d.r * 1.1 * r.echelle
      ctx.beginPath()
      ctx.moveTo(X, Y)
      ctx.lineTo(r.x(d.x - d.vx * 0.045), r.y(d.y - d.vy * 0.045))
      ctx.stroke()
      ctx.save()
      ctx.translate(X, Y)
      ctx.rotate(ang)
      const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, d.r * etire * r.echelle)
      gr.addColorStop(0, 'rgba(255, 228, 146, 0.95)')
      gr.addColorStop(0.7, 'rgba(240, 160, 36, 0.9)')
      gr.addColorStop(1, 'rgba(150, 78, 8, 0.85)')
      ctx.fillStyle = gr
      ctx.beginPath()
      ctx.ellipse(0, 0, d.r * r.echelle, d.r * etire * r.echelle, 0, 0, TOUR)
      ctx.fill()
      ctx.fillStyle = 'rgba(255, 250, 230, 0.95)'
      ctx.beginPath()
      ctx.arc(-0.35 * d.r * r.echelle, -0.3 * d.r * etire * r.echelle, 0.35 * d.r * r.echelle, 0, TOUR)
      ctx.fill()
      ctx.restore()
    }
    for (let i = rides.length - 1; i >= 0; i--) {
      rides[i].age += dt
      if (rides[i].age > 0.6) rides.splice(i, 1)
    }
    if (rides.length > 14) rides.splice(0, rides.length - 14)
  }

  let horlogeHuile = 0

  /** Coût moyen d'un dessin (ms) : sur un téléphone lent, moins de positions de flou. */
  let cout = 0

  return {
    pret,
    get charge() {
      return pieces !== null
    },
    get tourne() {
      return omega > 0
    },
    /** De l'huile coule ou ondule : la boucle doit tourner même moteur arrêté. */
    get huileActive() {
      return huile.verse > 0.01 || huile.carter > 0.01 || gouttes.length > 0
    },
    regler(marche: boolean) {
      enMarche = marche
    },
    /** État de l'huile (scroll) ; true si quelque chose d'huileux est à l'écran (à animer). */
    reglerHuile(etat: typeof huile) {
      Object.assign(huile, etat)
      return huile.verse > 0.01 || huile.carter > 0.01
    },
    avancer,
    /**
     * Secousse du bloc (px source) : un 4 cylindres en ligne vibre au double du régime (forces
     * secondaires), à peine (≈ 0,4 px), seulement quand il tourne.
     */
    secousse() {
      return omega > 0 && !reduit ? 0.4 * Math.min(1, omega / (RALENTI * TOUR)) * Math.sin(2 * theta) : 0
    },
    /** Pièces mobiles (avec traînée si le moteur tourne vite), puis rebord du carter devant. */
    dessiner(ctx: CanvasRenderingContext2D, r: Repere, dtImage: number) {
      if (!pieces || !atlas) return false
      // Flou de mouvement (obturateur à 180°) : positions intermédiaires sur le trajet parcouru
      // depuis l'image précédente, des plus anciennes (transparentes) à l'actuelle (opaque).
      const debut = performance.now()
      const arc = omega * dtImage * 0.5
      const permis = cout > 9 ? 1 : cout > 5 ? Math.min(3, echantillonsMax) : echantillonsMax
      const n = Math.min(permis, Math.ceil(arc / 0.12))
      for (let k = n; k >= 1; k--) dessinerA(ctx, r, theta - (arc * k) / n, 1 / (k + 1), false)
      {
        // Retour d'huile derrière la chaîne (carter de distribution), plus lent que la chute.
        const f = pieces.filets
        const paroi = Math.min(1, huile.verse * 1.4 + (huile.carter > 0.02 && huile.carter < 0.98 ? 0.3 : 0))
        ruban(ctx, r, f.paroi.x, f.paroi.haut, f.paroi.haut + (f.paroi.bas - f.paroi.haut) * Math.min(1, paroi * 3), 7 * paroi, horlogeHuile, 0.6, 0.45)
      }
      dessinerA(ctx, r, theta, 1, true)
      // Combustion : un éclair orangé bref dans la chambre du cylindre qui s'allume (moteur
      // lancé seulement, pas au démarreur ni en mouvement réduit).
      if (!reduit && omega > 0.8 * DEMARREUR.vitesse * TOUR) {
        const p = pieces
        ctx.save()
        ctx.globalCompositeOperation = 'lighter'
        p.cylindres.forEach((c, i) => {
          let d = (theta - ALLUMAGE[i]) % (2 * TOUR)
          if (d < 0) d += 2 * TOUR
          // En secondes depuis l'allumage : montée 15 ms, décroissance 110 ms (lisible à tout régime).
          const s = d / Math.max(omega, 1)
          if (s > 0.125) return
          const f = s < 0.015 ? s / 0.015 : (1 - (s - 0.015) / 0.11) ** 1.6
          const cx = r.x(c.piston.pos[0] + c.piston.atlas[2] / 2)
          const cy = r.y(p.teteSoupape.chambreY + 4) // sous la bougie, au haut de la chambre
          const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 52 * r.echelle)
          // Lueur limitée à la chambre d'un cylindre (bien moins d'un quart du champ de 10° de
          // WCAG 2.3.1), sans rouge saturé : pas un « flash » au sens de la norme.
          g.addColorStop(0, `rgba(255, 214, 150, ${0.62 * f})`)
          g.addColorStop(0.45, `rgba(255, 160, 70, ${0.32 * f})`)
          g.addColorStop(1, 'rgba(255, 140, 60, 0)')
          ctx.fillStyle = g
          // Chambre fermée : la lueur reste entre la culasse et la tête du piston, dans l'alésage.
          const { piston } = pose(theta, c.phase, p.rayon, p.bielle)
          const xa = r.x(c.piston.pos[0])
          const xb = r.x(c.piston.pos[0] + c.piston.atlas[2])
          const ya = r.y(p.teteSoupape.chambreY)
          const yb = r.y(c.piston.pos[1] + piston + 6)
          ctx.save()
          ctx.beginPath()
          ctx.rect(Math.min(xa, xb), ya, Math.abs(xb - xa), Math.max(0, yb - ya))
          ctx.clip()
          ctx.beginPath()
          ctx.ellipse(cx, cy, 52 * r.echelle, 34 * r.echelle, 0, 0, TOUR)
          ctx.fill()
          ctx.restore()
        })
        ctx.restore()
      }
      // Huile : nappe et gouttes (derrière le rebord du carter), filets du versement.
      horlogeHuile += dtImage
      nappe(ctx, r, horlogeHuile)
      gouttelettes(ctx, r, Math.min(0.05, dtImage))
      const f = pieces.filets
      if (fluide && planVerse) {
        // Filet simulé : amorce (impact, première nappe) puis la boucle du régime établi.
        tempsVerse = huile.verse > 0.02 ? tempsVerse + dtImage : 0
        if (huile.verse > 0.02) {
          const v = fluide.versement
          const n = Math.floor(tempsVerse * fluide.fps)
          const k = n < v.boucle[0] ? n : v.boucle[0] + ((n - v.boucle[0]) % (v.boucle[1] - v.boucle[0] + 1))
          const [l, h] = v.taille
          ctx.globalAlpha = Math.min(1, huile.verse * 2.5)
          ctx.drawImage(planVerse, (k % v.colonnes) * l, Math.floor(k / v.colonnes) * h, l, h,
            r.x(v.pos[0]), r.y(v.pos[1]), l * r.echelle, h * r.echelle)
          ctx.globalAlpha = 1
        }
      } else {
        // Chute sous le goulot : ruban de 9 px à plein débit, qui s'étrangle en tombant.
        ruban(ctx, r, f.chute.x, f.chute.haut, f.chute.bas, 9 * Math.sqrt(huile.verse), horlogeHuile, 0.6, 1.8)
        if (huile.verse > 0.05) eclaboussure(ctx, r, f.chute.x, f.chute.bas, huile.verse, horlogeHuile)
      }

      const [ax, ay, l, h] = pieces.avant.atlas
      ctx.drawImage(atlas, ax, ay, l, h, r.x(pieces.avant.pos[0]), r.y(pieces.avant.pos[1]), l * r.echelle, h * r.echelle)
      cout = cout * 0.9 + (performance.now() - debut) * 0.1
      return true
    },
  }
}
