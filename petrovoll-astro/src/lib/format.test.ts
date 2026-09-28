import { describe, expect, it } from 'vitest'

import { extraitTexte, formaterPrix, jsonLdSur, lienTelephone, lienWhatsApp } from './format'

describe('formaterPrix', () => {
  it('formate en FCFA avec séparateur de milliers insécable', () => {
    expect(formaterPrix(12500)).toBe('12 500 FCFA')
    expect(formaterPrix(0)).toBe('0 FCFA')
  })

  it('affiche « Prix sur demande » quand le client n’a pas saisi de prix', () => {
    expect(formaterPrix(null)).toBe('Prix sur demande')
    expect(formaterPrix(undefined)).toBe('Prix sur demande')
    expect(formaterPrix(Number.NaN)).toBe('Prix sur demande')
  })
})

describe('lienWhatsApp', () => {
  it('accepte un numéro saisi avec +, espaces et tirets', () => {
    expect(lienWhatsApp('+226 70-00 00 00')).toBe('https://wa.me/22670000000')
  })

  it('normalise « 00 » et les numéros locaux sans indicatif (Burkina)', () => {
    expect(lienWhatsApp('00226 70 12 34 56')).toBe('https://wa.me/22670123456')
    expect(lienWhatsApp('70 12 34 56')).toBe('https://wa.me/22670123456')
    expect(lienWhatsApp('+33 6 12 34 56 78')).toBe('https://wa.me/33612345678')
  })

  it('encode le message pré-rempli', () => {
    expect(lienWhatsApp('22670000000', 'Bonjour & merci')).toBe('https://wa.me/22670000000?text=Bonjour%20%26%20merci')
  })

  it('renvoie null sans numéro (les boutons WhatsApp sont masqués)', () => {
    expect(lienWhatsApp('')).toBeNull()
    expect(lienWhatsApp(undefined)).toBeNull()
    expect(lienWhatsApp('pas de numéro')).toBeNull()
  })
})

describe('lienTelephone', () => {
  it('garde le + de l’indicatif et retire le reste', () => {
    expect(lienTelephone('+226 70 00 00 00')).toBe('tel:+22670000000')
  })

  it('renvoie null sans chiffre', () => {
    expect(lienTelephone('')).toBeNull()
    expect(lienTelephone('+')).toBeNull()
  })
})

describe('extraitTexte', () => {
  it('retire commentaires, titres, puces, liens et gras', () => {
    const markdoc = '<!-- note -->\n## Titre\n\n- **Gras** et [lien](https://x.y)\n- puce'
    expect(extraitTexte(markdoc)).toBe('Titre Gras et lien puce')
  })

  it('coupe au dernier mot entier et ajoute …', () => {
    expect(extraitTexte('un deux trois quatre', 12)).toBe('un deux…')
  })

  it('renvoie une chaîne vide pour un contenu absent', () => {
    expect(extraitTexte(undefined)).toBe('')
  })
})

describe('jsonLdSur', () => {
  it('empêche un texte saisi de fermer la balise <script>', () => {
    const sortie = jsonLdSur({ name: '</script><script>alert(1)</script>' })
    expect(sortie).not.toContain('</script>')
    expect(JSON.parse(sortie).name).toBe('</script><script>alert(1)</script>')
  })
})
