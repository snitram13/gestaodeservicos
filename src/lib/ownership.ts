import "server-only"
import { and, eq } from "drizzle-orm"

import { db } from "@/db/client"
import { cliente, utilizador, visita } from "@/db/schema"

/**
 * Verificações de propriedade de chaves estrangeiras vindas do formulário.
 * As Server Actions são endpoints públicos: um pedido forjado pode enviar o id
 * de um cliente/visita/técnico de OUTRA empresa. Antes de o gravar numa linha,
 * confirmamos que esse id pertence à empresa atual — senão é uma referência
 * cruzada que expõe dados alheios via relações (nome/telefone do cliente, etc.).
 */

export async function clientePertence(
  empresaId: string,
  clienteId: string
): Promise<boolean> {
  const row = await db.query.cliente.findFirst({
    columns: { id: true },
    where: and(eq(cliente.id, clienteId), eq(cliente.empresaId, empresaId)),
  })
  return !!row
}

export async function visitaPertence(
  empresaId: string,
  visitaId: string
): Promise<boolean> {
  const row = await db.query.visita.findFirst({
    columns: { id: true },
    where: and(eq(visita.id, visitaId), eq(visita.empresaId, empresaId)),
  })
  return !!row
}

/** Técnico = utilizador (ativo) da mesma empresa. */
export async function tecnicoPertence(
  empresaId: string,
  tecnicoId: string
): Promise<boolean> {
  const row = await db.query.utilizador.findFirst({
    columns: { id: true },
    where: and(
      eq(utilizador.id, tecnicoId),
      eq(utilizador.empresaId, empresaId),
      eq(utilizador.ativo, true)
    ),
  })
  return !!row
}
