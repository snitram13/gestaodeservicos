"use server"

import { revalidatePath } from "next/cache"
import { and, count, eq, inArray } from "drizzle-orm"

import { db } from "@/db/client"
import {
  cliente,
  foto,
  orcamento,
  transacaoFinanceira,
  visita,
} from "@/db/schema"
import { requireEmpresa } from "@/lib/auth"
import { apagarDoStorage, BUCKET_SERVICO } from "@/lib/storage"
import { clienteSchemaDe, type ClienteFormValues } from "@/lib/validations/cliente"
import { getPais } from "@/lib/i18n"

type Resultado =
  | { ok: true; id: string }
  | { ok: false; message: string }

function limpar(v: string | undefined | null): string | null {
  const t = v?.trim()
  return t ? t : null
}

function valores(d: ClienteFormValues) {
  return {
    nome: d.nome.trim(),
    telefone: d.telefone.trim(),
    email: limpar(d.email),
    nif: limpar(d.nif),
    morada: limpar(d.morada),
    cidade: limpar(d.cidade),
    codigoPostal: limpar(d.codigoPostal),
    notas: limpar(d.notas),
  }
}

export async function criarCliente(input: ClienteFormValues): Promise<Resultado> {
  const { empresaId } = await requireEmpresa()
  const parsed = clienteSchemaDe(await getPais()).safeParse(input)
  if (!parsed.success) return { ok: false, message: "Dados inválidos." }

  const [row] = await db
    .insert(cliente)
    .values({ ...valores(parsed.data), empresaId })
    .returning({ id: cliente.id })

  revalidatePath("/clientes")
  return { ok: true, id: row.id }
}

export async function atualizarCliente(
  id: string,
  input: ClienteFormValues
): Promise<Resultado> {
  const { empresaId } = await requireEmpresa()
  const parsed = clienteSchemaDe(await getPais()).safeParse(input)
  if (!parsed.success) return { ok: false, message: "Dados inválidos." }

  await db
    .update(cliente)
    .set({ ...valores(parsed.data), atualizadoEm: new Date() })
    .where(and(eq(cliente.id, id), eq(cliente.empresaId, empresaId)))

  revalidatePath("/clientes")
  revalidatePath(`/clientes/${id}`)
  return { ok: true, id }
}

/** O que desaparece se este cliente for apagado — para o aviso de confirmação. */
export type ResumoCliente = {
  visitas: number
  orcamentos: number
  fotos: number
  transacoes: number
}

export async function resumoCliente(id: string): Promise<ResumoCliente | null> {
  const { empresaId } = await requireEmpresa()
  const alvo = await db.query.cliente.findFirst({
    columns: { id: true },
    where: and(eq(cliente.id, id), eq(cliente.empresaId, empresaId)),
  })
  if (!alvo) return null

  const visitas = await db
    .select({ id: visita.id })
    .from(visita)
    .where(and(eq(visita.clienteId, id), eq(visita.empresaId, empresaId)))
  const ids = visitas.map((v) => v.id)

  const [orcs] = await db
    .select({ n: count() })
    .from(orcamento)
    .where(and(eq(orcamento.clienteId, id), eq(orcamento.empresaId, empresaId)))
  const [txs] = await db
    .select({ n: count() })
    .from(transacaoFinanceira)
    .where(
      and(
        eq(transacaoFinanceira.clienteId, id),
        eq(transacaoFinanceira.empresaId, empresaId)
      )
    )
  const fotos = ids.length
    ? (
        await db
          .select({ n: count() })
          .from(foto)
          .where(
            and(eq(foto.empresaId, empresaId), inArray(foto.visitaId, ids))
          )
      )[0].n
    : 0

  return {
    visitas: visitas.length,
    orcamentos: orcs.n,
    fotos,
    transacoes: txs.n,
  }
}

/**
 * Apaga o cliente e TUDO o que lhe pertence: serviços (com os seus serviços,
 * fotos, assinatura e avaliação) e orçamentos (com as suas linhas). As
 * transações financeiras já registadas MANTÊM-SE — só perdem a ligação ao
 * cliente (`clienteId` fica a null), para não alterar as contas do Financeiro.
 */
export async function apagarCliente(
  id: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { empresaId } = await requireEmpresa()
  const alvo = await db.query.cliente.findFirst({
    columns: { id: true },
    where: and(eq(cliente.id, id), eq(cliente.empresaId, empresaId)),
  })
  if (!alvo) return { ok: false, message: "Cliente não encontrado." }

  // Ficheiros primeiro — as linhas somem por cascade, os ficheiros não.
  const visitas = await db
    .select({ id: visita.id, assinaturaPath: visita.assinaturaPath })
    .from(visita)
    .where(and(eq(visita.clienteId, id), eq(visita.empresaId, empresaId)))
  const ids = visitas.map((v) => v.id)
  const fotos = ids.length
    ? await db
        .select({ path: foto.storagePath })
        .from(foto)
        .where(and(eq(foto.empresaId, empresaId), inArray(foto.visitaId, ids)))
    : []
  await apagarDoStorage(BUCKET_SERVICO, [
    ...fotos.map((f) => f.path),
    ...visitas.map((v) => v.assinaturaPath),
  ])

  // Orçamentos (→ linhas) e serviços (→ serviços, fotos, avaliação) antes do
  // cliente: ambas as FKs para `cliente` são RESTRICT.
  await db
    .delete(orcamento)
    .where(and(eq(orcamento.clienteId, id), eq(orcamento.empresaId, empresaId)))
  await db
    .delete(visita)
    .where(and(eq(visita.clienteId, id), eq(visita.empresaId, empresaId)))
  await db
    .delete(cliente)
    .where(and(eq(cliente.id, id), eq(cliente.empresaId, empresaId)))

  revalidatePath("/clientes")
  revalidatePath("/visitas")
  revalidatePath("/orcamentos")
  revalidatePath("/agenda")
  revalidatePath("/financeiro")
  revalidatePath("/")
  return { ok: true }
}
