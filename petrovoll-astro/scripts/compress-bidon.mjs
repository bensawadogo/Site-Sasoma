/**
 * compress-bidon.mjs — Pipeline QUALITE (detail preserve, sans Blender).
 * Ordre : weld + resample + resize 1024 + webp + prune + dedup + draco
 * (Draco TOUJOURS en dernier : prune/dedup le decodent et regonflent sinon).
 * AUCUN simplify : la geometrie reste intacte, le gain vient des textures
 * 1024px WebP + Draco lossless. La QA (qa-bidon.mjs) arbitre la sortie.
 * ENTREE: assets-source/bidon-meshy.glb | SORTIE: public/models/bidon.glb
 * (la source brute 33 Mo vit HORS de public/ : jamais deployee —
 *  Cloudflare Pages refuse les fichiers > 25,16 Mo).
 * USAGE : npm run bidon:compress
 */
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, rmSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const GT_CLI = join(ROOT, 'node_modules', '@gltf-transform', 'cli', 'bin', 'cli.js');
const SRC = join(ROOT, 'assets-source', 'bidon-meshy.glb');
const DST = join(ROOT, 'public', 'models', 'bidon.glb');
const BACKUP = join(ROOT, 'public', 'models', 'bidon-procedural-backup.glb');
const WORK = join(ROOT, '.tmp-compress');
const mo = (p) => (statSync(p).size / 1048576).toFixed(2) + ' Mo';

// Triangles d'un .glb (log d'info ; la validation est deleguee a qa-bidon.mjs).
function countTris(file) {
  const b = readFileSync(file);
  const jl = b.readUInt32LE(12);
  const g = JSON.parse(b.subarray(20, 20 + jl).toString('utf8'));
  let tris = 0;
  for (const m of g.meshes || [])
    for (const p of m.primitives || []) {
      const a = g.accessors[p.indices];
      if (a) tris += a.count / 3;
    }
  return Math.round(tris);
}

if (!existsSync(SRC)) { console.error(`❌ Source introuvable : ${SRC}`); process.exit(3); }
if (!existsSync(GT_CLI)) { console.error('❌ CLI absent. Lance : npm install'); process.exit(4); }

const trisAvant = countTris(SRC);
console.log(`📦 Source : ${mo(SRC)} | ${trisAvant.toLocaleString('fr-FR')} tris`);
if (!existsSync(BACKUP) && existsSync(DST)) {
  copyFileSync(DST, BACKUP);
  console.log(`💾 Procedural sauvegarde : ${BACKUP}`);
}
rmSync(WORK, { recursive: true, force: true });
mkdirSync(WORK, { recursive: true });

const gt = (...args) => {
  console.log(`\n▶ gltf-transform ${args.slice(0, 3).join(' ')}…`);
  // NOTE : gltf-transform v4 n'a PAS de flag --overwrite ; on supprime
  // la destination avant chaque etape (fichiers temporaires jetables).
  const out = args[args.length - 1];
  if (typeof out === 'string' && out.endsWith('.glb')) rmSync(out, { force: true });
  // NOTE : appel direct de cli.js via node — cross-platform (le shim
  // .bin/gltf-transform est un script sh, inexecutable sans shell sur Windows).
  execFileSync(process.execPath, [GT_CLI, ...args], { stdio: 'inherit', cwd: ROOT });
};
const s = (n) => join(WORK, `step${n}.glb`);

try {
  gt('weld', SRC, s(1));                              // sommets dupliques du scan
  gt('resample', s(1), s(2));                         // keyframes (no-op si pas d'anim)
  gt('resize', s(2), s(3), '--width', '1024', '--height', '1024'); // textures 1024px
  gt('webp', s(3), s(4));                             // JPEG -> WebP (3-5x, qualite egale)
  gt('prune', s(4), s(5));                            // orphelins (zero pixel touche)
  gt('dedup', s(5), s(6));                            // AVANT draco (dedup decode Draco sinon)
  gt('draco', s(6), DST);                             // geometrie LOSSLESS -> bidon.glb (~1.6 Mo)
} catch {
  console.error('\n❌ Echec pipeline.');
  process.exit(5);
} finally {
  rmSync(WORK, { recursive: true, force: true });
}

// ===== CORRECTION ROUGES PARASITES + metallicFactor 0 =====
// (inpaint de la base color corrigee — voir scripts/fix-bidon-texture.mjs)
console.log('🎨 Injection base color corrigee + metallicFactor 0…');
execFileSync(process.execPath, [join(ROOT, 'scripts', 'fix-bidon-texture.mjs'), DST],
  { stdio: 'inherit', cwd: ROOT });

// ===== VALIDATION QUALITE via agent QA (exit 7 si degrade) =====
console.log('\n🔍 Validation qualite (agent QA)…');
try {
  execFileSync(process.execPath, [join(ROOT, 'scripts', 'qa-bidon.mjs'), SRC, DST],
    { stdio: 'inherit', cwd: ROOT });
} catch {
  console.error('\n❌ QA refuse le resultat — restauration du backup procedural.');
  if (existsSync(BACKUP)) copyFileSync(BACKUP, DST);
  process.exit(7);
}
console.log(`\n📊 Poids : ${mo(SRC)} -> ${mo(DST)}`);
console.log('\n✅ QUALITE OK — detail preserve.');
console.log('👉 Suite : `npm run bidon:decoders` puis recharge la page.');


