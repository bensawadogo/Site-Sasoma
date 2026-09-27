/**
 * Icônes des secteurs : le client en CHOISIT une dans une liste (admin), le
 * site la dessine en SVG inline (aucune librairie d'icônes à télécharger).
 * Tracés issus de Lucide (licence ISC), grille 24×24, trait `currentColor`.
 */
export const ICONES_SECTEUR = [
  {
    value: 'goutte',
    label: 'Goutte d’huile',
    svg: '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
  },
  {
    value: 'camion',
    label: 'Camion',
    svg: '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
  },
  {
    value: 'globe',
    label: 'Globe (import-export)',
    svg: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
  },
  {
    value: 'pneu',
    label: 'Pneu',
    svg: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><path d="M12 2v6M12 16v6M2 12h6M16 12h6"/>',
  },
  {
    value: 'trombone',
    label: 'Fournitures de bureau',
    svg: '<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>',
  },
  {
    value: 'boite',
    label: 'Carton / marchandise',
    svg: '<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
  },
  {
    value: 'cle',
    label: 'Clé (entretien)',
    svg: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  },
] as const

export type IconeSecteur = (typeof ICONES_SECTEUR)[number]['value']

/** Tracé SVG d'une icône ; icône « boîte » si la valeur est inconnue. */
export function traceIcone(valeur: string | undefined): string {
  const icone = ICONES_SECTEUR.find((i) => i.value === valeur) ?? ICONES_SECTEUR[5]
  return icone.svg
}
