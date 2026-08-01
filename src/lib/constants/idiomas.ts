/**
 * Idiomas da interface. Separado do país: o país define os formatos (telefone,
 * código postal, IVA, fuso), o idioma define os textos.
 */

export const IDIOMAS = ["pt", "es", "fr"] as const
export type Idioma = (typeof IDIOMAS)[number]

export const IDIOMA_PADRAO: Idioma = "pt"

/** Cookie onde fica o idioma escolhido no ecrã de login (antes de haver sessão). */
export const COOKIE_IDIOMA = "idioma"

export const IDIOMAS_META: Record<Idioma, { nome: string; bandeira: string }> = {
  pt: { nome: "Português", bandeira: "🇵🇹" },
  es: { nome: "Español", bandeira: "🇪🇸" },
  fr: { nome: "Français", bandeira: "🇫🇷" },
}

export function idiomaValido(v: string | null | undefined): Idioma {
  return IDIOMAS.includes(v as Idioma) ? (v as Idioma) : IDIOMA_PADRAO
}
