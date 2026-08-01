"use client"

import { createContext, useContext } from "react"

import { rotulosServico } from "@/lib/constants/modulos"
import { useT } from "@/components/i18n/idioma-provider"

/**
 * Disponibiliza aos componentes cliente os rótulos "Visita" vs "Serviço"
 * conforme o módulo Ordens de Serviço da empresa (montado no layout (app)).
 */
const TemServicosContext = createContext(false)

export function RotulosProvider({
  temServicos,
  children,
}: {
  temServicos: boolean
  children: React.ReactNode
}) {
  return (
    <TemServicosContext.Provider value={temServicos}>
      {children}
    </TemServicosContext.Provider>
  )
}

export function useRotulos() {
  // eslint-disable-next-line react-hooks/rules-of-hooks -- ambos são hooks
  return rotulosServico(useContext(TemServicosContext), useT())
}
