/**
 * ════════════════════════════════════════════════════════════════════════════
 *  ecosystem.config.js — Configuration PM2 (déploiement VPS Linux)
 * ════════════════════════════════════════════════════════════════════════════
 *  Ce fichier est du CommonJS volontairement : PM2 le lit directement, sans
 *  passer par le bundler Next.js (`module.exports` et non `export default`).
 *
 *  Utilisation :
 *    npm ci --legacy-peer-deps
 *    npm run build                       # génère .next/
 *    pm2 start deploy/ecosystem.config.js --env production
 *    pm2 save && pm2 startup             # relance automatique après reboot
 *
 *  Logs :
 *    pm2 logs petrovoll-web
 *    pm2 monit
 *
 *  TODO [deploy] :
 *   - [ ] Créer l'utilisateur système dédié (ex. `deploy`) et lui donner le
 *         droit sur /var/www/petrovoll + sur les logs
 *   - [ ] Charger les secrets via `env_file` / `dotenv` (jamais dans ce fichier,
 *         qui est versionné)
 *   - [ ] Ajouter un script de déploiement (git pull + ci + build + reload)
 *   - [ ] Mettre en place une rotation des logs (pm2-logrotate)
 *   - [ ] Monitorer /api/health et redémarrer automatiquement en cas d'échec
 * ════════════════════════════════════════════════════════════════════════════
 */
module.exports = {
  apps: [
    {
      name: 'petrovoll-web',
      cwd: '/var/www/petrovoll',

      // ── Option A (recommandée en cluster) : binaire `next start` ──────────
      script: 'node_modules/next/dist/bin/next',
      args: 'start --port 3000',

      // ── Option B : sortie `standalone` (Docker / déploiement minimal) ─────
      // script: '.next/standalone/server.js',
      // → dans ce cas, copier aussi .next/static et public à côté du serveur,
      //   ou lancer l'image Docker (voir Dockerfile + docker-compose.yml).

      instances: 'max', // = nombre de cœurs CPU disponibles
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      kill_timeout: 5000, // laisse le temps aux requêtes en cours de se terminer

      // ── Variables par environnement ──────────────────────────────────────
      // ATTENTION : les secrets (PAYLOAD_SECRET, AUTH_SECRET, DATABASE_URL…)
      // doivent venir du fichier .env.local présent sur le serveur, pas d'ici.
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        NEXT_TELEMETRY_DISABLED: 1,
      },

      // ── Logs ────────────────────────────────────────────────────────────
      output: '/var/log/petrovoll/out.log',
      error: '/var/log/petrovoll/error.log',
      merge_logs: true,
      time: true,

      // ── Redémarrage progressif (évite d'envoyer tout le trafic sur un process
      //    encore froid après un déploiement) ───────────────────────────────
      wait_ready: false,
      listen_timeout: 10000,
      exp_backoff_restart_delay: 200,
    },
  ],
}
