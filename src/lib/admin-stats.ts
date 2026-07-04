import "server-only"
import { eq, gte, sql } from "drizzle-orm"

import { db } from "@/db/client"
import { cliente, orcamento, visita } from "@/db/schema"

/** Métricas de utilização da app por um cliente/tenant. */
export type UsoEmpresa = {
  clientes: number
  visitas: number
  visitas30d: number
  orcamentos: number
  ultimaAtividade: Date | null
}

const DIA_MS = 86_400_000

function asDate(v: unknown): Date | null {
  if (!v) return null
  return v instanceof Date ? v : new Date(v as string)
}

function maisRecente(a: Date | null, b: Date | null): Date | null {
  if (!a) return b
  if (!b) return a
  return a.getTime() >= b.getTime() ? a : b
}

/** Dias decorridos desde uma data (null se não houver). */
export function diasDesde(d: Date | null): number | null {
  if (!d) return null
  return Math.floor((Date.now() - d.getTime()) / DIA_MS)
}

/** Rótulo legível de "última atividade" (ex.: "Hoje", "Há 5 dias", "Nunca"). */
export function rotuloAtividade(ultima: Date | null): string {
  const dias = diasDesde(ultima)
  if (dias == null) return "Nunca"
  if (dias <= 0) return "Hoje"
  if (dias === 1) return "Ontem"
  if (dias < 30) return `Há ${dias} dias`
  const meses = Math.floor(dias / 30)
  return meses <= 1 ? "Há 1 mês" : `Há ${meses} meses`
}

const vazio = (): UsoEmpresa => ({
  clientes: 0,
  visitas: 0,
  visitas30d: 0,
  orcamentos: 0,
  ultimaAtividade: null,
})

/**
 * Utilização agregada de TODAS as empresas (para o painel do super-admin).
 * "Atividade" = registos criados na app (visitas/orçamentos/clientes).
 */
export async function usoPorEmpresa(): Promise<Map<string, UsoEmpresa>> {
  const d30 = new Date(Date.now() - 30 * DIA_MS)
  const [vis, cli, orc] = await Promise.all([
    db
      .select({
        empresaId: visita.empresaId,
        total: sql<number>`count(*)::int`,
        recentes: sql<number>`(count(*) filter (where ${gte(visita.criadoEm, d30)}))::int`,
        ultima: sql`max(${visita.criadoEm})`,
      })
      .from(visita)
      .groupBy(visita.empresaId),
    db
      .select({
        empresaId: cliente.empresaId,
        total: sql<number>`count(*)::int`,
        ultima: sql`max(${cliente.criadoEm})`,
      })
      .from(cliente)
      .groupBy(cliente.empresaId),
    db
      .select({
        empresaId: orcamento.empresaId,
        total: sql<number>`count(*)::int`,
        ultima: sql`max(${orcamento.criadoEm})`,
      })
      .from(orcamento)
      .groupBy(orcamento.empresaId),
  ])

  const map = new Map<string, UsoEmpresa>()
  const get = (id: string) => {
    let u = map.get(id)
    if (!u) {
      u = vazio()
      map.set(id, u)
    }
    return u
  }

  for (const r of vis) {
    const u = get(r.empresaId)
    u.visitas = r.total
    u.visitas30d = r.recentes
    u.ultimaAtividade = maisRecente(u.ultimaAtividade, asDate(r.ultima))
  }
  for (const r of cli) {
    const u = get(r.empresaId)
    u.clientes = r.total
    u.ultimaAtividade = maisRecente(u.ultimaAtividade, asDate(r.ultima))
  }
  for (const r of orc) {
    const u = get(r.empresaId)
    u.orcamentos = r.total
    u.ultimaAtividade = maisRecente(u.ultimaAtividade, asDate(r.ultima))
  }
  return map
}

/** Utilização de UMA empresa (para o detalhe do cliente). */
export async function usoDeEmpresa(empresaId: string): Promise<UsoEmpresa> {
  const d30 = new Date(Date.now() - 30 * DIA_MS)
  const [vis, cli, orc] = await Promise.all([
    db
      .select({
        total: sql<number>`count(*)::int`,
        recentes: sql<number>`(count(*) filter (where ${gte(visita.criadoEm, d30)}))::int`,
        ultima: sql`max(${visita.criadoEm})`,
      })
      .from(visita)
      .where(eq(visita.empresaId, empresaId)),
    db
      .select({
        total: sql<number>`count(*)::int`,
        ultima: sql`max(${cliente.criadoEm})`,
      })
      .from(cliente)
      .where(eq(cliente.empresaId, empresaId)),
    db
      .select({
        total: sql<number>`count(*)::int`,
        ultima: sql`max(${orcamento.criadoEm})`,
      })
      .from(orcamento)
      .where(eq(orcamento.empresaId, empresaId)),
  ])

  const u = vazio()
  u.visitas = vis[0]?.total ?? 0
  u.visitas30d = vis[0]?.recentes ?? 0
  u.clientes = cli[0]?.total ?? 0
  u.orcamentos = orc[0]?.total ?? 0
  u.ultimaAtividade = maisRecente(
    maisRecente(asDate(vis[0]?.ultima), asDate(cli[0]?.ultima)),
    asDate(orc[0]?.ultima)
  )
  return u
}
