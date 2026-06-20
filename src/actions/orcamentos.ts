"use server"

import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"

import { db } from "@/db/client"
import { orcamento, orcamentoItem } from "@/db/schema"
import { requireUser } from "@/lib/auth"
import { parseEuro } from "@/lib/formatters/currency"
import type { EstadoOrcamento } from "@/lib/constants/enums"
import {
  orcamentoSchema,
  type OrcamentoFormValues,
} from "@/lib/validations/orcamento"

type Resultado = { ok: true; id: string } | { ok: false; message: string }

function calcular(d: OrcamentoFormValues) {
  const itens = d.itens.map((it, i) => {
    const q = parseEuro(it.quantidade)
    const p = parseEuro(it.precoUnit)
    return {
      descricao: it.descricao.trim(),
      quantidade: String(q),
      precoUnit: String(p),
      totalLinha: String(q * p),
      ordem: i,
    }
  })
  const subtotal = itens.reduce((s, it) => s + Number(it.totalLinha), 0)
  const taxa = parseEuro(d.taxaIva)
  const totalIva = (subtotal * taxa) / 100
  return { itens, subtotal, totalIva, total: subtotal + totalIva, taxa }
}

function cabecalho(d: OrcamentoFormValues, c: ReturnType<typeof calcular>) {
  return {
    clienteId: d.clienteId,
    categoria: d.categoria,
    estado: d.estado,
    titulo: d.titulo.trim(),
    descricao: d.descricao.trim() || null,
    validade: d.validade || null,
    taxaIva: String(c.taxa),
    subtotal: String(c.subtotal),
    totalIva: String(c.totalIva),
    total: String(c.total),
    notas: d.notas.trim() || null,
  }
}

export async function criarOrcamento(
  input: OrcamentoFormValues,
  visitaId?: string
): Promise<Resultado> {
  await requireUser()
  const parsed = orcamentoSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: "Dados inválidos." }

  const c = calcular(parsed.data)
  const [row] = await db
    .insert(orcamento)
    .values({ ...cabecalho(parsed.data, c), visitaId: visitaId ?? null })
    .returning({ id: orcamento.id })

  await db
    .insert(orcamentoItem)
    .values(c.itens.map((it) => ({ ...it, orcamentoId: row.id })))

  if (visitaId) revalidatePath(`/visitas/${visitaId}`)
  revalidatePath("/orcamentos")
  return { ok: true, id: row.id }
}

export async function atualizarOrcamento(
  id: string,
  input: OrcamentoFormValues
): Promise<Resultado> {
  await requireUser()
  const parsed = orcamentoSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: "Dados inválidos." }

  const c = calcular(parsed.data)
  await db
    .update(orcamento)
    .set({ ...cabecalho(parsed.data, c), atualizadoEm: new Date() })
    .where(eq(orcamento.id, id))

  await db.delete(orcamentoItem).where(eq(orcamentoItem.orcamentoId, id))
  await db
    .insert(orcamentoItem)
    .values(c.itens.map((it) => ({ ...it, orcamentoId: id })))

  revalidatePath("/orcamentos")
  revalidatePath(`/orcamentos/${id}`)
  return { ok: true, id }
}

export async function atualizarEstadoOrcamento(
  id: string,
  estado: EstadoOrcamento
): Promise<{ ok: true } | { ok: false; message: string }> {
  await requireUser()
  await db
    .update(orcamento)
    .set({
      estado,
      atualizadoEm: new Date(),
      ...(estado === "ENVIADO" ? { enviadoEm: new Date() } : {}),
      ...(estado === "ACEITE" ? { aceiteEm: new Date() } : {}),
    })
    .where(eq(orcamento.id, id))

  revalidatePath("/orcamentos")
  revalidatePath(`/orcamentos/${id}`)
  return { ok: true }
}

export async function apagarOrcamento(
  id: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  await requireUser()
  await db.delete(orcamento).where(eq(orcamento.id, id))
  revalidatePath("/orcamentos")
  return { ok: true }
}
