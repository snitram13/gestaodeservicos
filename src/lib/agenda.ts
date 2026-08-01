import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from "date-fns"
import { es, fr, pt, type Locale } from "date-fns/locale"

import { IDIOMA_PADRAO, type Idioma } from "@/lib/constants/idiomas"

/** Locale do date-fns para os nomes de dias e meses. */
const LOCALES: Record<Idioma, Locale> = { pt, es, fr }
function loc(idioma: Idioma = IDIOMA_PADRAO): Locale {
  return LOCALES[idioma] ?? pt
}
/** Fuso por omissão (Portugal) — as páginas passam o da empresa. */
const TZ_PADRAO = "Europe/Lisbon"

export type Vista = "dia" | "semana" | "mes"

// A semana começa à segunda nos três países.
const SEMANA = { weekStartsOn: 1 as const, locale: pt }

/**
 * Dia de hoje (YYYY-MM-DD) no fuso indicado. Sem fuso assume Portugal — em
 * Espanha/França o "hoje" muda 1h mais cedo, o que perto da meia-noite dá um
 * dia diferente.
 */
export function hojeKey(tz: string = TZ_PADRAO): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: tz,
  }).format(new Date())
}

function dataDe(dateStr: string): Date {
  return parseISO(dateStr)
}

export function fmtKey(date: Date): string {
  return format(date, "yyyy-MM-dd")
}

export function vistaValida(v: string | undefined): Vista {
  return v === "dia" || v === "semana" || v === "mes" ? v : "semana"
}

/** Lista de dias (YYYY-MM-DD) que a vista mostra. */
export function diasDaVista(vista: Vista, dateStr: string): string[] {
  const base = dataDe(dateStr)
  if (vista === "dia") return [fmtKey(base)]
  if (vista === "semana") {
    return eachDayOfInterval({
      start: startOfWeek(base, SEMANA),
      end: endOfWeek(base, SEMANA),
    }).map(fmtKey)
  }
  return eachDayOfInterval({
    start: startOfWeek(startOfMonth(base), SEMANA),
    end: endOfWeek(endOfMonth(base), SEMANA),
  }).map(fmtKey)
}

/** Intervalo de datas a ir buscar à BD (com folga de 1 dia para o fuso). */
export function intervaloFetch(dias: string[]) {
  return {
    inicio: subDays(dataDe(dias[0]), 1),
    fim: addDays(dataDe(dias[dias.length - 1]), 2),
  }
}

export function rotuloVista(
  vista: Vista,
  dateStr: string,
  idioma: Idioma = IDIOMA_PADRAO
): string {
  const base = dataDe(dateStr)
  const locale = loc(idioma)
  if (vista === "dia") {
    return format(base, "PPPP", { locale })
  }
  if (vista === "semana") {
    const ini = startOfWeek(base, SEMANA)
    const fim = endOfWeek(base, SEMANA)
    return `${format(ini, "d MMM", { locale })} – ${format(fim, "d MMM yyyy", { locale })}`
  }
  return format(base, "LLLL yyyy", { locale })
}

export function navDatas(
  vista: Vista,
  dateStr: string,
  tz: string = TZ_PADRAO
) {
  const base = dataDe(dateStr)
  if (vista === "dia") {
    return {
      anterior: fmtKey(subDays(base, 1)),
      seguinte: fmtKey(addDays(base, 1)),
      hoje: hojeKey(tz),
    }
  }
  if (vista === "semana") {
    return {
      anterior: fmtKey(subWeeks(base, 1)),
      seguinte: fmtKey(addWeeks(base, 1)),
      hoje: hojeKey(tz),
    }
  }
  return {
    anterior: fmtKey(subMonths(base, 1)),
    seguinte: fmtKey(addMonths(base, 1)),
    hoje: hojeKey(tz),
  }
}

/** Rótulos curtos do dia: { diaSemana: "seg", diaMes: "16", mesAno: false } */
export function rotuloDia(dateStr: string, idioma: Idioma = IDIOMA_PADRAO) {
  const d = dataDe(dateStr)
  return {
    semana: format(d, "EEEEEE", { locale: loc(idioma) }), // seg, ter…
    dia: format(d, "d"),
    mesNum: Number(format(d, "M")),
  }
}
