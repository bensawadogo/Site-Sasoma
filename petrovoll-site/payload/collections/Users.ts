import type { CollectionConfig } from 'payload'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Collection : users (collection d'authentification du panel admin)
 * ────────────────────────────────────────────────────────────────────────────
 * Rôles :
 *   • super-admin → accès total : utilisateurs, suppressions, paramètres
 *   • editeur     → crée/modifie le contenu (produits, secteurs, médias)
 *                   mais ne peut ni supprimer, ni gérer les comptes
 *
 * ⚠️  Payload gère lui-même le hachage des mots de passe (bcrypt) et les
 *     sessions admin. Ne JAMAIS manipuler `password` manuellement.
 *
 * TODO [auth] n°1 — TRANCHEZ : Payload est-il la source de vérité des comptes
 *   admin, ou faut-il un miroir Prisma + NextAuth (lib/auth.ts) ?
 *   Recommandation : Payload seul (moins de code, un seul login admin).
 *
 * TODO [auth] n°2 : lien avec l'admin Payload (avec Next.js 15.2+)
 *   - [ ] Activer la réinitialisation de mot de passe (champ `resetPassword`)
 *   - [ ] Imposer une politique de mot de passe fort (hook beforeValidate)
 *   - [ ] 2FA (TOTP) pour les comptes super-admin
 *   - [ ] Journaliser les connexions (ip, user-agent, horodatage)
 */
export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Utilisateur admin', plural: 'Utilisateurs admin' },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['nom', 'email', 'role', 'actif', 'updatedAt'],
    group: 'Administration',
    description: 'Comptes autorisés à administrer le catalogue et les contenus.',
  },

  /* ── Configuration d'authentification ───────────────────────────────────── */
  auth: {
    // Session admin : 8 h (journée de travail)
    tokenExpiration: 60 * 60 * 8,
    // Anti-brute-force : 5 tentatives puis verrouillage 10 minutes
    maxLoginAttempts: 5,
    lockTime: 10 * 60 * 1000,
    // TODO [auth] : cookies.secure = true en production (HTTPS obligatoire)
    // TODO [auth] : useAPIKey: true si des scripts d'import doivent s'authentifier
    // TODO [auth] : vérification d'email + invitation par email
  },

  /* ── Permissions ────────────────────────────────────────────────────────── */
  access: {
    /**
     * Lecture : chacun voit son propre profil ; le super-admin voit tout.
     * ⚠️  Cast temporaire : `user.role` sera typé après
     *     `npm run payload:generate-types` (types/payload-types.ts).
     */
    read: ({ req: { user } }) => {
      const u = user as { id?: string; role?: string } | null | undefined
      if (!u) return false
      if (u.role === 'super-admin') return true
      return { id: { equals: u.id } }
    },
    // Seul un super-admin peut créer des comptes (via invitation, pas d'inscription libre)
    create: ({ req: { user } }) =>
      (user as { role?: string } | null | undefined)?.role === 'super-admin',
    // Mise à jour : soi-même (nom, mot de passe) ou super-admin
    update: ({ req: { user } }) => {
      const u = user as { id?: string; role?: string } | null | undefined
      if (!u) return false
      if (u.role === 'super-admin') return true
      return { id: { equals: u.id } }
    },
    // Suppression : super-admin uniquement
    // TODO [securite] : interdire l'auto-suppression et garantir qu'il reste
    // toujours au moins un super-admin actif (hook beforeDelete).
    delete: ({ req: { user } }) =>
      (user as { role?: string } | null | undefined)?.role === 'super-admin',
  },

  fields: [
    {
      name: 'nom',
      type: 'text',
      required: true,
      label: 'Nom complet',
      admin: { description: 'Affiché dans la barre supérieure du panel admin.' },
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'editeur',
      label: 'Rôle',
      options: [
        { label: 'Super administrateur', value: 'super-admin' },
        { label: 'Éditeur', value: 'editeur' },
      ],
      // TODO [roles] : masquer/verrouiller ce champ pour un non super-admin
      // (field-level access: { update: ({ req }) => req.user?.role === 'super-admin' })
      admin: {
        position: 'sidebar',
        description:
          'Un éditeur peut créer/modifier le contenu. Le super-admin gère aussi les comptes et les suppressions.',
      },
    },
    {
      name: 'actif',
      type: 'checkbox',
      label: 'Compte actif',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'Décocher pour révoquer l’accès sans supprimer le compte.',
      },
    },
    {
      name: 'telephone',
      type: 'text',
      label: 'Téléphone',
      admin: { position: 'sidebar', description: 'Contact interne (format international).' },
    },
    // NOTE : les champs `email` et `password` sont ajoutés automatiquement
    // par Payload pour toute collection avec `auth: {}` ou `auth: {...}`.
  ],

  hooks: {
    /**
     * TODO [auth] : hooks recommandés
     *   beforeChange : politique de mot de passe (12 caractères min., complexité)
     *   afterLogin   : log de connexion + alerte email si IP inhabituelle
     *   beforeDelete : empêcher la suppression du dernier super-admin
     */
  },

  timestamps: true,
}

export default Users