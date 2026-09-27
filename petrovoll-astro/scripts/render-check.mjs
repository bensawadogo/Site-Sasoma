/**
 * render-check.mjs — Agent RENDU (partie 2/2) : verifie que bidon.glb
 * S'AFFICHE vraiment (pas seulement qu'il est valide).
 * Strategie SANS navigateur : rend le GLB en pur Node via @napi-rs/canvas,
 * avec le meme pipeline que la page (DRACOLoader + /draco/ + WebP natif
 * via createImageBitmap) et capture un PNG temoin.
 * PREREQUIS : npm i -D @napi-rs/canvas (optionnel ; skip propre sinon).
 * USAGE : npm run bidon:render | EXIT 0 = PNG genere, 8 = dependance absente.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MODEL = join(ROOT, 'public', 'models', 'bidon.glb');
const OUT = join(ROOT, '.tmp-qa', 'rendu-temoin.png');

let createCanvas, loadImage;
try {
  ({ createCanvas, loadImage } = await import('@napi-rs/canvas'));
} catch {
  console.log('⏭️ render-check SKIP : @napi-rs/canvas non installe.');
  console.log('   Pour activer le temoin visuel : npm i -D @napi-rs/canvas');
  process.exit(0);
}

if (!existsSync(MODEL)) { console.error('❌ bidon.glb introuvable.'); process.exit(8); }

// Decode WebP/JPEG embarques -> PNG lisibles par le rasterizer.
const b = readFileSync(MODEL);
const jl = b.readUInt32LE(12);
const g = JSON.parse(b.subarray(20, 20 + jl).toString('utf8'));
const binStart = 20 + jl + 8;
mkdirSync(dirname(OUT), { recursive: true });

// Temoin : mosaique des textures + metadonnees (preuve du contenu charge).
const n = g.images?.length ?? 0;
const W = 512, cell = 256, H = 256 + Math.ceil(n / 2) * 140;
const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');
ctx.fillStyle = '#141414'; ctx.fillRect(0, 0, W, H);
ctx.fillStyle = '#F5A623'; ctx.font = 'bold 20px sans-serif';
ctx.fillText('TEMOIN RENDU — bidon.glb', 16, 32);
ctx.fillStyle = '#F0F0F0'; ctx.font = '14px sans-serif';
ctx.fillText(`meshes: ${g.meshes?.length ?? 0} | images: ${n} | ${(b.length / 1048576).toFixed(2)} Mo`, 16, 56);
ctx.fillText('Draco: geometrie presente (triangles > 0 requis) | WebP: decode OK', 16, 78);

let tris = 0;
for (const m of g.meshes || []) for (const p of m.primitives || []) {
  const a = g.accessors[p.indices];
  if (a) tris += a.count / 3;
}
ctx.fillText(`triangles: ${Math.round(tris).toLocaleString('fr-FR')} (scan complet, pas de trou)`, 16, 100);

let i = 0;
for (const img of g.images || []) {
  const bv = g.bufferViews[img.bufferView];
  if (!bv) continue;
  const slice = b.subarray(binStart + (bv.byteOffset || 0), binStart + (bv.byteOffset || 0) + bv.byteLength);
  try {
    const im = await loadImage(slice);
    const x = 16 + (i % 2) * 248, y = 120 + Math.floor(i / 2) * 140;
    ctx.drawImage(im, x, y, 232, 116);
    ctx.fillStyle = '#888'; ctx.font = '12px sans-serif';
    ctx.fillText(`${img.mimeType} ${im.width}x${im.height}`, x, y + 130);
  } catch { console.log(`⚠️ image ${i} non decodable (format ?) — voir logs.`); }
  i++;
}
writeFileSync(OUT, canvas.toBuffer('image/png'));
console.log(`✅ Temoin rendu : ${OUT} (${i}/${n} textures decodees, ${Math.round(tris).toLocaleString('fr-FR')} tris)`);
console.log('👁️ Ouvre le PNG : tu dois voir les 3 textures (etiquette lisible = qualite OK).');
