"use server"

import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"

import { db } from "@/db/client"
import { transacaoFinanceira, visita } from "@/db/schema"
import { requireUser } from "@/lib/auth"
import { hojeKey } from "@/lib/agenda"
import { parseEuro } from "@/lib/formatters/currency"
import type { MetodoPagamento } from "@/lib/constants/enums"
import {
  transacaoSchema,
  type TransacaoFormValues,
} from "@/lib/validations/transacao"

type Ok = { ok: true } | { ok: false; message: string }

export async function criarTransacao(input: TransacaoFormValues): Promise<Ok> {
  await requireUser()
  const parsed = transacaoSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: "Dados inválidos." }

  const d = parsed.data
  await db.insert(transacaoFinanceira).values({
    tipo: d.tipo,
    categoria: d.categoria,
    valor: String(parseEuro(d.valor)),
    data: d.data,
    descricao: d.descricao.trim() || null,
    metodoPagamento: d.metodoPagamento
      ? (d.metodoPagamento as MetodoPagamento)
      : null,
  })

  revalidatePath("/financeiro")
  revalidatePath("/")
  return { ok: true }
}

export async function apagarTransacao(id: string): Promise<Ok> {
  await requireUser()
  await db.delete(transacaoFinanceira).where(eq(transacaoFinanceira.id, id))
  revalidatePath("/financeiro")
  revalidatePath("/")
  return { ok: true }
}

export async function registarPagamentoVisita(
  visitaId: string,
  valor: string,
  metodo: string
): Promise<Ok> {
  await requireUser()
  const v = await db.query.visita.findFirst({ where: eq(visita.id, visitaId) })
  if (!v) return { ok: false, message: "Visita não encontrada." }

  const n = parseEuro(valor)
  await db.insert(transacaoFinanceira).values({
    tipo: "ENTRADA",
    categoria: "SERVICO",
    valor: String(n > 0 ? n : Number(v.valor)),
    data: hojeKey(),
    descricao: `Pagamento — visita #${v.numero}`,
    visitaId,
    clienteId: v.clienteId,
    metodoPagamento: metodo ? (metodo as MetodoPagamento) : null,
  })

  revalidatePath("/financeiro")
  revalidatePath("/")
  revalidatePath(`/visitas/${visitaId}`)
  return { ok: true }
}
