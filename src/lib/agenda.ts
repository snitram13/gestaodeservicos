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
import { pt } from "date-fns/locale"

export type Vista = "dia" | "semana" | "mes"

const SEMANA = { weekStartsOn: 1 as const, locale: pt }

/** Dia de hoje (YYYY-MM-DD) no fuso de Lisboa. */
export function hojeKey(): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Europe/Lisbon",
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

export function rotuloVista(vista: Vista, dateStr: string): string {
  const base = dataDe(dateStr)
  if (vista === "dia") {
    return format(base, "EEEE, d 'de' MMMM", { locale: pt })
  }
  if (vista === "semana") {
    const ini = startOfWeek(base, SEMANA)
    const fim = endOfWeek(base, SEMANA)
    return `${format(ini, "d MMM", { locale: pt })} – ${format(fim, "d MMM yyyy", { locale: pt })}`
  }
  return format(base, "MMMM 'de' yyyy", { locale: pt })
}

export function navDatas(vista: Vista, dateStr: string) {
  const base = dataDe(dateStr)
  if (vista === "dia") {
    return {
      anterior: fmtKey(subDays(base, 1)),
      seguinte: fmtKey(addDays(base, 1)),
      hoje: hojeKey(),
    }
  }
  if (vista === "semana") {
    return {
      anterior: fmtKey(subWeeks(base, 1)),
      seguinte: fmtKey(addWeeks(base, 1)),
      hoje: hojeKey(),
    }
  }
  return {
    anterior: fmtKey(subMonths(base, 1)),
    seguinte: fmtKey(addMonths(base, 1)),
    hoje: hojeKey(),
  }
}

/** Rótulos curtos do dia: { diaSemana: "seg", diaMes: "16", mesAno: false } */
export function rotuloDia(dateStr: string) {
  const d = dataDe(dateStr)
  return {
    semana: format(d, "EEEEEE", { locale: pt }), // seg, ter…
    dia: format(d, "d"),
    mesNum: Number(format(d, "M")),
  }
}
