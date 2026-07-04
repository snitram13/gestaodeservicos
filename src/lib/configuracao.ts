import "server-only"
import { cache } from "react"
import { eq } from "drizzle-orm"

import { db } from "@/db/client"
import { empresa, type Empresa } from "@/db/schema"
import { requireEmpresa } from "@/lib/auth"

/**
 * Devolve a empresa (perfil/configuração) do utilizador autenticado. A antiga
 * `configuracao` de linha única foi absorvida pela tabela `empresa` — cada
 * empresa é a sua própria configuração (marca, NIF, IBAN, logótipo…).
 */
export const getEmpresaAtual = cache(async (): Promise<Empresa> => {
  const { empresaId } = await requireEmpresa()
  const row = await db.query.empresa.findFirst({
    where: eq(empresa.id, empresaId),
  })
  if (!row) throw new Error("Empresa não encontrada.")
  return row
})

/**
 * @deprecated A configuração passou a ser a própria empresa. Mantido como
 * alias para não partir código antigo (PDF, orçamentos). Usar `getEmpresaAtual`.
 */
export const getConfiguracao = getEmpresaAtual
