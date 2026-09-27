#!/usr/bin/env node
/**
 * clean-video.js — Wrapper Node.js pour le pipeline ffmpeg de nettoyage video.
 * Supprime le credit IA en haut et le QR code en bas a droite, puis
 * reconvertit le resultat en H.264 sans audio.
 *
 * USAGE npm :  npm run bidon:clean-video
 * OUTPUT :      src/assets/hero-clean.mp4
 * DEPENDANCES : ffmpeg (detecte automatiquement).
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd().startsWith('\\?') ? process.cwd() : join(import.meta.dirname, '..');
const FFMPEG = join(ROOT, 'node_modules', '.bin', 'ffmpeg'); // placeholder
const SRC = join(process.env.USERPROFILE || '', 'Downloads', 'KORO-MATHIEUX', 'tripo-showcase-9be04a31-9db9-4341-bbda-e71e5f375c61.mp4');
const OUT = join(ROOT, 'src', 'assets', 'hero-clean.mp4');

// 1. S'assurer que ffmpeg est disponible (chemin winget si installe)
let ffmpegPath = process.env.FFMPEG_BIN || '';
if (!ffmpegPath) {
  const candidates = [
    join(process.env.ProgramFiles || '', 'ffmpeg', 'bin', 'ffmpeg.exe'),
    join(process.env.ProgramFiles || 'C:\\Program Files', 'ffmpeg', 'bin', 'ffmpeg.exe'),
    join('C:\\temp\\ffmpeg-extract\\ffmpeg-9.0.1-essentials_build\\bin', 'ffmpeg.exe'),
  ];
  const found = candidates.find(existsSync);
  if (!found) {
    console.error('❌ ffmpeg introuvable. Lance : winget install --id Gyan.FFmpeg.Essentials');
    process.exit(2);
  }
  ffmpegPath = found;
}

// 2. Verifier la source
if (!existsSync(SRC)) {
  console.error(`❌ Source introuvable : ${SRC}`);
  console.error('💡 Place le fichier dans :', join(process.env.USERPROFILE, 'Downloads', 'KORO-MATHIEUX'));
  process.exit(3);
}

// 3. CADRAGE HERO — mesures faites sur la source 1080x1080 (7 s, 30 fps) :
//      • credit IA "Created With Tripo"  : y = 15..129
//      • QR code Tripo                    : x = 802..1066  (apparait vers t=3s)
//      • produit (bidon)                  : x = 183..796, y = 170..924
//    Le fond est PLAT et UNIFORME (mesure : 12,12,12 de x=100 a x=1079 sur le
//    bandeau y=132..168, ecart-type 2-3), ce qui autorise deux operations sûres :
//      a) on SUPRIME le QR en rognant a x=0..801 puis en prolongeant le fond
//         a droite (pad) — aucun rectangle gris, aucune reconstruction ;
//      b) on cadre en 950x950 NATIFS (aucun upscale) centre sur le produit :
//         centre produit x=490, y=547  ->  crop x=15..965 / y=130..1080.
//         => marges 168 px a gauche / 169 px a droite (parfaitement centrees),
//            produit a 65 % de la largeur et 79 % de la hauteur.
//    ⚠️ NE PAS REVERTIR VERS crop=800:800:0:140 : le produit (x=183..796)
//    se retrouvait a 4 px du bord droit contre 183 px a gauche — c'est cet
//    desequilibre, et non le fichier, qui faisait paraitre le hero "basse
//    definition". Ici on gagne au passage 150 px de resolution native.
mkdirSync(join(ROOT, 'src', 'assets'), { recursive: true });
console.log('▶ Nettoyage video : QR supprime (fond prolonge), cadre carre 950x950 centre, H.264 hero');
const filters = [
  'crop=802:1080:0:0',            // zone reellement propre (hors QR, hors credit)
  'pad=1080:1080:0:0:0x0A0A0E',   // prolonge le fond a droite : le QR disparait
  'crop=950:950:15:130',           // cadre carre centre sur le bidon, credit IA exclu
  // Nettete percue : leger unsharp (le produit garde ses pixels natifs).
  'unsharp=5:5:0.30:5:5:0.0',
  'format=yuv420p',
].join(',');
const POSTER = join(ROOT, 'src', 'assets', 'hero-poster.png');
try {
  execFileSync(ffmpegPath, [
    '-y', '-i', SRC,
    '-vf', filters,
    '-c:v', 'libx264',
    // CRF 23 + plafond de debit : la version CRF18 pesait 6,4 Mo (7,3 Mbit/s)
    // pour 7 s, ce qui est inacceptable pour un hero (contrainte 3G) et se
    // traduisait par un buffering, pas par un gain de qualite visible.
    '-crf', '23',
    '-preset', 'slow',
    '-tune', 'animation',
    '-maxrate', '1600k',
    '-bufsize', '3200k',
    '-profile:v', 'high',
    '-level', '4.0',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    '-an', // pas d'audio (video showcase)
    OUT
  ], { stdio: 'inherit' });
  // Poster derive exactement de la meme zone propre que la video.
  execFileSync(ffmpegPath, [
    '-y', '-ss', '1.0', '-i', SRC,
    '-vf', filters,
    '-frames:v', '1',
    '-update', '1',
    POSTER
  ], { stdio: 'inherit' });
  console.log(`✅ Hero video prete : ${OUT}`);
  console.log(`✅ Poster hero derive : ${POSTER}`);
} catch {
  console.error('❌ ffmpeg a echoue.');
  process.exit(5);
}
