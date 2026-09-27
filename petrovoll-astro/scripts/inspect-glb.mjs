import { readFileSync } from 'node:fs';
// Inspecteur generique : lit n'importe quel .glb (pas seulement bidon.glb).
const f = process.argv[2] || 'c:\\SITE-SASOMA\\petrovoll-astro\\public\\models\\bidon.glb';
const b = readFileSync(f);
const magic = b.subarray(0, 4).toString('ascii');
const ver = b.readUInt32LE(4);
const total = b.readUInt32LE(8);
const jl = b.readUInt32LE(12);
const g = JSON.parse(b.subarray(20, 20 + jl).toString('utf8'));
const binLen = b.readUInt32LE(20 + jl);
console.log(`Fichier : ${f}`);
console.log(`Magic: ${magic} | version: ${ver} | taille: ${(b.length / 1048576).toFixed(2)} Mo (header: ${total})`);
console.log(`Scenes: ${g.scenes?.length ?? 0} | Nodes: ${g.nodes?.length ?? 0} | Meshes: ${g.meshes?.length ?? 0} | Mats: ${g.materials?.length ?? 0} | Images: ${g.images?.length ?? 0} | Textures: ${g.textures?.length ?? 0} | Anims: ${g.animations?.length ?? 0}`);
if (g.materials?.length) console.log(`Materiaux: ${g.materials.map((m) => m.name || '?').join(', ')}`);
const prims = (g.meshes || []).reduce((s, m) => s + (m.primitives?.length || 0), 0);
let tris = 0;
for (const m of g.meshes || []) for (const p of m.primitives || []) {
  const a = g.accessors[p.indices];
  if (a) tris += a.count / 3;
}
console.log(`Primitives: ${prims} | Triangles: ${Math.round(tris).toLocaleString('fr-FR')}`);
// bornes globales POSITION
let mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
for (const m of g.meshes || []) for (const p of m.primitives || []) {
  const a = g.accessors[p.attributes?.POSITION];
  if (!a?.min) continue;
  for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], a.min[k]); mx[k] = Math.max(mx[k], a.max[k]); }
}
const size = [mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]];
console.log(`Bornes: min=[${mn.map((v) => v.toFixed(2))}] max=[${mx.map((v) => v.toFixed(2))}]`);
console.log(`Taille objet: ${size.map((v) => v.toFixed(2)).join(' x ')} (unites modele)`);
console.log(`BIN: ${(binLen / 1048576).toFixed(2)} Mo | total attendu: ${12 + 8 + jl + 8 + binLen} / reel: ${b.length}`);
const ok = magic === 'glTF' && ver === 2 && total === b.length && (g.meshes?.length || 0) > 0;
console.log(ok ? 'STRUCTURE GLB VALIDE' : 'STRUCTURE GLB INVALIDE');
process.exit(ok ? 0 : 1);
