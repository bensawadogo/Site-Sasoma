#!/usr/bin/env bash
# avec-serveur.sh — lance le site construit (dist) sur le port 5055 le temps d'une commande,
# puis l'arrête.   bash avec-serveur.sh node film.mjs http://localhost:5055/apercu-hero …
cd "$(dirname "$0")"
DIST=../../../petrovoll-astro/dist
# Après `vercel build`, le site est dans dist/client (qui reste là après un `astro build` ordinaire) :
# on sert la plus récente des deux versions.
[ -f "$DIST/client/index.html" ] && [ "$DIST/client/index.html" -nt "$DIST/index.html" ] && DIST=$DIST/client
npx -y serve@14 "$DIST" -l 5055 > /dev/null 2>&1 &
PID=$!
for i in $(seq 1 60); do
  curl -s -o /dev/null http://localhost:5055/apercu-hero && break
  sleep 1
done
"$@"
CODE=$?
kill $PID 2> /dev/null
# serve lance un sous-processus node : on libère aussi le port.
for p in $(netstat -ano | grep ':5055 ' | grep LISTEN | awk '{print $5}' | sort -u); do taskkill //PID "$p" //F > /dev/null 2>&1; done
exit $CODE
