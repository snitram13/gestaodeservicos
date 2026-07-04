import "server-only"
import { eq, sql } from "drizzle-orm"

import { db } from "@/db/client"
import { empresa } from "@/db/schema"

/**
 * Numeração de visitas/orçamentos POR empresa: cada empresa começa no #1.
 * O próximo número é alocado atomicamente incrementando o contador na linha
 * da empresa (`UPDATE ... RETURNING`), o que dá números únicos mesmo com
 * pedidos concorrentes. Um insert falhado apenas "queima" um número — aceitável.
 */

async function alocar(
  empresaId: string,
  coluna: "proxNumVisita" | "proxNumOrcamento"
): Promise<number> {
  const col = empresa[coluna]
  const [row] = await db
    .update(empresa)
    .set({ [coluna]: sql`${col} + 1`, atualizadoEm: new Date() })
    .where(eq(empresa.id, empresaId))
    .returning({ n: col })
  if (!row) throw new Error("Empresa não encontrada ao alocar número.")
  // `returning` devolve o valor JÁ incrementado; o número alocado é o anterior.
  return row.n - 1
}

/** Próximo número sequencial de VISITA da empresa. */
export function proximoNumeroVisita(empresaId: string): Promise<number> {
  return alocar(empresaId, "proxNumVisita")
}

/** Próximo número sequencial de ORÇAMENTO da empresa. */
export function proximoNumeroOrcamento(empresaId: string): Promise<number> {
  return alocar(empresaId, "proxNumOrcamento")
}
