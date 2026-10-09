/**
 * Réglages de la section « produit phare » au scroll (src/components/home/ProduitScroll.astro).
 * À modifier ici, sans toucher au composant. La lumière du rendu lui-même (Blender) se règle
 * en tête de ops/blender/bidon_studio.py (EXPOSITION, CLE, LISERES…), puis :
 *   blender -b -P ops/blender/bidon_studio.py -- assets/ai/bidon-studio/tour 48 640 24 -1 -30
 *   python ops/scripts/sequence_bidon.py
 */
export const PRODUIT_SCROLL = {
  /** Luminosité du bidon à l'écran (1 = rendu Blender tel quel ; 0,9 = 10 % plus sombre). */
  luminositeBidon: 1,
  /** Luminosité du studio derrière le bidon (1 = image d'origine). */
  luminositeFond: 1,
  /** Longueur du défilement de la section, en hauteurs d'écran (le bidon fait un tour complet). */
  hauteurDefilement: 2.8,
}
