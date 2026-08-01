"use client"

import { createContext, useContext, useMemo } from "react"

import { IDIOMA_PADRAO, type Idioma } from "@/lib/constants/idiomas"
import { metaPais, PAIS_PADRAO, type Pais } from "@/lib/constants/paises"
import type { Traduzir } from "@/lib/i18n/dicionarios"
import {
  chaveDia,
  formatData,
  formatDataHora,
  formatDiaExtenso,
  formatHora,
  formatMesAno,
} from "@/lib/formatters/date"
import { formatEuro, formatValor } from "@/lib/formatters/currency"
import { formatTelefone, normalizarTelefone, telLink } from "@/lib/formatters/phone"

type Valor = { idioma: Idioma; pais: Pais; dic: Record<string, string> }

const IdiomaContext = createContext<Valor>({
  idioma: IDIOMA_PADRAO,
  pais: PAIS_PADRAO,
  dic: {},
})

/**
 * Leva o idioma e os textos traduzidos aos componentes CLIENTE. O layout
 * (server) resolve o idioma e passa só o dicionário desse idioma — não vão
 * para o browser os dos outros países.
 */
export function IdiomaProvider({
  idioma,
  pais,
  dic,
  children,
}: Valor & { children: React.ReactNode }) {
  const valor = useMemo(() => ({ idioma, pais, dic }), [idioma, pais, dic])
  return <IdiomaContext.Provider value={valor}>{children}</IdiomaContext.Provider>
}

/** Idioma ativo (para formatadores do lado do cliente). */
export function useIdioma(): Idioma {
  return useContext(IdiomaContext).idioma
}

/**
 * Tradução em componentes cliente:
 *   const t = useT()
 *   <Button>{t("Guardar")}</Button>
 */
export function useT(): Traduzir {
  const { dic } = useContext(IdiomaContext)
  return useMemo(
    () => (texto, vars) => {
      const base = dic[texto] ?? texto
      if (!vars) return base
      return base.replace(/\{(\w+)\}/g, (todo, chave: string) =>
        chave in vars ? String(vars[chave]) : todo
      )
    },
    [dic]
  )
}

/** País da empresa (formato do telefone, código postal, fuso). */
export function usePais(): Pais {
  return useContext(IdiomaContext).pais
}

/**
 * Formatadores já ligados ao país e ao idioma, do lado do cliente — o
 * equivalente ao `getFormatos()` do servidor. Usar sempre isto para mostrar
 * datas/horas/valores em componentes cliente.
 */
export function useFormatos() {
  const { idioma, pais } = useContext(IdiomaContext)
  return useMemo(() => {
    const meta = metaPais(pais)
    const locale = `${idioma}-${pais}`
    const o = { tz: meta.fuso, locale }
    return {
      pais,
      locale,
      tz: meta.fuso,
      data: (v: Date | string | number | null | undefined) => formatData(v, o),
      dataHora: (v: Date | string | number | null | undefined) =>
        formatDataHora(v, o),
      hora: (v: Date | string | number | null | undefined) => formatHora(v, o),
      diaExtenso: (v: Date | string | number | null | undefined) =>
        formatDiaExtenso(v, o),
      mesAno: (v: Date | string | number | null | undefined) =>
        formatMesAno(v, o),
      chaveDia: (v: Date | string | number) => chaveDia(v, o),
      hoje: () => chaveDia(new Date(), o),
      euro: (v: number | string | null | undefined) => formatEuro(v, locale),
      valor: (v: number | string | null | undefined) => formatValor(v, locale),
      telefone: (v: string | null | undefined) => formatTelefone(v, pais),
      telefoneE164: (v: string | null | undefined) =>
        normalizarTelefone(v, pais),
      telLink: (v: string | null | undefined) => telLink(v, pais),
    }
  }, [idioma, pais])
}
