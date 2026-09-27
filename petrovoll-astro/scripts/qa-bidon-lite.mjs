/**
 * qa-bidon-lite.mjs — Agent QUALITE pour la variante LEGERE (profil 3G).
 * Metriques adaptees : la variante lite DOIT alléger la geometrie — on
 * verifie donc qu'elle reste DANS l'enveloppe attendue plutot qu'intacte :
 * perte tris entre 20% et 60%, poids < 1.2 Mo, textures conservees
 * (meme nombre/materiaux), echelle preservee, magic glTF.
 * NOTE seuil textures : en 768px/webp q75 la metallicRoughness quasi
 * uniforme tombe a ~5 Ko (17.6 Ko en 1024) — compression NORMALE, pas une
 * troncature : garde-fou a 4 Ko (une troncature reelle = buffer < 1 Ko).
 * USAGE : node scripts/qa-bidon-lite.mjs [source] [lite]
 * EXIT : 0 = OK, 7 = QUALITE KO.
 */
import { readFileSync } from 'node:fs';

const SRC = process.argv[2] || 'assets-source/bidon-meshy.glb';
const DST = process.argv[3] || 'public/models/bidon-lite.glb';

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
    mats: g.materials?.length ?? 0,
    images: g.images?.length ?? 0,
    minTex: Math.min(...texBytes, Infinity),
    size: [mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]],
  };
}

const A = profile(SRC), B = profile(DST);
const perte = ((A.tris - B.tris) / A.tris) * 100;
const echelleOK = A.size.every((v, i) => Math.abs(v - B.size[i]) / v < 0.02);

const checks = [
  ['magic glTF valide', B.magic === 'glTF', B.magic],
  ['allégement geometrie : perte 20-60%', perte >= 20 && perte <= 60,
    `${A.tris.toLocaleString('fr-FR')} -> ${B.tris.toLocaleString('fr-FR')} (${perte.toFixed(1)}%)`],
  ['poids < 1.2 Mo (budget 3G)', B.bytes < 1.2 * 1048576,
    `${(A.bytes / 1048576).toFixed(2)} -> ${(B.bytes / 1048576).toFixed(2)} Mo`],
  ['textures : meme nombre', B.images === A.images, `${A.images} -> ${B.images}`],
  ['textures : pas de troncature (< 4 Ko)', B.minTex >= 4 * 1024, `min ${(B.minTex / 1024).toFixed(0)} Ko`],
  ['materiaux conserves', B.mats === A.mats, `${A.mats} -> ${B.mats}`],
  ['echelle preservee (< 2%)', echelleOK,
    A.size.map((v) => v.toFixed(2)).join('x') + ' -> ' + B.size.map((v) => v.toFixed(2)).join('x')],
];

let ko = 0;
for (const [nom, ok, detail] of checks) {
  console.log(`${ok ? '✅' : '❌'} ${nom} — ${detail}`);
  if (!ok) ko++;
}
console.log(ko === 0 ? '\n✅ QA LITE OK — variante 3G validee.' : `\n❌ QA LITE KO — ${ko} metrique(s) en echec.`);
process.exit(ko === 0 ? 0 : 7);
