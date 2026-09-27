/**
 * build-bidon.mjs — Génère les deux modèles du bidon depuis le scan original.
 *
 *   assets-source/bidon-meshy.glb (538k triangles, textures 4096 px, 33 Mo)
 *     → src/assets/bidon/bidon.glb       ordinateurs : ~269k triangles, couleur + relief 2048 px
 *     → src/assets/bidon/bidon-lite.glb  smartphones : ~161k triangles, couleur 2048, relief 1024 px
 *   (dans src/assets : Astro ajoute une empreinte au nom de fichier, un navigateur
 *    ne peut donc jamais garder une ancienne version en cache)
 *
 * CE QUI DONNAIT L'ASPECT « VIEUX BIDON USÉ » (corrigé ici) :
 *   - géométrie trop simplifiée (35k triangles) : le relief (normal map) est
 *     calculé pour la forme d'origine ; posé sur une forme trop simplifiée il
 *     crée des creux et des bosses → bidon « cabossé ». Au-dessus de ~160k
 *     triangles la surface redevient lisse (vérifié en rendu taille téléphone) ;
 *   - texture de couleur en 1024 px : étiquette granuleuse et points rouges ;
 *     2048 px la rend nette comme l'original ;
 *   - normal map compressée à 17 Ko → marques ; ici WebP qualité 95 ;
 *   - un script de « correction » qui effaçait les rouges de la texture et
 *     barbouillait l'étiquette → supprimé, la texture du scan n'est plus retouchée ;
 *   - rugosité et relief du scan (surface irrégulière de la photogrammétrie)
 *     → plastique satiné uniforme + relief atténué de moitié.
 *
 * USAGE : npm run bidon:build
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, EXTTextureWebP } from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';
import sharp from 'sharp';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const CLI = join(RACINE, 'node_modules', '@gltf-transform', 'cli', 'bin', 'cli.js');
const SOURCE = join(RACINE, 'assets-source', 'bidon-meshy.glb');
const TRAVAIL = join(RACINE, '.tmp-bidon');

const SORTIE = join(RACINE, 'src', 'assets', 'bidon');

const VARIANTES = [
  // triangles : budget GPU ; couleur / relief : taille des textures (px) ; poidsMax : budget réseau (Mo)
  { nom: 'bidon', ratio: 0.5, couleur: 2048, relief: 2048, triangles: [200_000, 320_000], poidsMax: 2 },
  { nom: 'bidon-lite', ratio: 0.3, couleur: 2048, relief: 1024, triangles: [120_000, 200_000], poidsMax: 1.3 },
];

const gltf = (...args) => execFileSync(process.execPath, [CLI, ...args], { cwd: RACINE, stdio: 'pipe' });
const mo = (f) => `${(statSync(f).size / 1048576).toFixed(2)} Mo`;

async function texturer(fichier, { couleur: tailleCouleur, relief: tailleRelief }) {
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
    'draco3d.decoder': await draco3d.createDecoderModule(),
    'draco3d.encoder': await draco3d.createEncoderModule(),
  });
  const doc = await io.read(fichier);
  const materiau = doc.getRoot().listMaterials()[0];
  const couleur = materiau.getBaseColorTexture();
  const relief = materiau.getNormalTexture();
  const rugosite = materiau.getMetallicRoughnessTexture();

  // Couleur : Lanczos (net), WebP qualité 88.
  couleur.setImage(await sharp(couleur.getImage()).resize(tailleCouleur, tailleCouleur).webp({ quality: 88, effort: 6 }).toBuffer());
  couleur.setMimeType('image/webp');

  // Relief : compression douce — une normal map trop compressée crée des
  // bosses qui font « plastique usé ». Intensité réduite de moitié : le scan
  // capte les irrégularités de surface, un bidon neuf est lisse.
  relief.setImage(await sharp(relief.getImage()).resize(tailleRelief, tailleRelief).webp({ quality: 95, effort: 6 }).toBuffer());
  relief.setMimeType('image/webp');
  materiau.setNormalScale(0.5);

  // Plastique satiné uniforme à la place de la rugosité du scan (irrégulière,
  // elle donnait un aspect sale). Une texture de moins à télécharger.
  materiau.setMetallicRoughnessTexture(null);
  rugosite.dispose();
  materiau.setMetallicFactor(0);
  materiau.setRoughnessFactor(0.42);

  doc.createExtension(EXTTextureWebP).setRequired(true);
  await io.write(fichier, doc);
}

function compterTriangles(fichier) {
  const b = execFileSync(process.execPath, [CLI, 'inspect', fichier, '--format', 'csv'], { cwd: RACINE }).toString();
  const ligne = b.split('\n').find((l) => l.includes('TRIANGLES'));
  return ligne ? Number(ligne.split(',').map((c) => c.replace(/"/g, '').replace(/\s/g, ''))[4]) : NaN;
}

if (!existsSync(SOURCE)) {
  console.error(`❌ Scan original introuvable : ${SOURCE}`);
  process.exit(3);
}
rmSync(TRAVAIL, { recursive: true, force: true });
mkdirSync(TRAVAIL, { recursive: true });
mkdirSync(SORTIE, { recursive: true });

let echecs = 0;
try {
  gltf('weld', SOURCE, join(TRAVAIL, 'soude.glb'));
  for (const v of VARIANTES) {
    const simplifie = join(TRAVAIL, `${v.nom}-simplifie.glb`);
    const destination = join(SORTIE, `${v.nom}.glb`);
    gltf('simplify', join(TRAVAIL, 'soude.glb'), simplifie, '--ratio', String(v.ratio), '--error', '0.0003');
    await texturer(simplifie, v);
    rmSync(destination, { force: true });
    gltf('draco', simplifie, destination); // Draco toujours en dernier

    const triangles = compterTriangles(destination);
    const poids = statSync(destination).size / 1048576;
    const okTri = triangles >= v.triangles[0] && triangles <= v.triangles[1];
    const okPoids = poids <= v.poidsMax;
    console.log(
      `${okTri && okPoids ? '✅' : '❌'} ${v.nom}.glb — ${triangles.toLocaleString('fr-FR')} triangles, ` +
        `couleur ${v.couleur} px, relief ${v.relief} px, ${mo(destination)} (max ${v.poidsMax} Mo)`,
    );
    if (!okTri || !okPoids) echecs++;
  }
} finally {
  rmSync(TRAVAIL, { recursive: true, force: true });
}
if (echecs) process.exit(7);
console.log('👉 Pense à régénérer l’image d’attente (src/assets/bidon/bidon-*.webp) si le rendu a changé.');
