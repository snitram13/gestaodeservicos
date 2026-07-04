import "server-only"
import { cache } from "react"
import { eq } from "drizzle-orm"

import { db } from "@/db/client"
import { empresa } from "@/db/schema"
import { getUtilizadorAtual } from "@/lib/auth"
import { temModulo, type ModuloKey } from "@/lib/constants/modulos"

/** Módulos ativos da empresa do utilizador autenticado (cacheado por pedido). */
export const getModulosAtuais = cache(async (): Promise<string[]> => {
  const u = await getUtilizadorAtual()
  if (!u) return []
  const emp = await db.query.empresa.findFirst({
    columns: { modulos: true },
    where: eq(empresa.id, u.empresaId),
  })
  return emp?.modulos ?? []
})

/** A empresa atual tem o módulo indicado ativo? */
export async function temModuloAtual(key: ModuloKey): Promise<boolean> {
  return temModulo(await getModulosAtuais(), key)
}
