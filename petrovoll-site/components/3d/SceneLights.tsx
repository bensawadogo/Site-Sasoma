'use client'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * SceneLights — éclairage de la scène 3D du bidon PETROVOLL
 * ────────────────────────────────────────────────────────────────────────────
 * Direction artistique : éclairage « studio industriel ».
 *   • contraste marqué (fond noir profond)
 *   • reflet chaud ambré (#F5A623) pour valoriser le plastique
 *   • rim light rouge (#D4420A) pour détacher le bidon du fond sombre
 *
 * ⚠️  Ne pas multiplier les sources : chaque lumière dynamique coûte en
 *     performance (surtout avec `shadows`). Viser 3 à 4 sources maximum.
 *
 * TODO [3d] :
 *  - [ ] Ajouter un <Environment /> (HDRI) une fois le rendu plastique validé :
 *        un HDRI local dans /public/hdri/ donne le meilleur compromis
 *        fidélité / latence (éviter les presets téléchargés depuis un CDN)
 *  - [ ] Régler l'exposition globale via `gl={{ toneMappingExposure }}` du Canvas
 *  - [ ] Désactiver les ombres si <PerformanceMonitor /> détecte un FPS bas
 *  - [ ] Éviter le <spotLight> avec `castShadow` sur mobile (coût élevé)
 */

export default function SceneLights() {
  return (
    <>
      {/* Lumière ambiante : évite les noirs bouchés */}
      <ambientLight intensity={0.35} color="#FFFFFF" />

      {/* Lumière principale (key light) — légèrement en haut à droite */}
      <directionalLight
        position={[3.2, 4.5, 2.6]}
        intensity={2.1}
        color="#FFFFFF"
        castShadow
        // TODO [perf] : réduire la résolution de la shadow map sur mobile
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0004}
      />

      {/* Rim light rouge/orange : détache la silhouette du fond noir */}
      <directionalLight position={[-3.5, 1.4, -3]} intensity={1.15} color="#D4420A" />

      {/* Fill light ambrée sous l'objet : reflets chauds sur le plastique */}
      <pointLight position={[0, -1.8, 1.6]} intensity={0.9} color="#F5A623" />

      {/* TODO [3d] : <spotLight castShadow angle={0.4} penumbra={1} …> pour un
          vrai packshot produit (à activer seulement si le FPS le permet). */}
    </>
  )
}