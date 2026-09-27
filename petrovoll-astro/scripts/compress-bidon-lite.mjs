/**
 * compress-bidon-lite.mjs — Variante LEGERE pour profil LITE
 * (2G/3G, deviceMemory <= 4, <= 4 coeurs → chargée par BidonScene).
 * Ordre : weld -> simplify (poids geometrie) -> resample -> resize 768
 * -> webp -> prune -> dedup -> draco. Draco TOUJOURS en dernier.
 * Cible : < 1.2 Mo (budget 3G) vs 1.6 Mo de la version complete.
 * ENTREE: assets-source/bidon-meshy.glb | SORTIE: public/models/bidon-lite.glb
 * USAGE : npm run bidon:compress-lite  (QA : qa-bidon-lite.mjs, exit 7 si KO)
 */
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, rmSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const GT_CLI = join(ROOT, 'node_modules', '@gltf-transform', 'cli', 'bin', 'cli.js');
const SRC = join(ROOT, 'assets-source', 'bidon-meshy.glb');
const DST = join(ROOT, 'public', 'models', 'bidon-lite.glb');
const WORK = join(ROOT, '.tmp-compress-lite');
const mo = (p) => (statSync(p).size / 1048576).toFixed(2) + ' Mo';

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

console.log(`📦 Source : ${mo(SRC)} | ${countTris(SRC).toLocaleString('fr-FR')} tris`);
rmSync(WORK, { recursive: true, force: true });
mkdirSync(WORK, { recursive: true });

const gt = (...args) => {
  console.log(`\n▶ gltf-transform ${args.slice(0, 3).join(' ')}…`);
  const out = args[args.length - 1];
  if (typeof out === 'string' && out.endsWith('.glb')) rmSync(out, { force: true });
  execFileSync(process.execPath, [GT_CLI, ...args], { stdio: 'inherit', cwd: ROOT });
};
const s = (n) => join(WORK, `step${n}.glb`);

try {
  gt('weld', SRC, s(1));
  // simplify : geometrie (le detail reste correct a ratio 0.55 / error 0.0015,
  // les silhouettes droits du bidon sont conservees par la metrique QEM).
  gt('simplify', s(1), s(2), '--ratio', '0.55', '--error', '0.0015');
  gt('resample', s(2), s(3));
  gt('resize', s(3), s(4), '--width', '768', '--height', '768');
  gt('webp', s(4), s(5), '--quality', '75');
  gt('prune', s(5), s(6));
  gt('dedup', s(6), s(7));
  gt('draco', s(7), DST);
} catch {
  console.error('\n❌ Echec pipeline lite.');
  process.exit(5);
} finally {
  rmSync(WORK, { recursive: true, force: true });
}

// ===== CORRECTION ROUGES PARASITES + metallicFactor 0 =====
// (inpaint de la base color corrigee — voir scripts/fix-bidon-texture.mjs)
console.log('🎨 Injection base color corrigee + metallicFactor 0…');
execFileSync(process.execPath, [join(ROOT, 'scripts', 'fix-bidon-texture.mjs'), DST],
  { stdio: 'inherit', cwd: ROOT });

console.log('\n🔍 Validation qualite (variante lite)…');
try {
  execFileSync(process.execPath, [join(ROOT, 'scripts', 'qa-bidon-lite.mjs'), SRC, DST],
    { stdio: 'inherit', cwd: ROOT });
} catch {
  console.error('❌ QA lite refuse le resultat.');
  process.exit(7);
}
console.log(`\n📊 Poids : ${mo(SRC)} -> ${mo(DST)}`);
console.log('✅ LITE OK — variante 3G prete.');
