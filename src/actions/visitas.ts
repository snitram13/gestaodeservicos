"use server"

import { revalidatePath } from "next/cache"
import { and, eq } from "drizzle-orm"

import { db } from "@/db/client"
import { orcamento, servico, visita } from "@/db/schema"
import { requireEmpresa } from "@/lib/auth"
import { proximoNumeroVisita } from "@/lib/numeracao"
import { clientePertence, tecnicoPertence } from "@/lib/ownership"
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
    tecnicoId: d.tecnicoId ? d.tecnicoId : null,
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

/** Impede referenciar cliente/técnico de outra empresa (IDOR via FK do form). */
async function validarFks(
  empresaId: string,
  d: VisitaFormValues
): Promise<string | null> {
  if (!(await clientePertence(empresaId, d.clienteId)))
    return "Cliente inválido."
  if (d.tecnicoId && !(await tecnicoPertence(empresaId, d.tecnicoId)))
    return "Técnico inválido."
  return null
}

export async function criarVisita(
  input: VisitaFormValues,
  orcamentoOrigemId?: string
): Promise<Resultado> {
  const { empresaId } = await requireEmpresa()
  const parsed = visitaSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: "Dados inválidos." }
  const fkErro = await validarFks(empresaId, parsed.data)
  if (fkErro) return { ok: false, message: fkErro }

  const c = calcular(parsed.data)
  const numero = await proximoNumeroVisita(empresaId)
  const [row] = await db
    .insert(visita)
    .values({
      ...cabecalho(parsed.data, c),
      empresaId,
      numero,
      concluidoEm: parsed.data.estado === "CONCLUIDO" ? new Date() : null,
    })
    .returning({ id: visita.id })

  await db
    .insert(servico)
    .values(c.servicos.map((s) => ({ ...s, visitaId: row.id, empresaId })))

  if (orcamentoOrigemId) {
    await db
      .update(orcamento)
      .set({ visitaId: row.id })
      .where(
        and(eq(orcamento.id, orcamentoOrigemId), eq(orcamento.empresaId, empresaId))
      )
    revalidatePath(`/orcamentos/${orcamentoOrigemId}`)
  }

  revalidar()
  return { ok: true, id: row.id }
}

export async function atualizarVisita(
  id: string,
  input: VisitaFormValues
): Promise<Resultado> {
  const { empresaId } = await requireEmpresa()
  const parsed = visitaSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: "Dados inválidos." }
  const fkErro = await validarFks(empresaId, parsed.data)
  if (fkErro) return { ok: false, message: fkErro }

  const c = calcular(parsed.data)
  const existente = await db.query.visita.findFirst({
    where: and(eq(visita.id, id), eq(visita.empresaId, empresaId)),
  })
  if (!existente) return { ok: false, message: "Visita não encontrada." }
  let concluidoEm = existente.concluidoEm ?? null
  if (parsed.data.estado === "CONCLUIDO" && !concluidoEm) concluidoEm = new Date()
  if (parsed.data.estado !== "CONCLUIDO") concluidoEm = null

  await db
    .update(visita)
    .set({ ...cabecalho(parsed.data, c), concluidoEm, atualizadoEm: new Date() })
    .where(and(eq(visita.id, id), eq(visita.empresaId, empresaId)))

  await db
    .delete(servico)
    .where(and(eq(servico.visitaId, id), eq(servico.empresaId, empresaId)))
  await db
    .insert(servico)
    .values(c.servicos.map((s) => ({ ...s, visitaId: id, empresaId })))

  revalidar(id)
  return { ok: true, id }
}

export async function atualizarEstadoVisita(
  id: string,
  estado: EstadoVisita
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { empresaId } = await requireEmpresa()
  await db
    .update(visita)
    .set({
      estado,
      concluidoEm: estado === "CONCLUIDO" ? new Date() : null,
      atualizadoEm: new Date(),
    })
    .where(and(eq(visita.id, id), eq(visita.empresaId, empresaId)))
  revalidar(id)
  return { ok: true }
}

export async function apagarVisita(
  id: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { empresaId } = await requireEmpresa()
  await db
    .delete(visita)
    .where(and(eq(visita.id, id), eq(visita.empresaId, empresaId)))
  revalidar()
  return { ok: true }
}
