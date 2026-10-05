/**
 * Catalogue Petrovöll — fusionne les fiches Keystatic (src/content/produits :
 * adresse, photo, prix, disponibilité) et les données du fabricant
 * (src/data/produits-petrovoll.json : gamme, viscosités, normes, propriétés).
 *
 * Le lien se fait par le nom (« Petrovöll STÄRK Fully Synthetic » ↔
 * « STÄRK Fully Synthetic »). Un produit ajouté dans l'admin sans équivalent
 * dans le JSON reste affiché (carte simple) : on n'invente aucune donnée.
 */
import type { ImageMetadata } from 'astro'

import donnees from '@/data/produits-petrovoll.json'
import photosMeta from '@/data/photos-produits.json'
import type { Produit } from '@/lib/contenu'

type Brut = (typeof donnees)[number]

/** Photos détourées (1200×1200) : src/assets/produits/<id>.webp, choisies via le champ `photo` du JSON. */
const PHOTOS = import.meta.glob<{ default: ImageMetadata }>('/src/assets/produits/*.webp', { eager: true })
function trouverPhoto(source?: Brut): ImageMetadata | undefined {
  const brut = source as { id: string; photo?: string | null } | undefined
  if (!brut || brut.photo === null) return undefined
  const fichier = brut.photo ?? `${brut.id}.webp`
  return PHOTOS[`/src/assets/produits/${fichier}`]?.default
}

export const USAGES = [
  { id: 'tout', label: 'Toute la gamme', icone: 'tout', gammes: null },
  { id: 'essence', label: 'Voiture essence', icone: 'voiture', gammes: ['Huiles moteur essence'] },
  { id: 'diesel', label: 'Diesel, camions', icone: 'camion', gammes: ['Huiles moteur diesel'] },
  { id: 'moto', label: 'Moto', icone: 'moto', gammes: ['Huiles moto'] },
  {
    id: 'boite',
    label: 'Boîte et pont',
    icone: 'boite',
    gammes: ['Fluides de transmission automatique (ATF)', 'Huiles de boîte manuelle et pont'],
  },
  { id: 'industrie', label: 'Industrie', icone: 'usine', gammes: ['Huiles industrielles'] },
  { id: 'marine', label: 'Marine', icone: 'marine', gammes: ['Huiles marine'] },
  {
    id: 'entretien',
    label: 'Freins, graisses, entretien',
    icone: 'goutte',
    gammes: ['Liquides de frein', 'Liquides de refroidissement', 'Graisses', 'Additifs et entretien'],
  },
] as const

export const BASES = [
  { id: 'toutes', label: 'Toutes' },
  { id: 'synthese', label: 'Synthèse' },
  { id: 'semi', label: 'Semi-synthétique' },
  { id: 'minerale', label: 'Minérale' },
] as const

export type BaseId = 'synthese' | 'semi' | 'minerale' | 'autre'

export function categorieBase(base: string | null | undefined): BaseId {
  const b = base ?? ''
  if (/semi/i.test(b)) return 'semi'
  if (/synth/i.test(b)) return 'synthese'
  if (/min[ée]r/i.test(b)) return 'minerale'
  return 'autre'
}

const LIBELLE_BASE: Record<BaseId, string> = {
  synthese: 'Base synthèse',
  semi: 'Base semi-synthétique',
  minerale: 'Base minérale',
  autre: '',
}

export function usageDeGamme(gamme: string | undefined): string {
  return USAGES.find((u) => u.gammes && (u.gammes as readonly string[]).includes(gamme ?? ''))?.id ?? 'autre'
}

/** Sans accents, sans ponctuation, minuscules : pour comparer des noms. */
export const simplifier = (t: string) =>
  t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

/** Retire la marque et les précisions entre parenthèses d'un nom Keystatic. */
const racine = (nom: string) => simplifier(nom.replace(/\(.*?\)/g, '').replace(/^petrov\S*\s+/i, ''))

function trouverBrut(nom: string): Brut | undefined {
  const r = racine(nom)
  const exact = donnees.find((d) => racine(d.nom) === r)
  if (exact) return exact
  // Noms Keystatic plus longs ou plus courts : même début de nom.
  return donnees
    .filter((d) => r.startsWith(racine(d.nom)) || racine(d.nom).startsWith(r))
    .sort((a, b) => b.nom.length - a.nom.length)[0]
}

/* ── Propriétés typiques ──────────────────────────────────────────────── */

const PROPRIETES: Array<{ cle: string; nom: string; unite?: string }> = [
  { cle: 'viscosite_40C_cSt', nom: 'Viscosité à 40 °C', unite: 'cSt' },
  { cle: 'viscosite_100C_cSt', nom: 'Viscosité à 100 °C', unite: 'cSt' },
  { cle: 'indice_viscosite', nom: 'Indice de viscosité' },
  { cle: 'densite_15C_g_cm3', nom: 'Densité à 15 °C', unite: 'g/cm³' },
  { cle: 'd20', nom: 'Densité à 20 °C' },
  { cle: 'TBN_mgKOH_g', nom: 'TBN', unite: 'mg KOH/g' },
  { cle: 'cendres_sulfatees_pct', nom: 'Cendres sulfatées', unite: '%' },
  { cle: 'point_eclair_COC_C', nom: 'Point d’éclair (COC)', unite: '°C' },
  { cle: 'point_ecoulement_C', nom: 'Point d’écoulement', unite: '°C' },
  { cle: 'viscosite_brookfield_moins40C_cP', nom: 'Viscosité Brookfield à −40 °C', unite: 'cP' },
  { cle: 'viscosite_brookfield', nom: 'Viscosité Brookfield' },
  { cle: 'ph', nom: 'pH' },
  { cle: 'alcalinite_reserve', nom: 'Alcalinité de réserve' },
  { cle: 'protection_gel_C', nom: 'Protection contre le gel', unite: '°C' },
  { cle: 'mono_ethylene_glycol_pct', nom: 'Monoéthylène glycol', unite: '%' },
  { cle: 'penetration_25C', nom: 'Pénétration à 25 °C' },
  { cle: 'penetration_travaillee_60_coups_25C', nom: 'Pénétration travaillée (60 coups, 25 °C)' },
  { cle: 'point_goutte_C', nom: 'Point de goutte', unite: '°C' },
  { cle: 'separation_huile_24h_pct', nom: 'Séparation d’huile (24 h)', unite: '%' },
  { cle: 'usure_4_billes_mm', nom: 'Usure 4 billes', unite: 'mm' },
  { cle: 'timken_ok_load_kg', nom: 'Charge Timken OK', unite: 'kg' },
  { cle: 'corrosion_lame_cuivre', nom: 'Corrosion lame de cuivre' },
  { cle: 'epaississant', nom: 'Épaississant' },
  { cle: 'couleur', nom: 'Couleur' },
  { cle: 'aspect', nom: 'Aspect' },
  { cle: 'moussage_seq_I_II_III_ml', nom: 'Moussage (séq. I/II/III)', unite: 'ml' },
]

/** Nombre à la française (virgule), vrai signe moins ; texte inchangé. */
export function formaterValeur(v: unknown): string {
  if (typeof v === 'number') return String(v).replace('.', ',').replace('-', '−')
  return String(v)
}

export interface LigneCaracteristique {
  nom: string
  unite: string
  valeur: string
}
export interface Variante {
  /** Texte du bouton (ex. « 5W-30 », « ISO VG 46 »). */
  libelle: string
  lignes: LigneCaracteristique[]
  /** Chiffres clés : viscosité à 40 et 100 °C, IV, point d'éclair, point d'écoulement. */
  cles: LigneCaracteristique[]
  ecoulement?: string
}

const CLES = new Set([
  'viscosite_40C_cSt',
  'viscosite_100C_cSt',
  'indice_viscosite',
  'point_eclair_COC_C',
  'point_ecoulement_C',
])
const NOM_COURT: Record<string, string> = {
  viscosite_40C_cSt: 'Viscosité à 40 °C',
  viscosite_100C_cSt: 'Viscosité à 100 °C',
  indice_viscosite: 'Indice de viscosité',
  point_eclair_COC_C: 'Point d’éclair',
  point_ecoulement_C: 'Point d’écoulement',
}

const compact = (t: string) => t.toUpperCase().replace(/[^A-Z0-9]/g, '')

function construireVariantes(brut: Brut): Variante[] {
  const props = (brut.proprietes_typiques ?? []) as Array<Record<string, unknown>>
  const sae = (brut.viscosite_sae ?? []) as string[]
  return props
    .map((p) => {
      const lignes: LigneCaracteristique[] = []
      const cles: LigneCaracteristique[] = []
      for (const def of PROPRIETES) {
        const v = p[def.cle]
        if (v === undefined || v === null || v === '') continue
        lignes.push({ nom: def.nom, unite: def.unite ?? '', valeur: formaterValeur(v) })
        if (CLES.has(def.cle)) cles.push({ nom: NOM_COURT[def.cle], unite: def.unite ?? '', valeur: formaterValeur(v) })
      }
      const brutLibelle = typeof p.variante === 'string' ? p.variante : ''
      // « 5W20 » → « 5W-20 » : on reprend la graphie de la liste des viscosités.
      const libelle = sae.find((s) => compact(s) === compact(brutLibelle)) ?? brutLibelle
      const ec = p.point_ecoulement_C
      return { libelle, lignes, cles, ecoulement: ec != null ? `${formaterValeur(ec)} °C` : undefined }
    })
    .filter((v) => v.lignes.length > 0)
}

/* ── Normes et homologations ──────────────────────────────────────────── */

const ORGANISMES =
  /^(API|ACEA|JASO|ISO|DIN|SAE|MIL|NMMA|FMVSS|IEC|BS|AGMA|ANSI|CCMC|DEXRON|MERCON|NLGI)\b/i

/** Sépare « API SN, ACEA A5/B5-04, MB 229.1, 229.3, Ferrari » en normes et constructeurs. */
export function separerNormes(texte: string | null | undefined) {
  const normes: string[] = []
  const constructeurs: string[] = []
  let prefixe = ''
  let courant: 'normes' | 'constructeurs' = 'normes'
  const jetons = (texte ?? '')
    .split(/[,;]/)
    .map((j) => j.trim().replace(/\*+$/, ''))
    .filter(Boolean)
  for (const j of jetons) {
    let estNorme = ORGANISMES.test(j)
    let valeur = j
    if (!estNorme && prefixe) {
      // Suite d'une liste : « API SN, SM, SL » ou « MB 229.1, 229.3 ».
      const suiteNorme = courant === 'normes' && /^[A-Z0-9][A-Z0-9/-]*$/.test(j)
      const suiteNumero = courant === 'constructeurs' && /^[\d.]+$/.test(j)
      if (suiteNorme) {
        estNorme = true
        valeur = `${prefixe} ${j}`
      } else if (suiteNumero) {
        valeur = `${prefixe} ${j}`
      }
    }
    courant = estNorme ? 'normes' : 'constructeurs'
    const m = valeur.match(/^([A-Za-zÀ-ÿ]+)\s/)
    if (m) prefixe = m[1]
    ;(estNorme ? normes : constructeurs).push(valeur)
  }
  return { normes, constructeurs }
}

/* ── Produit fusionné ─────────────────────────────────────────────────── */

export interface ProduitCatalogue {
  slug: string
  /** Rang dans la liste du fabricant (les produits hors liste passent après). */
  ordre: number
  nom: string
  entree: Produit
  /** Données fabricant trouvées pour ce produit ? */
  fabricant: boolean
  gamme: string
  usage: string
  baseTexte: string
  base: BaseId
  libelleBase: string
  description: string
  viscosites: string[]
  normes: string[]
  constructeurs: string[]
  normesCourtes: string
  conditionnements: string[]
  accroche: string
  pointsForts: string[]
  normesPrincipales: string[]
  vehicules: string[]
  distinction: string
  /** Grade lisible sur l'étiquette de la photo (ex. « 0W-40 »). */
  gradePhoto?: string
  /** Photo « inexacte » ou « à vérifier » : mention « Photo non contractuelle ». */
  photoNonContractuelle: boolean
  /** Indice de la variante à sélectionner par défaut (celle de la photo). */
  defaut: number
  variantes: Variante[]
  chiffresCles: Array<{ libelle: string; valeur: string }>
  photo?: ImageMetadata
  disponible: boolean
  prix: number | null | undefined
  source?: string
  dateReleve?: string
  texteRecherche: string
}

const majuscule = (t: string) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t)

/** Statut de la photo (photos-produits.json) : exacte, variante, inexacte, a_verifier, ia (générée, pas de photo fabricant). */
function infosPhoto(id?: string) {
  const m = id
    ? (photosMeta as Record<string, { variantes?: Record<string, string>; correspondance?: string }>)[id]
    : undefined
  const gradePhoto = m?.variantes ? Object.keys(m.variantes)[0] : undefined
  const statut = m?.correspondance
  return { gradePhoto, nonContractuelle: statut === 'inexacte' || statut === 'a_verifier' || statut === 'ia' }
}

/** Variante montrée par la photo ; à défaut 5W-30 / 15W-40, puis la première. */
export function indiceDefaut(variantes: Variante[], grade?: string): number {
  if (grade) {
    const i = variantes.findIndex((v) => compact(v.libelle) === compact(grade))
    if (i >= 0) return i
  }
  return Math.max(0, variantes.findIndex((v) => ['5W-30', '15W-40'].includes(v.libelle)))
}

export function construireProduit(entree: Produit, secteurNom?: string): ProduitCatalogue {
  const brut = trouverBrut(entree.data.nom)
  const base = categorieBase(brut?.base)
  const { normes, constructeurs } = separerNormes(brut?.normes)
  const variantes = brut ? construireVariantes(brut) : []
  const iso = ((brut?.grades_iso ?? []) as string[]).map((g) => `ISO ${g}`)
  const viscosites = iso.length ? iso : ((brut?.viscosite_sae ?? []) as string[])
  const nom = (brut?.nom ?? entree.data.nom).replace(/^Petrov\S*\s+/i, '')
  const gamme = brut?.gamme ?? secteurNom ?? 'Produits'
  // Fiche fabricant : seuls les formats prouvés (vide = « nous consulter »). Produit hors liste : texte de l'admin.
  const conditionnements = brut
    ? ((brut as { conditionnements?: string[] }).conditionnements ?? []).slice()
    : entree.data.conditionnement
      ? entree.data.conditionnement.split(/\s*,\s*/)
      : []
  const ext = (brut ?? {}) as {
    id?: string
    accroche?: string
    points_forts?: string[]
    normes_principales?: string[]
    vehicules?: string[]
    distinction?: string
  }
  const { gradePhoto, nonContractuelle } = infosPhoto(ext.id)

  const api = normes.find((n) => /^API\s/i.test(n))?.replace(/^API\s+/i, '')
  const acea = normes.find((n) => /^ACEA\s/i.test(n))?.replace(/^ACEA\s+/i, '')
  const chiffresCles = [
    ...(api ? [{ libelle: 'Norme API', valeur: api }] : []),
    ...(acea ? [{ libelle: 'Norme ACEA', valeur: acea }] : []),
  ]
  const usage = (brut?.usage ?? '').replace(/\s*;\s*(\S)/g, (_m, c: string) => `. ${c.toUpperCase()}`).replace(/\.?\s*$/, '.')
  return {
    slug: entree.id,
    ordre: brut ? donnees.indexOf(brut) : 999,
    nom,
    entree,
    fabricant: Boolean(brut),
    gamme,
    usage: usageDeGamme(brut?.gamme),
    baseTexte: brut?.base ?? '',
    base,
    libelleBase: LIBELLE_BASE[base],
    description: brut ? majuscule(usage) : '',
    viscosites,
    normes,
    constructeurs,
    normesCourtes: normes.slice(0, 2).join(' · '),
    conditionnements,
    accroche: ext.accroche ?? '',
    pointsForts: ext.points_forts ?? [],
    normesPrincipales: ext.normes_principales ?? [],
    vehicules: ext.vehicules ?? [],
    distinction: ext.distinction ?? '',
    gradePhoto,
    photoNonContractuelle: nonContractuelle,
    defaut: indiceDefaut(variantes, gradePhoto),
    variantes,
    chiffresCles,
    photo: trouverPhoto(brut) ?? entree.data.photos[0],
    disponible: entree.data.disponible,
    prix: entree.data.prix,
    source: brut?.source,
    dateReleve: brut?.date_releve,
    texteRecherche: simplifier(
      [nom, gamme, viscosites.join(' '), brut?.normes, brut?.base, entree.data.nom].filter(Boolean).join(' '),
    ),
  }
}

/** Date ISO → « 3 octobre 2026 ». */
export function dateLongue(iso?: string): string {
  if (!iso) return ''
  const d = new Date(`${iso}T12:00:00Z`)
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

/** Types de véhicules du JSON → libellé lisible et icône (IconeUsage). */
export const VEHICULES: Record<string, { label: string; icone: string }> = {
  voiture: { label: 'Voiture', icone: 'voiture' },
  '4x4': { label: '4×4 et SUV', icone: '4x4' },
  camion: { label: 'Camion', icone: 'camion' },
  bus: { label: 'Bus', icone: 'bus' },
  engin: { label: 'Engin de chantier', icone: 'engin' },
  moto: { label: 'Moto', icone: 'moto' },
  bateau: { label: 'Bateau', icone: 'marine' },
  industrie: { label: 'Industrie', icone: 'usine' },
}
