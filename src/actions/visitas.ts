"use server"

import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"

import { db } from "@/db/client"
import { orcamento, servico, visita } from "@/db/schema"
import { requireUser } from "@/lib/auth"
import { parseEuro } from "@/lib/formatters/currency"
import type { EstadoVisita } from "@/lib/constants/enums"
import { visitaSchema, type VisitaFormValues } from "@/lib/validations/visita"

type Resultado = { ok: true; id: string } | { ok: false; message: string }

function calcular(d: VisitaFormValues) {
  const servicos = d.servicos.map((s, i) => {
    const mao = parseEuro(s.maoDeObra)
    const mat = parseEuro(s.material)
    return {
      categoria: s.categoria,
      titulo: s.titulo.trim(),
      descricao: s.descricao.trim() || null,
      maoDeObra: String(mao),
      material: String(mat),
      valor: String(mao + mat),
      ordem: i,
    }
  })
  const somaServicos = servicos.reduce((s, x) => s + Number(x.valor), 0)
  const deslocacao = parseEuro(d.deslocacao)
  return { servicos, deslocacao, total: somaServicos + deslocacao }
}

function tituloResumo(servicos: { titulo: string }[]) {
  if (servicos.length === 0) return null
  return servicos.length === 1
    ? servicos[0].titulo
    : `${servicos[0].titulo} (+${servicos.length - 1})`
}

function cabecalho(d: VisitaFormValues, c: ReturnType<typeof calcular>) {
  return {
    clienteId: d.clienteId,
    estado: d.estado,
    titulo: tituloResumo(c.servicos),
    descricao: d.descricao.trim() || null,
    moradaServico: d.moradaServico.trim() || null,
    cidade: d.cidade.trim() || null,
    agendadoPara: new Date(d.agendadoPara),
    deslocacao: String(c.deslocacao),
    valor: String(c.total),
    kmPercorridos: String(parseEuro(d.kmPercorridos)),
  }
}

function revalidar(id?: string) {
  revalidatePath("/visitas")
  revalidatePath("/agenda")
  revalidatePath("/")
  if (id) revalidatePath(`/visitas/${id}`)
}

export async function criarVisita(
  input: VisitaFormValues,
  orcamentoOrigemId?: string
): Promise<Resultado> {
  await requireUser()
  const parsed = visitaSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: "Dados inválidos." }

  const c = calcular(parsed.data)
  const [row] = await db
    .insert(visita)
    .values({
      ...cabecalho(parsed.data, c),
      concluidoEm: parsed.data.estado === "CONCLUIDO" ? new Date() : null,
    })
    .returning({ id: visita.id })

  await db
    .insert(servico)
    .values(c.servicos.map((s) => ({ ...s, visitaId: row.id })))

  if (orcamentoOrigemId) {
    await db
      .update(orcamento)
      .set({ visitaId: row.id })
      .where(eq(orcamento.id, orcamentoOrigemId))
    revalidatePath(`/orcamentos/${orcamentoOrigemId}`)
  }

  revalidar()
  return { ok: true, id: row.id }
}

export async function atualizarVisita(
  id: string,
  input: VisitaFormValues
): Promise<Resultado> {
  await requireUser()
  const parsed = visitaSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: "Dados inválidos." }

  const c = calcular(parsed.data)
  const existente = await db.query.visita.findFirst({
    where: eq(visita.id, id),
  })
  let concluidoEm = existente?.concluidoEm ?? null
  if (parsed.data.estado === "CONCLUIDO" && !concluidoEm) concluidoEm = new Date()
  if (parsed.data.estado !== "CONCLUIDO") concluidoEm = null

  await db
    .update(visita)
    .set({ ...cabecalho(parsed.data, c), concluidoEm, atualizadoEm: new Date() })
    .where(eq(visita.id, id))

  await db.delete(servico).where(eq(servico.visitaId, id))
  await db
    .insert(servico)
    .values(c.servicos.map((s) => ({ ...s, visitaId: id })))

  revalidar(id)
  return { ok: true, id }
}

export async function atualizarEstadoVisita(
  id: string,
  estado: EstadoVisita
): Promise<{ ok: true } | { ok: false; message: string }> {
  await requireUser()
  await db
    .update(visita)
    .set({
      estado,
      concluidoEm: estado === "CONCLUIDO" ? new Date() : null,
      atualizadoEm: new Date(),
    })
    .where(eq(visita.id, id))
  revalidar(id)
  return { ok: true }
}

export async function apagarVisita(
  id: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  await requireUser()
  await db.delete(visita).where(eq(visita.id, id))
  revalidar()
  return { ok: true }
}
