/**
 * copy-draco-decoders.mjs — Agent RENDU (partie 1/2) : copie les decodeurs
 * Draco WASM de three vers public/draco/ pour le chargement navigateur.
 * Sans eux, GLTFLoader echoue sur un GLB comprime en Draco.
 * USAGE : npm run bidon:decoders | EXIT 0 = OK, 9 = three introuvable.
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'node_modules', 'three', 'examples', 'jsm', 'libs', 'draco');
const DST = join(ROOT, 'public', 'draco');

if (!existsSync(SRC)) {
  console.error('❌ Decodeurs introuvables : lance `npm install three` d\'abord.');
  process.exit(9);
}
mkdirSync(DST, { recursive: true });
let n = 0;
for (const f of readdirSync(SRC)) {
  if (!/\.(wasm|js)$/.test(f)) continue;
  // draco_encoder.js (~0.9 Mo) : jamais charge par le navigateur (lecture seule
  // du GLB) — exclu du deploy. Seuls decoder.js + decoder.wasm + wrapper servent.
  if (f.startsWith('draco_encoder')) continue;
  copyFileSync(join(SRC, f), join(DST, f));
  n++;
}
console.log(`✅ ${n} decodeurs Draco copies vers public/draco/`);
