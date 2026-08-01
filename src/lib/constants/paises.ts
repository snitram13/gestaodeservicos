/**
 * Países onde a aplicação é alugada. Cada empresa (tenant) tem um país, e é
 * ele que manda em TUDO o que é local: prefixo e formato do telefone, código
 * postal, número fiscal, IVA por omissão e fuso horário.
 *
 * O idioma é SEPARADO do país (ver `idiomas.ts`) — uma empresa espanhola pode
 * ter um funcionário a trabalhar em português.
 */

export const PAISES = ["PT", "ES", "FR"] as const
export type Pais = (typeof PAISES)[number]

export const PAIS_PADRAO: Pais = "PT"

export type MetaPais = {
  nome: string
  bandeira: string
  /** Idioma sugerido para quem trabalha neste país. */
  idiomaPadrao: "pt" | "es" | "fr"
  /** Indicativo telefónico internacional, sem o "+". */
  prefixo: string
  /** Nº de dígitos do número local (sem indicativo). */
  digitosTelefone: number
  /** Agrupamento para mostrar o número (soma = digitosTelefone). */
  grupoTelefone: number[]
  /** Exemplo de telefone para o placeholder. */
  exemploTelefone: string
  /** Validação do código postal local. */
  regexCodigoPostal: RegExp
  exemploCodigoPostal: string
  /** Como se chama o código postal por lá. */
  rotuloCodigoPostal: string
  /** Nome do número de contribuinte (NIF / NIF-CIF / SIRET). */
  rotuloFiscal: string
  regexFiscal: RegExp
  exemploFiscal: string
  /** IVA por omissão dos novos orçamentos (%). */
  ivaPadrao: number
  /** Fuso horário — Madrid e Paris estão 1h à frente de Lisboa. */
  fuso: string
  /** Locale para datas e moeda (Intl). */
  locale: string
  /** Todos usam euro; fica explícito para não haver surpresas. */
  moeda: "EUR"
  /** Exemplo de IBAN local (aparece como sugestão no campo). */
  exemploIban: string
  /** Há preenchimento automático da morada pelo código postal? */
  moradaAutomatica: boolean
}

export const PAISES_META: Record<Pais, MetaPais> = {
  PT: {
    nome: "Portugal",
    bandeira: "🇵🇹",
    idiomaPadrao: "pt",
    prefixo: "351",
    digitosTelefone: 9,
    grupoTelefone: [3, 3, 3],
    exemploTelefone: "912 345 678",
    regexCodigoPostal: /^\d{4}-\d{3}$/,
    exemploCodigoPostal: "4000-123",
    rotuloCodigoPostal: "Código postal",
    rotuloFiscal: "NIF",
    regexFiscal: /^\d{9}$/,
    exemploFiscal: "123456789",
    ivaPadrao: 23,
    fuso: "Europe/Lisbon",
    locale: "pt-PT",
    moeda: "EUR",
    exemploIban: "PT50 …",
    moradaAutomatica: true,
  },
  ES: {
    nome: "España",
    bandeira: "🇪🇸",
    idiomaPadrao: "es",
    prefixo: "34",
    digitosTelefone: 9,
    grupoTelefone: [3, 3, 3],
    exemploTelefone: "612 345 678",
    regexCodigoPostal: /^\d{5}$/,
    exemploCodigoPostal: "28001",
    rotuloCodigoPostal: "Código postal",
    // NIF (8 dígitos + letra), NIE (X/Y/Z + 7 dígitos + letra) ou CIF
    // (letra + 7 dígitos + letra/dígito).
    rotuloFiscal: "NIF / CIF",
    regexFiscal: /^([0-9]{8}[A-Za-z]|[XYZxyz][0-9]{7}[A-Za-z]|[A-HJ-NP-SUVWa-hj-np-suvw][0-9]{7}[0-9A-Ja-j])$/,
    exemploFiscal: "12345678Z",
    ivaPadrao: 21,
    fuso: "Europe/Madrid",
    locale: "es-ES",
    moeda: "EUR",
    exemploIban: "ES91 …",
    moradaAutomatica: false,
  },
  FR: {
    nome: "France",
    bandeira: "🇫🇷",
    idiomaPadrao: "fr",
    prefixo: "33",
    // Em França escreve-se com o 0 à frente (06 12 34 56 78) mas o número
    // internacional é sem ele: +33 6 12 34 56 78.
    digitosTelefone: 10,
    grupoTelefone: [2, 2, 2, 2, 2],
    exemploTelefone: "06 12 34 56 78",
    regexCodigoPostal: /^\d{5}$/,
    exemploCodigoPostal: "75001",
    rotuloCodigoPostal: "Code postal",
    // SIRET (14 dígitos) ou nº de TVA intracomunitário (FR + 11 caracteres).
    rotuloFiscal: "SIRET / TVA",
    regexFiscal: /^(\d{14}|[Ff][Rr][0-9A-Za-z]{2}\d{9})$/,
    exemploFiscal: "12345678901234",
    ivaPadrao: 20,
    fuso: "Europe/Paris",
    locale: "fr-FR",
    moeda: "EUR",
    exemploIban: "FR76 …",
    moradaAutomatica: true,
  },
}

/** Metadata de um país, com PT como recurso se vier algo inesperado da BD. */
export function metaPais(pais: string | null | undefined): MetaPais {
  return PAISES_META[(pais as Pais) ?? PAIS_PADRAO] ?? PAISES_META[PAIS_PADRAO]
}

export function paisValido(v: string | null | undefined): Pais {
  return PAISES.includes(v as Pais) ? (v as Pais) : PAIS_PADRAO
}
