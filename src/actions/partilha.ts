"use server"

import { requireEmpresa } from "@/lib/auth"
import { temModuloAtual } from "@/lib/modulos"
import { MODULOS } from "@/lib/constants/modulos"
import { bufferOrcamento, bufferOrdemServico } from "@/lib/pdf-gen"
import { BUCKET_SERVICO } from "@/lib/storage"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"

type Resultado = { ok: true; url: string } | { ok: false; message: string }

const VALIDADE_LINK = 7 * 24 * 3600 // 7 dias

/** Guarda o PDF no Storage privado e devolve um link assinado temporário. */
async function guardarELincar(
  empresaId: string,
  buffer: Buffer,
  nome: string
): Promise<Resultado> {
  const path = `partilha/${empresaId}/${crypto.randomUUID()}-${nome}.pdf`
  const admin = createSupabaseAdminClient()
  const { error } = await admin.storage
    .from(BUCKET_SERVICO)
    .upload(path, buffer, { contentType: "application/pdf" })
  if (error) return { ok: false, message: error.message }

  const { data } = await admin.storage
    .from(BUCKET_SERVICO)
    .createSignedUrl(path, VALIDADE_LINK)
  if (!data?.signedUrl) {
    return { ok: false, message: "Não foi possível criar o link." }
  }
  return { ok: true, url: data.signedUrl }
}

/** Link partilhável do PDF de um orçamento (para enviar por WhatsApp). */
export async function linkOrcamentoPdf(id: string): Promise<Resultado> {
  const { empresaId } = await requireEmpresa()
  const r = await bufferOrcamento(id, empresaId)
  if (!r) return { ok: false, message: "Orçamento não encontrado." }
  return guardarELincar(empresaId, r.buffer, `orcamento-${r.numero}`)
}

/** Link partilhável do PDF de uma ordem de serviço. */
export async function linkOrdemServicoPdf(id: string): Promise<Resultado> {
  const { empresaId } = await requireEmpresa()
  if (!(await temModuloAtual(MODULOS.ORDENS_SERVICO))) {
    return { ok: false, message: "Módulo não disponível." }
  }
  const r = await bufferOrdemServico(id, empresaId)
  if (!r) return { ok: false, message: "Visita não encontrada." }
  return guardarELincar(empresaId, r.buffer, `ordem-servico-${r.numero}`)
}
