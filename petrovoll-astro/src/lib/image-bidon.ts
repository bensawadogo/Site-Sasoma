/**
 * Image fixe du bidon (rendue depuis la scène 3D, même cadrage) : image
 * d'attente du bidon 3D (Produit phare) et visuel par défaut des lubrifiants
 * sans photo.
 * Importée depuis src/assets : Astro ajoute une empreinte au nom de fichier,
 * une nouvelle version n'est donc jamais masquée par le cache du navigateur.
 */
import image400 from '@/assets/bidon/bidon-400.webp'
import image800 from '@/assets/bidon/bidon-800.webp'

export const IMAGE_BIDON = {
  src: image800.src,
  srcset: `${image400.src} 400w, ${image800.src} 800w`,
}
