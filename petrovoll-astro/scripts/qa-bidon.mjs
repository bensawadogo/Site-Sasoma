/**
 * qa-bidon.mjs — Agent QUALITE : compare source vs compresse, abort si degrade.
 * Metriques : triangles (perte <= 1%), textures (nb identique, min >= 15 Ko —
 * le WebP compresse tres fort les maps metallicRoughness/normal, 15-20 Ko est
 * NORMAL et sain pour du 1024px — le garde-fou cible l'ABSENCE, pas la taille),
 * materiaux, bornes POSITION (echelle preservee), magic glTF, poids < 5 Mo.
 * USAGE : node scripts/qa-bidon.mjs [source] [compresse]
 * EXIT : 0 = OK, 7 = QUALITE KO (detaille chaque metrique).
 */
import { readFileSync } from 'node:fs';

const SRC = process.argv[2] || 'assets-source/bidon-meshy.glb';
const DST = process.argv[3] || 'public/models/bidon.glb';

function profile(file) {
  const b = readFileSync(file);
  const jl = b.readUInt32LE(12);
  const g = JSON.parse(b.subarray(20, 20 + jl).toString('utf8'));
  let tris = 0;
  for (const m of g.meshes || [])
    for (const p of m.primitives || []) {
      const a = g.accessors[p.indices];
      if (a) tris += a.count / 3;
    }
  let mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
  for (const m of g.meshes || [])
    for (const p of m.primitives || []) {
      const a = g.accessors[p.attributes?.POSITION];
      if (!a?.min) continue;
      for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], a.min[k]); mx[k] = Math.max(mx[k], a.max[k]); }
    }
  const texBytes = (g.images || []).map((img) => g.bufferViews[img.bufferView]?.byteLength ?? 0);
  return {
    magic: b.subarray(0, 4).toString('ascii'),
    bytes: b.length,
    tris: Math.round(tris),
    meshes: g.meshes?.length ?? 0,
    mats: g.materials?.length ?? 0,
    images: g.images?.length ?? 0,
    minTex: Math.min(...texBytes, Infinity),
    texMimes: [...new Set((g.images || []).map((i) => i.mimeType))],
    size: [mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]],
  };
}

const A = profile(SRC), B = profile(DST);
const perte = ((A.tris - B.tris) / A.tris) * 100;
const echelleOK = A.size.every((v, i) => Math.abs(v - B.size[i]) / v < 0.02);

const checks = [
  ['magic glTF valide', B.magic === 'glTF', B.magic],
  ['triangles : perte <= 1%', perte <= 1, `${A.tris.toLocaleString('fr-FR')} -> ${B.tris.toLocaleString('fr-FR')} (${perte.toFixed(2)}%)`],
  ['textures : meme nombre', B.images === A.images, `${A.images} -> ${B.images} [${B.texMimes.join(', ')}]`],
  ['textures : pas de troncature (< 15 Ko)', B.minTex >= 15 * 1024, `min ${(B.minTex / 1024).toFixed(0)} Ko`],
  ['materiaux conserves', B.mats === A.mats, `${A.mats} -> ${B.mats}`],
  ['echelle preservee (< 2%)', echelleOK, A.size.map((v) => v.toFixed(2)).join('x') + ' -> ' + B.size.map((v) => v.toFixed(2)).join('x')],
  ['poids < 5 Mo', B.bytes < 5 * 1048576, `${(A.bytes / 1048576).toFixed(2)} -> ${(B.bytes / 1048576).toFixed(2)} Mo`],
];

let ko = 0;
for (const [nom, ok, detail] of checks) {
  console.log(`${ok ? '✅' : '❌'} ${nom} — ${detail}`);
  if (!ok) ko++;
}
console.log(ko === 0 ? '\n✅ QA OK — qualite preservee.' : `\n❌ QA KO — ${ko} metrique(s) en echec.`);
process.exit(ko === 0 ? 0 : 7);
