/**
 * fix-bidon-texture.mjs — Injecte la base color CORRIGEE (rouges parasites
 * supprimes : capuchon + elements du libelle conserves) et passe
 * metallicFactor a 0 sur les GLB du bidon.
 *
 * ENTREE (par ordre de priorite) :
 *   1. assets-source/bidon-basecolor-clean[-768].webp  -> nettoyage fin par
 *      scripts/clean-basecolor-red.py (blobs < 2500 px entoures de plastique) ;
 *      supprime le rouge qui "bave" le long des coutures UV aux mipmaps.
 *   2. assets-source/bidon-basecolor-fixed[-768].webp  -> correction precedente
 *      (genere par fix-red.py / verify-fix.py hors repo, conservee en source).
 * CIBLES : public/models/bidon.glb (1024) + public/models/bidon-lite.glb (768)
 *          (ou les cibles passees en argv)
 * Idempotent : re-injectable apres chaque `npm run bidon:compress`.
 * USAGE : node scripts/fix-bidon-texture.mjs [cible.glb ...]
 */
import { copyFileSync, existsSync, readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import draco3d from 'draco3dgltf';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_TEX = {
  1024: [
    join(ROOT, 'assets-source', 'bidon-basecolor-clean.webp'),
    join(ROOT, 'assets-source', 'bidon-basecolor-fixed.webp'),
  ],
  768: [
    join(ROOT, 'assets-source', 'bidon-basecolor-clean-768.webp'),
    join(ROOT, 'assets-source', 'bidon-basecolor-fixed-768.webp'),
  ],
};
/** Premiere texture existante de la liste (clean > fixed). */
const pickTex = (px) => SOURCE_TEX[px].find((p) => existsSync(p));

const targets = process.argv.slice(2);
if (targets.length === 0) {
  targets.push(join(ROOT, 'public', 'models', 'bidon.glb'));
  targets.push(join(ROOT, 'public', 'models', 'bidon-lite.glb'));
}

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({
    'draco3d.decoder': await draco3d.createDecoderModule(),
    'draco3d.encoder': await draco3d.createEncoderModule(),
  });
let ko = 0;

for (const file of targets) {
  if (!existsSync(file)) { console.log(`⏭  absent : ${file}`); continue; }
  const px = file.includes('-lite') ? 768 : 1024;
  const texPath = pickTex(px);
  if (!texPath) {
    console.error(`❌ aucune texture corrigee pour ${px}px (attendu : bidon-basecolor-clean-${px}.webp)`);
    ko++;
    continue;
  }

  // ⚠️ Le backup vit HORS de public/ : un .bak dans public/models serait
  // déployé sur Cloudflare (2,7 Mo de poids mort servi aux visiteurs).
  const bak = join(ROOT, 'assets-source', basename(file).replace(/\.glb$/, '.pre-redfix.bak'));
  if (!existsSync(bak)) copyFileSync(file, bak);

  const doc = await io.read(file);
  const mat = doc.getRoot().listMaterials()[0];
  if (!mat) { console.error(`❌ aucun materiau : ${file}`); ko++; continue; }

  const bc = mat.getBaseColorTexture();
  if (!bc) { console.error(`❌ pas de baseColorTexture : ${file}`); ko++; continue; }
  const before = bc.getImage()?.length ?? 0;
  bc.setImage(new Uint8Array(readFileSync(texPath)));
  bc.setMimeType('image/webp');

  const prevMetal = mat.getMetallicFactor();
  mat.setMetallicFactor(0);

  await io.write(file, doc);
  const after = bc.getImage().length;
  console.log(`✅ ${file}\n   baseColor ${(before / 1024).toFixed(0)} -> ${(after / 1024).toFixed(0)} Ko (${px}px, source ${basename(texPath)})` +
              ` | metallicFactor ${prevMetal} -> 0 | backup : ${bak}`);
}
process.exit(ko === 0 ? 0 : 1);