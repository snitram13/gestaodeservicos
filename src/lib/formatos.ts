import "server-only"
import { cache } from "react"

import { metaPais } from "@/lib/constants/paises"
import { getIdioma, getPais } from "@/lib/i18n"
import {
  chaveDia,
  formatData,
  formatDataHora,
  formatDiaExtenso,
  formatHora,
  formatMesAno,
} from "@/lib/formatters/date"
import { formatEuro } from "@/lib/formatters/currency"
import { formatTelefone, normalizarTelefone, telLink } from "@/lib/formatters/phone"

/**
 * Formatadores já ligados ao país e ao idioma da empresa do pedido. Usar isto
 * nas páginas de negócio em vez dos formatadores soltos — é o que garante que
 * um serviço às 14h em Madrid aparece às 14h e não às 13h.
 *
 *   const f = await getFormatos()
 *   f.dataHora(visita.agendadoPara)
 */
export const getFormatos = cache(async () => {
  const [pais, idioma] = await Promise.all([getPais(), getIdioma()])
  const meta = metaPais(pais)
  // Idioma da pessoa + convenções do país (um português em Espanha lê em
  // português mas com as horas de Madrid).
  const locale = `${idioma}-${pais}`
  const o = { tz: meta.fuso, locale }

  return {
    pais,
    idioma,
    locale,
    tz: meta.fuso,
    data: (v: Date | string | number | null | undefined) => formatData(v, o),
    dataHora: (v: Date | string | number | null | undefined) =>
      formatDataHora(v, o),
    hora: (v: Date | string | number | null | undefined) => formatHora(v, o),
    diaExtenso: (v: Date | string | number | null | undefined) =>
      formatDiaExtenso(v, o),
    mesAno: (v: Date | string | number | null | undefined) => formatMesAno(v, o),
    chaveDia: (v: Date | string | number) => chaveDia(v, o),
    /** Dia de hoje (YYYY-MM-DD) no fuso da empresa. */
    hoje: () => chaveDia(new Date(), o),
    euro: (v: number | string | null | undefined) => formatEuro(v, locale),
    telefone: (v: string | null | undefined) => formatTelefone(v, pais),
    telefoneE164: (v: string | null | undefined) => normalizarTelefone(v, pais),
    telLink: (v: string | null | undefined) => telLink(v, pais),
  }
})

export type Formatos = Awaited<ReturnType<typeof getFormatos>>
