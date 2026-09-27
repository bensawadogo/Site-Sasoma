# public/models

Modèles 3D (formats `.glb` / `.gltf`) utilisés par les scènes React Three Fiber.

## Fichier attendu

| Fichier                     | Usage                                    |
| --------------------------- | ---------------------------------------- |
| `petrovoll-bidon.glb`       | Bidon d'huile PETROVOLL (hero section)   |

Le chemin est paramétrable via `NEXT_PUBLIC_BIDON_MODEL_PATH`
(voir `.env.local.example`).

## Cahier des charges du modèle (export 3D)

- Format **glTF binaire (.glb)** avec textures embarquées.
- **Poids < 3 Mo** — la majorité du trafic visé est mobile (3G/4G).
  Au-delà : compression **Draco** (géométrie) et/ou **KTX2/Basis** (textures),
  et copier les décodeurs dans `public/draco/` (voir `components/3d/BidonScene.tsx`).
- Échelle métrique cohérente, **pivot centré à l'origine**, axe **Y vers le haut**.
- Meshes et matériaux **nommés explicitement** (`Bidon`, `Etiquette_PETROVOLL`)
  pour un ciblage fiable dans le code (`nodes.Bidon`).
- Matériaux **PBR** : plastique HDPE (roughness ≈ 0.35, clearcoat léger).
- Étiquette : texture fournie par le client, à jour de la marque PETROVOLL.

## Rappel

Les `.glb` sont ignorés par Git (voir `.gitignore`) : ils sont livrés par le
client / le studio 3D et déposés directement sur l'environnement cible.
Pour un déploiement reproductible, stocker ces fichiers dans un bucket
(S3 / Backblaze B2 / Cloudflare R2) et adapter `NEXT_PUBLIC_BIDON_MODEL_PATH`.

## TODO

- [ ] Récupérer le `.glb` définitif et le valider (poids, orientation, nommage)
- [ ] Tester le rendu sur un mobile d'entrée de gamme réel
- [ ] Prévoir le fallback 2D (image Cloudinary) si la 3D est indisponible
