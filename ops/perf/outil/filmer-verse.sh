D=../../captures/mcp-navigateur/v5/huile
for p in 0.55 0.58 0.61; do
  node film.mjs http://localhost:5055/apercu-hero $D/v-$p.mp4 $p 2 1440 900 > /dev/null
  ffmpeg -v error -y -ss 1.6 -i $D/v-$p.mp4 -vf "crop=260:560:520:200" -frames:v 1 $D/v-$p.png
done
