import { readFileSync } from 'node:fs';
const f = 'c:\\SITE-SASOMA\\petrovoll-astro\\public\\models\\bidon.glb';
const b = readFileSync(f);
const magic = b.subarray(0, 4).toString('ascii');
const ver = b.readUInt32LE(4);
const total = b.readUInt32LE(8);
const jl = b.readUInt32LE(12);
const g = JSON.parse(b.subarray(20, 20 + jl).toString('utf8'));
console.log(`Magic: ${magic} | version: ${ver} | taille: ${b.length} (header: ${total})`);
console.log(`Scenes: ${g.scenes.length} Nodes: ${g.nodes.length} Meshes: ${g.meshes.length} Mats: ${g.materials.map((m) => m.name).join(', ')}`);
console.log(`BufferViews: ${g.bufferViews.length} Accessors: ${g.accessors.length}`);
const binLen = b.readUInt32LE(20 + jl);
console.log(`BIN: ${binLen} octets | total attendu: ${12 + 8 + jl + 8 + binLen} / reel: ${b.length}`);
console.log(`Root children: ${JSON.stringify(g.nodes[0].children)} (attendu [1,2,3])`);
// bornes POSITION du mesh 0 (corps orange)
const a0 = g.accessors[g.meshes[0].primitives[0].attributes.POSITION];
console.log(`Mesh0 min: ${JSON.stringify(a0.min)} max: ${JSON.stringify(a0.max)}`);
const ok = magic === 'glTF' && ver === 2 && total === b.length
  && g.meshes.length === 3 && g.materials.length === 3
  && g.nodes[0].children.join() === '1,2,3';
console.log(ok ? 'STRUCTURE GLB VALIDE' : 'STRUCTURE GLB INVALIDE');
process.exit(ok ? 0 : 1);
