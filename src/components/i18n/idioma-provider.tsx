"use client"

import { createContext, useContext, useMemo } from "react"

import { IDIOMA_PADRAO, type Idioma } from "@/lib/constants/idiomas"
import type { Traduzir } from "@/lib/i18n/dicionarios"

type Valor = { idioma: Idioma; dic: Record<string, string> }

const IdiomaContext = createContext<Valor>({ idioma: IDIOMA_PADRAO, dic: {} })

/**
 * Leva o idioma e os textos traduzidos aos componentes CLIENTE. O layout
 * (server) resolve o idioma e passa só o dicionário desse idioma — não vão
 * para o browser os dos outros países.
 */
export function IdiomaProvider({
  idioma,
  dic,
  children,
}: Valor & { children: React.ReactNode }) {
  const valor = useMemo(() => ({ idioma, dic }), [idioma, dic])
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
