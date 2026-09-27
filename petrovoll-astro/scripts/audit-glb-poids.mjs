import { readFileSync } from 'node:fs';
// Audit poids : repartition textures vs geometrie dans un .glb.
const f = process.argv[2] || 'c:\\SITE-SASOMA\\petrovoll-astro\\assets-source\\bidon-meshy.glb';
const b = readFileSync(f);
const jl = b.readUInt32LE(12);
const g = JSON.parse(b.subarray(20, 20 + jl).toString('utf8'));
console.log(`IMAGES: ${g.images?.length ?? 0} | TEXTURES: ${g.textures?.length ?? 0} | MATS: ${g.materials?.length ?? 0} | MESHES: ${g.meshes?.length ?? 0} | NODES: ${g.nodes?.length ?? 0}`);
let texTotal = 0;
for (const img of g.images || []) {
  const bv = g.bufferViews[img.bufferView];
  texTotal += bv.byteLength;
  console.log(` - ${img.mimeType} | ${(bv.byteLength / 1048576).toFixed(2)} Mo`);
}
// Estimation poids geometrie : somme count * taille composant * nb composantes.
const SZ = { 5126: 4, 5123: 2, 5125: 4, 5121: 1, 5120: 1 };
const NC = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
let geo = 0;
for (const a of g.accessors || []) geo += a.count * (SZ[a.componentType] ?? 4) * (NC[a.type] ?? 1);
console.log(`Textures embarquees: ${(texTotal / 1048576).toFixed(2)} Mo`);
console.log(`Geometrie brute estimee: ${(geo / 1048576).toFixed(2)} Mo`);
console.log(`JSON: ${(jl / 1024).toFixed(0)} Ko | Total fichier: ${(b.length / 1048576).toFixed(2)} Mo`);
