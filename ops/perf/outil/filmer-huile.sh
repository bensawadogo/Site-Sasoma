#!/usr/bin/env bash
# filmer-huile.sh — filme les étapes de l'huile (à lancer via avec-serveur.sh) et fait les planches.
D=../../captures/mcp-navigateur/v5/huile
mkdir -p $D
for p in 0.52 0.64 0.72 0.79 0.88; do
  node film.mjs http://localhost:5055/apercu-hero $D/d-$p.mp4 $p 3 1440 900 > /dev/null
  ffmpeg -v error -y -ss 2.6 -i $D/d-$p.mp4 -vf "crop=820:540:0:300" -frames:v 1 $D/d-$p.png
done
for p in 0.55 0.58 0.61; do
  node film.mjs http://localhost:5055/apercu-hero $D/v-$p.mp4 $p 2 1440 900 > /dev/null
  ffmpeg -v error -y -ss 1.6 -i $D/v-$p.mp4 -vf "crop=260:560:520:200" -frames:v 1 $D/v-$p.png
done
for p in 0.52 0.88; do
  node film.mjs http://localhost:5055/apercu-hero $D/m-$p.mp4 $p 3 > /dev/null
  ffmpeg -v error -y -ss 2.6 -i $D/m-$p.mp4 -frames:v 1 $D/m-$p.png
done
cd $D
ffmpeg -v error -y -ss 2.2 -i d-0.88.mp4 -vf "crop=560:150:130:690,tile=2x4" -frames:v 1 planche-carter.jpg
ffmpeg -v error -y -ss 1.2 -i v-0.58.mp4 -vf "crop=260:560:520:200,tile=6x1" -frames:v 1 planche-versement.jpg
ffmpeg -v error -y -i d-0.72.mp4 -vf "select='not(mod(n\,12))',crop=820:540:0:300,scale=410:-1,tile=3x2" -frames:v 1 planche-demarrage.jpg
ffmpeg -v error -y -ss 2.5 -i d-0.79.mp4 -vf "crop=300:200:300:470,scale=600:-1" -frames:v 1 zoom-pistons.png
ffmpeg -v error -y -ss 2.5 -i d-0.88.mp4 -vf "crop=500:120:150:370,scale=1000:-1" -frames:v 1 zoom-cames.png
ffmpeg -v error -y -ss 2.5 -i d-0.88.mp4 -vf "crop=560:160:130:680,scale=1120:-1" -frames:v 1 zoom-carter.png
python -c "
from PIL import Image
ims=[Image.open(f'v-{p}.png') for p in ('0.55','0.58','0.61')]
s=Image.new('RGB',(780,560))
for i,im in enumerate(ims): s.paste(im,(i*260,0))
s.save('planche-plein-debit.png')"
