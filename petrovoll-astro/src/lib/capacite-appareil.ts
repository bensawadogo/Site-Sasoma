/**
 * capacite-appareil.ts — niveau de puissance de l'appareil : « faible | moyen | fort ».
 *
 * Public visé : beaucoup de téléphones Android d'entrée de gamme (1-3 Go de RAM, 4 cœurs
 * lents) et une connexion 3G faible. Le niveau est posé TRÈS tôt par un script inline dans
 * le <head> (BaseLayout) sur <html data-appareil="…"> ; les composants lourds (hero, bidon
 * au scroll, bandes défilantes) le lisent ensuite avec `lireNiveau()`.
 *
 * Règles (une valeur inconnue — Safari, Firefox — ne pénalise jamais) :
 *   faible : économiseur de données, réseau 2g/slow-2g, RAM ≤ 2 Go, ≤ 2 cœurs,
 *            ou réseau 3g combiné à une RAM ≤ 4 Go.
 *   moyen  : réseau 3g ou RAM ≤ 4 Go.
 *   (Le nombre de cœurs ne classe « moyen » personne : un PC de bureau à 4 cœurs et 8 Go est fort,
 *   et les téléphones d'entrée de gamme annoncent souvent 8 cœurs lents ; seul ≤ 2 cœurs est faible.)
 *   fort   : tout le reste (ordinateur, téléphone récent).
 *   « Mouvement réduit » : fait passer moyen → faible, mais seulement si l'appareil a déjà
 *   un signal de faiblesse. Il ne dégrade JAMAIS à lui seul un appareil puissant (le PC du
 *   propriétaire a les animations Windows coupées et doit rester « fort »).
 *
 * Test : ajouter `?appareil=faible|moyen|fort` à l'adresse force le niveau.
 *
 * ⚠️ SCRIPT_APPAREIL reproduit `niveauAppareil` en ES5, sans dépendance, pour être inséré
 *    tel quel dans le <head>. capacite-appareil.test.ts vérifie que les deux restent d'accord.
 */

export type NiveauAppareil = 'faible' | 'moyen' | 'fort'

export interface SignauxAppareil {
  /** navigator.deviceMemory (Go, arrondi par le navigateur) — absent hors Chromium. */
  memoire?: number | null
  /** navigator.hardwareConcurrency */
  coeurs?: number | null
  /** navigator.connection.saveData */
  economiseur?: boolean | null
  /** navigator.connection.effectiveType : 'slow-2g' | '2g' | '3g' | '4g' */
  reseau?: string | null
  /** prefers-reduced-motion: reduce */
  mouvementReduit?: boolean | null
}

export function niveauAppareil(s: SignauxAppareil): NiveauAppareil {
  const memoire = typeof s.memoire === 'number' && s.memoire > 0 ? s.memoire : null
  const coeurs = typeof s.coeurs === 'number' && s.coeurs > 0 ? s.coeurs : null
  const reseau = s.reseau ?? ''
  const reseau2g = reseau === '2g' || reseau === 'slow-2g'
  const reseau3g = reseau === '3g'
  const memoireJuste = memoire !== null && memoire <= 4

  if (s.economiseur || reseau2g) return 'faible'
  if ((memoire !== null && memoire <= 2) || (coeurs !== null && coeurs <= 2)) return 'faible'
  if (reseau3g && memoireJuste) return 'faible'

  const moyen = reseau3g || memoireJuste
  if (!moyen) return 'fort'
  return s.mouvementReduit ? 'faible' : 'moyen'
}

/** Niveau forcé par `?appareil=…` (tests), sinon null. */
export function niveauForce(recherche: string): NiveauAppareil | null {
  const m = /[?&]appareil=(faible|moyen|fort)(?:&|$)/.exec(recherche)
  return m ? (m[1] as NiveauAppareil) : null
}

interface NavigatorEtendu {
  deviceMemory?: number
  hardwareConcurrency?: number
  connection?: { saveData?: boolean; effectiveType?: string }
}

/** Lit les signaux du navigateur courant (à n'appeler que côté client). */
export function lireSignaux(): SignauxAppareil {
  const nav = navigator as Navigator & NavigatorEtendu
  let reduit = false
  try {
    reduit = matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    /* matchMedia absent : on suppose « pas de réduction » */
  }
  return {
    memoire: nav.deviceMemory,
    coeurs: nav.hardwareConcurrency,
    economiseur: nav.connection?.saveData,
    reseau: nav.connection?.effectiveType,
    mouvementReduit: reduit,
  }
}

/**
 * Niveau de l'appareil courant : celui posé par le <head> (`data-appareil`), sinon recalculé.
 * Sûr en SSR (renvoie « fort », le comportement historique).
 */
export function lireNiveau(): NiveauAppareil {
  if (typeof document === 'undefined') return 'fort'
  const pose = document.documentElement.dataset.appareil
  if (pose === 'faible' || pose === 'moyen' || pose === 'fort') return pose
  return niveauForce(location.search) ?? niveauAppareil(lireSignaux())
}

/**
 * Script inline du <head> : pose `data-appareil` avant le premier rendu.
 * ES5, sans dépendance, sans jamais lever d'erreur (en cas d'échec : aucun attribut = « fort »).
 */
export const SCRIPT_APPAREIL = `(function(){try{
var d=document.documentElement,n=navigator,c=n.connection||{},m=n.deviceMemory,k=n.hardwareConcurrency,t=c.effectiveType||'',r=false;
var f=/[?&]appareil=(faible|moyen|fort)(?:&|$)/.exec(location.search);
if(f){d.setAttribute('data-appareil',f[1]);return}
try{r=matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}
m=typeof m==='number'&&m>0?m:null;k=typeof k==='number'&&k>0?k:null;
var g2=t==='2g'||t==='slow-2g',g3=t==='3g',mj=m!==null&&m<=4,v;
if(c.saveData||g2||(m!==null&&m<=2)||(k!==null&&k<=2)||(g3&&mj))v='faible';
else if(!(g3||mj))v='fort';
else v=r?'faible':'moyen';
d.setAttribute('data-appareil',v)
}catch(e){}})();`
