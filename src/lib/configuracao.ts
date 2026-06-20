import "server-only"
import { cache } from "react"

import { db } from "@/db/client"
import { configuracao, type Configuracao } from "@/db/schema"

/** Devolve a configuração da empresa (cria uma linha por omissão se faltar). */
export const getConfiguracao = cache(async (): Promise<Configuracao> => {
  const row = await db.query.configuracao.findFirst()
  if (row) return row
  const [novo] = await db.insert(configuracao).values({}).returning()
  return novo
})
