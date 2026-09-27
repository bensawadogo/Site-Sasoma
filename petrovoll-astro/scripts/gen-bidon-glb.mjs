/**
 * gen-bidon-glb.mjs — genere public/models/bidon.glb (jerrycan PETROVOLL stylise).
 *
 * Pourquoi ce script existe :
 *  - Le .glb photogrammetrique (Meshy/Upsampler) n'est pas encore disponible.
 *  - En attendant, ce modele procedural donne a BidonScene.astro un vrai
 *    fichier a charger (memes proportions, couleurs #D4420A / #141414 / #F5A623).
 *  - Zero dependance : ecrit du glTF 2.0 binaire (GLB) a la main, en pur Node.
 *
 * Usage : node scripts/gen-bidon-glb.mjs
 * Remplacement : ecrasez public/models/bidon.glb par le modele definitif,
 *                aucune modification de code n'est necessaire (meme chemin).
 */

import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'models', 'bidon.glb');

// ---------------------------------------------------------------- helpers vec
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (a) => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
const mid = (...pts) => {
  const m = [0, 0, 0];
  for (const p of pts) { m[0] += p[0]; m[1] += p[1]; m[2] += p[2]; }
  return [m[0] / pts.length, m[1] / pts.length, m[2] / pts.length];
};

// Une "partie" = une geometrie + un index de materiau.
function makePart(material) {
  return { positions: [], normals: [], indices: [], material };
}
function pushVert(part, p, n) {
  part.positions.push(p[0], p[1], p[2]);
  part.normals.push(n[0], n[1], n[2]);
  return part.positions.length / 3 - 1;
}
// Triangle a normale plate, orientation auto-corrigee (normale vers l'exterieur).
function pushTri(part, a, b, c, ref) {
  let n = norm(cross(sub(b, a), sub(c, a)));
  if (dot(n, sub(mid(a, b, c), ref)) < 0) { const t = b; b = c; c = t; n = [-n[0], -n[1], -n[2]]; }
  const i0 = pushVert(part, a, n), i1 = pushVert(part, b, n), i2 = pushVert(part, c, n);
  part.indices.push(i0, i1, i2);
}
function pushQuad(part, a, b, c, d, ref) {
  pushTri(part, a, b, c, ref);
  pushTri(part, a, c, d, ref);
}
function pushBox(part, w, h, d, cx, cy, cz) {
  const x = w / 2, y = h / 2, z = d / 2, ref = [cx, cy, cz];
  const v = (sx, sy, sz) => [cx + sx * x, cy + sy * y, cz + sz * z];
  pushQuad(part, v(1, -1, -1), v(1, -1, 1), v(1, 1, 1), v(1, 1, -1), ref);
  pushQuad(part, v(-1, -1, 1), v(-1, -1, -1), v(-1, 1, -1), v(-1, 1, 1), ref);
  pushQuad(part, v(-1, 1, -1), v(-1, 1, 1), v(1, 1, 1), v(1, 1, -1), ref);
  pushQuad(part, v(-1, -1, 1), v(-1, -1, -1), v(1, -1, -1), v(1, -1, 1), ref);
  pushQuad(part, v(-1, -1, 1), v(1, -1, 1), v(1, 1, 1), v(-1, 1, 1), ref);
  pushQuad(part, v(1, -1, -1), v(-1, -1, -1), v(-1, 1, -1), v(1, 1, -1), ref);
}
// Cylindre vertical a facettes plates (bouchon, goulot).
function pushCyl(part, r, h, seg, cx, cy, cz) {
  const y0 = cy - h / 2, y1 = cy + h / 2, ref = [cx, cy, cz];
  const ring = (y) => Array.from({ length: seg }, (_, i) => {
    const a = (i / seg) * Math.PI * 2;
    return [cx + Math.cos(a) * r, y, cz + Math.sin(a) * r];
  });
  const bot = ring(y0), top = ring(y1);
  for (let i = 0; i < seg; i++) {
    const j = (i + 1) % seg;
    pushQuad(part, bot[i], bot[j], top[j], top[i], ref);
    pushTri(part, [cx, y1, cz], top[i], top[j], ref);
    pushTri(part, [cx, y0, cz], bot[j], bot[i], ref);
  }
}
// Tronc de pyramide (epaulement du bidon) : rect bas -> rect haut.
function pushFrustum(part, y0, hx0, hz0, y1, hx1, hz1) {
  const ref = [0, (y0 + y1) / 2, 0];
  const rect = (y, hx, hz) => [
    [-hx, y, -hz], [hx, y, -hz], [hx, y, hz], [-hx, y, hz],
  ];
  const b = rect(y0, hx0, hz0), t = rect(y1, hx1, hz1);
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    pushQuad(part, b[i], b[j], t[j], t[i], ref);
  }
  pushQuad(part, t[0], t[1], t[2], t[3], ref); // dessus
  pushQuad(part, b[3], b[2], b[1], b[0], ref); // dessous (cache, mais etanche)
}

// ------------------------------------------------------------------ materiaux
const MAT = { orange: 0, dark: 1, gold: 2 };
const parts = [makePart(MAT.orange), makePart(MAT.dark), makePart(MAT.gold)];
const P = (m) => parts[m];

// Corps principal : 1.5 (L) x 2.0 (H) x 0.9 (P), sol a y = -1.2.
pushBox(P(MAT.orange), 1.5, 2.0, 0.9, 0, 0, 0);
// Epaulement : 1.5x0.9 -> 0.9x0.6, de y=1.0 a y=1.45.
pushFrustum(P(MAT.orange), 1.0, 0.75, 0.45, 1.45, 0.45, 0.3);
// Goulot + bouchon (decentres en x, comme un vrai jerrycan).
pushCyl(P(MAT.orange), 0.16, 0.25, 12, 0.3, 1.55, 0);
pushCyl(P(MAT.dark), 0.2, 0.18, 16, 0.3, 1.72, 0);
// Poignee : barre + 2 montants (cote oppose au goulot).
pushBox(P(MAT.orange), 0.68, 0.13, 0.24, -0.27, 1.62, 0);
pushBox(P(MAT.orange), 0.13, 0.3, 0.24, -0.58, 1.5, 0);
pushBox(P(MAT.orange), 0.13, 0.3, 0.24, 0.04, 1.5, 0);
// Etiquettes dorees avant/arriere + cartouche sombre (zone texte / logo).
pushBox(P(MAT.gold), 1.1, 1.2, 0.04, 0, 0.05, 0.46);
pushBox(P(MAT.gold), 1.1, 1.2, 0.04, 0, 0.05, -0.46);
pushBox(P(MAT.dark), 0.88, 0.88, 0.02, 0, 0.05, 0.49);
pushBox(P(MAT.dark), 0.88, 0.88, 0.02, 0, 0.05, -0.49);
// Nervures horizontales bas de corps (detail moule plastique).
for (const y of [-0.45, -0.62, -0.79]) {
  pushBox(P(MAT.dark), 1.1, 0.055, 0.02, 0, y, 0.455);
  pushBox(P(MAT.dark), 1.1, 0.055, 0.02, 0, y, -0.455);
}

// ------------------------------------------------------------------ encodage
const binChunks = [];
let cursor = 0;
const bufferViews = [];
const accessors = [];
function allocView(u8) {
  const pad = (4 - (u8.length % 4)) % 4;
  const buf = Buffer.alloc(u8.length + pad, 0);
  Buffer.from(u8.buffer, u8.byteOffset, u8.length).copy(buf);
  bufferViews.push({ buffer: 0, byteOffset: cursor, byteLength: u8.length });
  cursor += buf.length;
  binChunks.push(buf);
  return bufferViews.length - 1;
}
const meshes = [];
const meshByMat = new Map();
parts.forEach((part) => {
  const n = part.positions.length / 3;
  if (n === 0) return;
  const pos = new Float32Array(part.positions);
  const nrm = new Float32Array(part.normals);
  const idx = new Uint32Array(part.indices);
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < n; i++) {
    for (let k = 0; k < 3; k++) {
      const v = pos[i * 3 + k];
      if (v < min[k]) min[k] = v;
      if (v > max[k]) max[k] = v;
    }
  }
  const vPos = allocView(new Uint8Array(pos.buffer));
  const vNrm = allocView(new Uint8Array(nrm.buffer));
  const vIdx = allocView(new Uint8Array(idx.buffer));
  const aPos = accessors.length;
  accessors.push({ bufferView: vPos, componentType: 5126, count: n, type: 'VEC3', min, max });
  accessors.push({ bufferView: vNrm, componentType: 5126, count: n, type: 'VEC3' });
  accessors.push({ bufferView: vIdx, componentType: 5125, count: idx.length, type: 'SCALAR' });
  if (!meshByMat.has(part.material)) {
    meshByMat.set(part.material, meshes.length);
    meshes.push({ name: `mat${part.material}`, primitives: [] });
  }
  meshes[meshByMat.get(part.material)].primitives.push({
    attributes: { POSITION: aPos, NORMAL: aPos + 1 },
    indices: aPos + 2,
    material: part.material,
  });
});

const gltf = {
  asset: { version: '2.0', generator: 'petrovoll gen-bidon-glb.mjs (procedural v1)' },
  scene: 0,
  scenes: [{ name: 'Bidon PETROVOLL', nodes: [0] }],
  nodes: [
    { name: 'BidonRoot', children: meshes.map((_, i) => i + 1) },
    ...meshes.map((m) => ({ name: m.name, mesh: meshes.indexOf(m) })),
  ],
  meshes: meshes.map((m) => ({ name: m.name, primitives: m.primitives })),
  materials: [
    { name: 'PetrovollOrange', pbrMetallicRoughness: { baseColorFactor: [0.831, 0.259, 0.039, 1], metallicFactor: 0.05, roughnessFactor: 0.38 } },
    { name: 'NoirBidon', pbrMetallicRoughness: { baseColorFactor: [0.078, 0.078, 0.078, 1], metallicFactor: 0.2, roughnessFactor: 0.5 } },
    { name: 'OrPremium', pbrMetallicRoughness: { baseColorFactor: [0.961, 0.651, 0.137, 1], metallicFactor: 0.65, roughnessFactor: 0.3 } },
  ],
  buffers: [{ byteLength: cursor }],
  bufferViews,
  accessors,
  extras: { produit: 'Bidon PETROVOLL procedural v1 (attente scan photogrammetrique)' },
};

const jsonRaw = Buffer.from(JSON.stringify(gltf), 'utf8');
const jsonPad = (4 - (jsonRaw.length % 4)) % 4;
const jsonChunk = Buffer.alloc(jsonRaw.length + jsonPad, 0x20);
jsonRaw.copy(jsonChunk);
const binChunk = Buffer.concat(binChunks);
const total = 12 + 8 + jsonChunk.length + 8 + binChunk.length;
const glb = Buffer.alloc(total);
let o = 0;
glb.writeUInt32LE(0x46546c67, o); o += 4; // 'glTF'
glb.writeUInt32LE(2, o); o += 4;
glb.writeUInt32LE(total, o); o += 4;
glb.writeUInt32LE(jsonChunk.length, o); o += 4;
glb.writeUInt32LE(0x4e4f534a, o); o += 4; // 'JSON'
jsonChunk.copy(glb, o); o += jsonChunk.length;
glb.writeUInt32LE(binChunk.length, o); o += 4;
glb.writeUInt32LE(0x004e4942, o); o += 4; // 'BIN'
binChunk.copy(glb, o);

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, glb);

// --------------------------------------------------------------- auto-verif
const back = readFileSync(OUT);
const okMagic = back.readUInt32LE(0) === 0x46546c67;
const jsonLen = back.readUInt32LE(12);
const parsed = JSON.parse(back.subarray(20, 20 + jsonLen).toString('utf8'));
const tris = parts.reduce((s, p) => s + p.indices.length / 3, 0);
const verts = parts.reduce((s, p) => s + p.positions.length / 3, 0);
console.log(`GLB magic OK: ${okMagic}`);
console.log(`Meshes: ${parsed.meshes.length} | materiaux: ${parsed.materials.length} | sommets: ${verts} | triangles: ${tris}`);
console.log(`Fichier : ${OUT} (${(back.length / 1024).toFixed(1)} Ko)`);
if (!okMagic || parsed.meshes.length !== 3) {
  console.error('VERIFICATION ECHOUEE');
  process.exit(1);
}
console.log('Verification OK — chargeable via GLTFLoader (/models/bidon.glb).');
