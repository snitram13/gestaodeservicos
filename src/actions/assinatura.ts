"use server"

import { revalidatePath } from "next/cache"
import { and, eq } from "drizzle-orm"

import { db } from "@/db/client"
import { visita } from "@/db/schema"
import { requireEmpresa } from "@/lib/auth"
import { temModuloAtual } from "@/lib/modulos"
import { MODULOS } from "@/lib/constants/modulos"
import { BUCKET_SERVICO } from "@/lib/storage"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"

type Ok = { ok: true } | { ok: false; message: string }

/** Guarda a assinatura do cliente (PNG base64) no Storage. Só com o módulo. */
export async function guardarAssinatura(
  visitaId: string,
  dataUrl: string
): Promise<Ok> {
  const { empresaId } = await requireEmpresa()
  if (!(await temModuloAtual(MODULOS.ORDENS_SERVICO))) {
    return { ok: false, message: "Módulo não disponível." }
  }

  const v = await db.query.visita.findFirst({
    columns: { id: true, assinaturaPath: true },
    where: and(eq(visita.id, visitaId), eq(visita.empresaId, empresaId)),
  })
  if (!v) return { ok: false, message: "Visita não encontrada." }

  const m = /^data:image\/png;base64,(.+)$/.exec(dataUrl)
  if (!m) return { ok: false, message: "Assinatura inválida." }
  const buffer = Buffer.from(m[1], "base64")
  if (buffer.length === 0 || buffer.length > 2 * 1024 * 1024) {
    return { ok: false, message: "Assinatura inválida." }
  }

  const path = `${empresaId}/${visitaId}/assinatura-${crypto.randomUUID()}.png`
  const admin = createSupabaseAdminClient()
  const { error } = await admin.storage
    .from(BUCKET_SERVICO)
    .upload(path, buffer, { contentType: "image/png" })
  if (error) return { ok: false, message: error.message }

  if (v.assinaturaPath) {
    await admin.storage.from(BUCKET_SERVICO).remove([v.assinaturaPath]).catch(() => {})
  }
  await db
    .update(visita)
    .set({ assinaturaPath: path, atualizadoEm: new Date() })
    .where(and(eq(visita.id, visitaId), eq(visita.empresaId, empresaId)))
  revalidatePath(`/visitas/${visitaId}`)
  return { ok: true }
}

/** Remove a assinatura da visita. */
export async function removerAssinatura(visitaId: string): Promise<Ok> {
  const { empresaId } = await requireEmpresa()
  const v = await db.query.visita.findFirst({
    columns: { assinaturaPath: true },
    where: and(eq(visita.id, visitaId), eq(visita.empresaId, empresaId)),
  })
  if (!v) return { ok: false, message: "Visita não encontrada." }

  const admin = createSupabaseAdminClient()
  if (v.assinaturaPath) {
    await admin.storage.from(BUCKET_SERVICO).remove([v.assinaturaPath]).catch(() => {})
  }
  await db
    .update(visita)
    .set({ assinaturaPath: null, atualizadoEm: new Date() })
    .where(and(eq(visita.id, visitaId), eq(visita.empresaId, empresaId)))
  revalidatePath(`/visitas/${visitaId}`)
  return { ok: true }
}
