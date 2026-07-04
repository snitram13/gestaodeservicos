import "server-only"
import { and, eq, ne } from "drizzle-orm"

import { db } from "@/db/client"
import { utilizador } from "@/db/schema"

/**
 * Nº de funcionários ATIVOS (não-dono) de uma empresa. É a base tanto do preço
 * (cada um custa +4,99/mês) como do limite de lugares. O dono (role OWNER) está
 * incluído na mensalidade base e nunca conta como funcionário.
 */
export function contarFuncionarios(empresaId: string): Promise<number> {
  return db.$count(
    utilizador,
    and(
      eq(utilizador.empresaId, empresaId),
      eq(utilizador.ativo, true),
      ne(utilizador.role, "OWNER")
    )
  )
}

/**
 * Conta funcionários (ativos, não-dono) a partir de uma lista já carregada —
 * evita uma query extra nas páginas que já trazem os utilizadores.
 */
export function contarFuncionariosDe(
  utilizadores: { role: string; ativo: boolean }[]
): number {
  return utilizadores.filter((u) => u.ativo && u.role !== "OWNER").length
}
