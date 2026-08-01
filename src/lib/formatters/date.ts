/**
 * Formatação de datas por país/idioma. O servidor da Vercel corre em UTC, por
 * isso o fuso tem de ser SEMPRE explícito: Lisboa, Madrid e Paris não são a
 * mesma hora (Madrid e Paris estão 1h à frente). O fuso e o locale vêm do país
 * da empresa — ver `lib/formatos.ts` (servidor) e `useFormatos()` (cliente).
 *
 * Sem opções assume-se Portugal: serve os ecrãs da plataforma (o dono é
 * português) e mantém o comportamento antigo onde ainda não foi convertido.
 */

const TZ_PADRAO = "Europe/Lisbon"
const LOCALE_PADRAO = "pt-PT"

export type OpcoesData = { tz?: string; locale?: string }

type Tipo = "data" | "dataHora" | "hora" | "diaExtenso" | "mesAno" | "chave"

const OPCOES: Record<Tipo, Intl.DateTimeFormatOptions> = {
  data: { day: "2-digit", month: "2-digit", year: "numeric" },
  dataHora: {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  },
  hora: { hour: "2-digit", minute: "2-digit" },
  diaExtenso: { weekday: "long", day: "numeric", month: "long" },
  mesAno: { month: "long", year: "numeric" },
  chave: { year: "numeric", month: "2-digit", day: "2-digit" },
}

// Construir um Intl.DateTimeFormat é caro; guardamos por (tipo, locale, fuso).
const cache = new Map<string, Intl.DateTimeFormat>()

function fmt(tipo: Tipo, o?: OpcoesData): Intl.DateTimeFormat {
  // A "chave" é sempre en-CA porque devolve YYYY-MM-DD; só o fuso é que varia.
  const locale = tipo === "chave" ? "en-CA" : (o?.locale ?? LOCALE_PADRAO)
  const tz = o?.tz ?? TZ_PADRAO
  const chave = `${tipo}|${locale}|${tz}`
  let f = cache.get(chave)
  if (!f) {
    f = new Intl.DateTimeFormat(locale, { ...OPCOES[tipo], timeZone: tz })
    cache.set(chave, f)
  }
  return f
}

function toDate(value: Date | string | number): Date {
  return value instanceof Date ? value : new Date(value)
}

/** 20/06/2026 */
export function formatData(
  value: Date | string | number | null | undefined,
  o?: OpcoesData
) {
  if (value == null) return "—"
  return fmt("data", o).format(toDate(value))
}

/** 20/06/2026, 14:30 */
export function formatDataHora(
  value: Date | string | number | null | undefined,
  o?: OpcoesData
) {
  if (value == null) return "—"
  return fmt("dataHora", o).format(toDate(value))
}

/** 14:30 */
export function formatHora(
  value: Date | string | number | null | undefined,
  o?: OpcoesData
) {
  if (value == null) return "—"
  return fmt("hora", o).format(toDate(value))
}

/** sexta-feira, 20 de junho */
export function formatDiaExtenso(
  value: Date | string | number | null | undefined,
  o?: OpcoesData
) {
  if (value == null) return "—"
  return fmt("diaExtenso", o).format(toDate(value))
}

/** junho de 2026 */
export function formatMesAno(
  value: Date | string | number | null | undefined,
  o?: OpcoesData
) {
  if (value == null) return "—"
  return fmt("mesAno", o).format(toDate(value))
}

/**
 * Chave de dia (YYYY-MM-DD) no fuso indicado — é assim que se agrupa a agenda.
 * Com o fuso errado, um serviço perto da meia-noite cai no dia errado.
 */
export function chaveDia(
  value: Date | string | number,
  o?: OpcoesData
): string {
  return fmt("chave", o).format(toDate(value))
}
