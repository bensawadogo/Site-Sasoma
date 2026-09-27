'use client'

import { ContactShadows, OrbitControls, Preload } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'

import BidonModel from '@/components/3d/BidonModel'
import SceneLights from '@/components/3d/SceneLights'

/**
 * ═════════════════════════════════════════════════════════════════════════════
 *  BidonScene — canvas R3F du bidon d'huile PETROVOLL (hero section)
 * ═════════════════════════════════════════════════════════════════════════════
 *  Ce composant est monté DYNAMIQUEMENT (`next/dynamic`, ssr: false) depuis
 *  HeroSection : Three.js ne fonctionne pas côté serveur (pas de WebGL).
 *
 *  ⚠️  Placeholder : la scène affiche une géométrie de substitution
 *      (voir BidonModel.tsx). Aucun fichier .glb réel n'est encore chargé.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  CÂBLER LE MODÈLE 3D RÉEL DU BIDON — PROCÉDURE PAS À PAS
 * ─────────────────────────────────────────────────────────────────────────────
 *  1) Déposer le modèle dans :  public/models/petrovoll-bidon.glb
 *     Contraintes recommandées pour le web :
 *        • format .glb (glTF binaire), textures embarquées
 *        • < 3 Mo idéalement (le trafic mobile 3G/4G est majoritaire)
 *        • échelle métrique cohérente, pivot centré à l'origine, Y vers le haut
 *        • nommer les matériaux/meshes (« Bidon », « Etiquette_PETROVOLL »)
 *        • compression Draco et/ou textures KTX2 si le fichier dépasse 3 Mo
 *
 *  2) Charger le modèle dans components/3d/BidonModel.tsx avec drei :
 *
 *        import { useGLTF } from '@react-three/drei'
 *
 *        const MODELE = process.env.NEXT_PUBLIC_BIDON_MODEL_PATH
 *                       ?? '/models/petrovoll-bidon.glb'
 *
 *        export default function BidonModel() {
 *          const { nodes, materials } = useGLTF(MODELE)
 *          return (
 *            <group dispose={null}>
 *              <primitive object={nodes.Bidon} />
 *              <primitive object={nodes.Etiquette} />
 *            </group>
 *          )
 *        }
 *
 *        useGLTF.preload(MODELE)   // évite le temps mort à l'apparition
 *
 *     → NE PAS activer Draco si le fichier n'est pas compressé.
 *       Avec Draco : useGLTF(MODELE, true) + décodeurs disponibles, ou
 *       useGLTF.setDecoderPath('/draco/').
 *
 *  3) Si le .glb est compressé en Draco, copier les décodeurs :
 *        node_modules/three/examples/jsm/libs/draco/  →  public/draco/
 *     (sinon le chargement échoue silencieusement en production)
 *
 *  4) Fallback 2D dans HeroSection pour les appareils sans WebGL :
 *        NEXT_PUBLIC_DISABLE_3D === 'true'  →  <Image src="…bidon.png" />
 *     + détection dynamique de la perte de contexte WebGL.
 *
 *  5) Performance sur mobile (priorité du marché ouest-africain) :
 *        • `dpr={[1, 2]}` (ci-dessous) limite le pixel ratio
 *        • <PerformanceMonitor /> / <AdaptiveDpr /> (drei) pour dégrader
 *          automatiquement si le FPS chute
 *        • préférer un HDRI local dans /public/hdri/ aux presets CDN de drei
 *
 *  6) SEO / accessibilité : la scène est purement décorative → le conteneur
 *     porte `aria-hidden`, et HeroSection fournit le texte alternatif.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface BidonSceneProps {
  /** Active/désactive la rotation automatique du bidon. */
  rotationAuto?: boolean
}

export default function BidonScene({ rotationAuto = true }: BidonSceneProps) {
  return (
    <div aria-hidden className="h-full w-full">
      <Canvas
        // Caméra frontale légèrement surélevée → rendu « packshot » produit
        camera={{ position: [0, 0.4, 5.5], fov: 42 }}
        // Limite le pixel ratio (GPU mobile) — TODO [perf] : affiner après mesures
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        shadows
        className="canvas-3d"
        // TODO [perf] : `frameloop="demand"` si la scène devient statique
      >
        <Suspense fallback={null}>
          {/* Éclairage industriel (contraste marqué, reflets plastique) */}
          <SceneLights />

          {/* Le bidon PETROVOLL (placeholder — voir BidonModel.tsx) */}
          <BidonModel />

          {/* Ombre portée au sol : ancre visuellement l'objet */}
          <ContactShadows
            position={[0, -1.35, 0]}
            opacity={0.55}
            scale={8}
            blur={2.6}
            far={4}
            color="#000000"
          />

          {/* TODO [3d] : <Environment preset="studio" /> ou HDRI local
              (un HDRI local dans /public/hdri/ est préférable : fiabilité
              hors ligne et latence réduite pour les visiteurs en 3G). */}

          {/* TODO [3d] : <Float speed={1.2} rotationIntensity={0.2}
                          floatIntensity={0.6}> … </Float> (léger flottement) */}

          {/* Précompile les shaders → évite les micro-freezes à l'apparition */}
          <Preload all />
        </Suspense>

        {/* Contrôles : rotation seule (zoom/pan désactivés → évite de bloquer
            le scroll de la page sur mobile) */}
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableDamping
          dampingFactor={0.06}
          autoRotate={rotationAuto}
          autoRotateSpeed={1.1}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={(Math.PI * 2) / 3}
          // TODO [3d] : couper `autoRotate` sur les appareils tactiles
          // (rotation auto + scroll vertical = expérience confuse)
        />

        {/* TODO [perf] : <PerformanceMonitor onDecline={…} /> et <AdaptiveDpr /> */}
      </Canvas>
    </div>
  )
}