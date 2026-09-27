'use client'

import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group } from 'three'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * BidonModel — bidon d'huile PETROVOLL (placeholder géométrique)
 * ────────────────────────────────────────────────────────────────────────────
 * ÉTAT ACTUEL : simple cylindre aux couleurs de la marque, animé en rotation.
 * Aucun asset externe n'est chargé → la scène tourne sans fichier .glb.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * COMMENT CÂBLER LE VRAI MODÈLE .glb (voir aussi le guide dans BidonScene.tsx)
 * ─────────────────────────────────────────────────────────────────────────────
 *  Remplacer TOUT le contenu de ce fichier par :
 *
 *    'use client'
 *    import { useGLTF } from '@react-three/drei'
 *    import { useRef } from 'react'
 *    import type { Group } from 'three'
 *
 *    // Chemin défini dans .env.local (NEXT_PUBLIC_BIDON_MODEL_PATH)
 *    const CHEMIN_MODELE =
 *      process.env.NEXT_PUBLIC_BIDON_MODEL_PATH ?? '/models/petrovoll-bidon.glb'
 *
 *    export default function BidonModel() {
 *      const groupe = useRef<Group>(null)
 *      // `nodes` = meshes nommés du .glb, `materials` = matériaux exportés
 *      const { nodes, materials } = useGLTF(CHEMIN_MODELE)
 *
 *      // Rotation continue du bidon
 *      useFrame((_etat, delta) => {
 *        if (groupe.current) groupe.current.rotation.y += delta * 0.35
 *      })
 *
 *      return (
 *        <group ref={groupe} dispose={null}>
 *          <primitive object={nodes.Bidon} />
 *          <primitive object={nodes.Etiquette} />
 *        </group>
 *      )
 *    }
 *
 *    // Préchargement : évite le temps mort à l'arrivée dans le viewport
 *    useGLTF.preload(CHEMIN_MODELE)
 *
 *  POINTS DE VIGILANCE :
 *   • Le nom des nœuds (`nodes.Bidon`) doit correspondre EXACTEMENT aux meshes
 *     exportés ; inspecter le .glb au préalable (gltf.report / Blender).
 *   • `dispose={null}` si vous réutilisez le même modèle plusieurs fois.
 *   • Pour un rendu « premium » : PBR avec roughness ~0.35 et clearcoat léger
 *     (meshPhysicalMaterial) pour simuler le plastique HDPE du bidon.
 *   • Si le .glb utilise Draco/KTX2, configurer le décodeur (voir BidonScene).
 *   • Charger le composant via <Suspense> (déjà fait dans BidonScene).
 *
 * TODO [3d] :
 *  - [ ] Recevoir le vrai .glb et le placer dans public/models/
 *  - [ ] Câbler l'étiquette PETROVOLL (texture ou mesh dédié, marque à jour)
 *  - [ ] Prévoir une variante « bidon 1 L / 5 L / 20 L » si le client le souhaite
 *  - [ ] Ajouter le reflet d'environnement (Environment) pour le réalisme plastique
 */

export interface BidonModelProps {
  /** Vitesse de rotation (radians/seconde). 0 = statique. */
  vitesseRotation?: number
}

export default function BidonModel({ vitesseRotation = 0.35 }: BidonModelProps) {
  const groupe = useRef<Group>(null)

  // Rotation continue du bidon autour de l'axe vertical (Y)
  useFrame((_etat, delta) => {
    if (groupe.current) {
      groupe.current.rotation.y += delta * vitesseRotation
    }
  })

  return (
    <group ref={groupe} dispose={null} position={[0, 0, 0]}>
      {/*
        PLACEHOLDER : corps du bidon (cylindre + poignée + bouchon).
        À REMPLACER intégralement par le <primitive object={nodes…} /> du .glb.
      */}
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <cylinderGeometry args={[0.62, 0.62, 1.9, 48]} />
        {/* Plastique HDPE rouge/orange de la marque */}
        <meshPhysicalMaterial
          color="#D4420A"
          roughness={0.35}
          metalness={0.05}
          clearcoat={0.35}
          clearcoatRoughness={0.4}
        />
      </mesh>

      {/* Bouchon au sommet du bidon */}
      <mesh castShadow position={[0.24, 1.02, 0]}>
        <cylinderGeometry args={[0.14, 0.16, 0.18, 24]} />
        <meshStandardMaterial color="#0A0A0A" roughness={0.5} metalness={0.2} />
      </mesh>

      {/* Poignée intégrée */}
      <mesh castShadow position={[-0.26, 0.92, 0]} rotation={[0, 0, 0.15]}>
        <torusGeometry args={[0.17, 0.035, 12, 32, Math.PI]} />
        <meshStandardMaterial color="#D4420A" roughness={0.4} />
      </mesh>

      {/* Étiquette PETROVOLL — TODO [3d] : texture réelle de l'étiquette
          (map: '/images/etiquette-petrovoll.webp') */}
      <mesh position={[0, -0.1, 0.625]}>
        <planeGeometry args={[0.85, 0.95]} />
        <meshStandardMaterial color="#F5A623" roughness={0.6} />
      </mesh>

      {/* TODO [3d] : supprimer ces placeholders une fois le .glb câblé */}
    </group>
  )
}