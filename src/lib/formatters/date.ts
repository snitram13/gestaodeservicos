/**
 * Formatação de datas em pt-PT e no fuso `Europe/Lisbon`.
 * Usamos `Intl.DateTimeFormat` com `timeZone` explícito porque o runtime na
 * Vercel corre em UTC — formatar diretamente mostraria a hora errada.
 */

const TZ = "Europe/Lisbon"

const fmtData = new Intl.DateTimeFormat("pt-PT", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: TZ,
})

const fmtDataHora = new Intl.DateTimeFormat("pt-PT", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TZ,
})

const fmtHora = new Intl.DateTimeFormat("pt-PT", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TZ,
})

const fmtDiaExtenso = new Intl.DateTimeFormat("pt-PT", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: TZ,
})

const fmtMesAno = new Intl.DateTimeFormat("pt-PT", {
  month: "long",
  year: "numeric",
  timeZone: TZ,
})

function toDate(value: Date | string | number): Date {
  return value instanceof Date ? value : new Date(value)
}

/** 20/06/2026 */
export function formatData(value: Date | string | number | null | undefined) {
  if (value == null) return "—"
  return fmtData.format(toDate(value))
}

/** 20/06/2026, 14:30 */
export function formatDataHora(
  value: Date | string | number | null | undefined
) {
  if (value == null) return "—"
  return fmtDataHora.format(toDate(value))
}

/** 14:30 */
export function formatHora(value: Date | string | number | null | undefined) {
  if (value == null) return "—"
  return fmtHora.format(toDate(value))
}

/** sexta-feira, 20 de junho */
export function formatDiaExtenso(
  value: Date | string | number | null | undefined
) {
  if (value == null) return "—"
  return fmtDiaExtenso.format(toDate(value))
}

/** junho de 2026 */
export function formatMesAno(
  value: Date | string | number | null | undefined
) {
  if (value == null) return "—"
  return fmtMesAno.format(toDate(value))
}

/** Chave de dia (YYYY-MM-DD) no fuso de Lisboa — útil para agrupar na agenda. */
export function chaveDia(value: Date | string | number): string {
  const d = toDate(value)
  const partes = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: TZ,
  }).format(d)
  return partes // en-CA devolve YYYY-MM-DD
}
