/**
 * Accès au contenu édité par le client — point d'entrée UNIQUE pour les
 * composants. Toutes les valeurs de repli vivent ici : un champ laissé vide
 * dans l'admin donne un site correct, jamais une page cassée.
 */
import { getCollection, getEntry, type CollectionEntry } from 'astro:content'

import { lienTelephone, lienWhatsApp } from '@/lib/format'

export type Produit = CollectionEntry<'produits'>
export type Secteur = CollectionEntry<'secteurs'>

export async function getParametres() {
  const entree = await getEntry('parametresSite', 'index')
  const p = entree?.data
  const nomSociete = p?.nomSociete || 'SASOMA'
  return {
    nomSociete,
    slogan: p?.slogan,
    telephone: p?.telephone,
    email: p?.email,
    adresse: p?.adresse,
    horaires: p?.horaires,
    reseaux: p?.reseauxSociaux ?? [],
    rccm: p?.rccm,
    ifu: p?.ifu,
    lienTelephone: lienTelephone(p?.telephone),
    /** Lien WhatsApp avec un message adapté au contexte (produit, devis…). */
    whatsapp: (message = `Bonjour ${nomSociete}, je souhaite un devis.`) =>
      lienWhatsApp(p?.whatsapp, message),
  }
}

export async function getAccueil() {
  const a = (await getEntry('accueil', 'index'))?.data
  return {
    chiffres: a?.chiffres ?? [],
    appelTitre: a?.appelTitre ?? 'Besoin d’un devis professionnel ?',
    appelTexte: a?.appelTexte,
  }
}

/** Secteurs dans l'ordre choisi par le client (champ « Position »), puis A→Z. */
export async function getSecteurs(): Promise<Secteur[]> {
  const secteurs = await getCollection('secteurs')
  return secteurs.sort(
    (a, b) => a.data.ordre - b.data.ordre || a.data.nom.localeCompare(b.data.nom, 'fr'),
  )
}

/** Produits triés : en stock d'abord, puis par nom. */
export async function getProduits(): Promise<Produit[]> {
  const produits = await getCollection('produits')
  return produits.sort(
    (a, b) =>
      Number(b.data.disponible) - Number(a.data.disponible) ||
      a.data.nom.localeCompare(b.data.nom, 'fr'),
  )
}

/** Le produit mis en avant : le premier coché, sinon le premier du catalogue. */
export async function getProduitVedette(): Promise<Produit | undefined> {
  const produits = await getProduits()
  return produits.find((p) => p.data.enAvant) ?? produits[0]
}

/** Adresse du site, définie à UN seul endroit : `site` dans astro.config.mjs. */
export function urlSite(site: URL | undefined): URL {
  if (!site) throw new Error('`site` doit être défini dans astro.config.mjs')
  return site
}
