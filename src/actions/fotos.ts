"use server"

import { revalidatePath } from "next/cache"
import { and, eq } from "drizzle-orm"

import { db } from "@/db/client"
import { foto, visita } from "@/db/schema"
import { requireEmpresa } from "@/lib/auth"
import { temModuloAtual } from "@/lib/modulos"
import { MODULOS } from "@/lib/constants/modulos"
import { BUCKET_SERVICO } from "@/lib/storage"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"

type Ok = { ok: true } | { ok: false; message: string }

/** Carrega uma foto (antes/depois) para uma visita. Só com o módulo ativo. */
export async function uploadFoto(formData: FormData): Promise<Ok> {
  const { empresaId } = await requireEmpresa()
  if (!(await temModuloAtual(MODULOS.ORDENS_SERVICO))) {
    return { ok: false, message: "Módulo não disponível." }
  }

  const visitaId = String(formData.get("visitaId") ?? "")
  const tipo = String(formData.get("tipo") ?? "")
  const file = formData.get("file")

  if (tipo !== "ANTES" && tipo !== "DEPOIS") {
    return { ok: false, message: "Tipo de foto inválido." }
  }
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Ficheiro inválido." }
  }
  if (file.size > 10 * 1024 * 1024) {
    return { ok: false, message: "A foto deve ter menos de 10 MB." }
  }

  const existe = await db.query.visita.findFirst({
    columns: { id: true },
    where: and(eq(visita.id, visitaId), eq(visita.empresaId, empresaId)),
  })
  if (!existe) return { ok: false, message: "Visita não encontrada." }

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase()
  const path = `${empresaId}/${visitaId}/${crypto.randomUUID()}.${ext}`
  const admin = createSupabaseAdminClient()
  const { error } = await admin.storage
    .from(BUCKET_SERVICO)
    .upload(path, file, { contentType: file.type || "image/jpeg" })
  if (error) return { ok: false, message: error.message }

  await db.insert(foto).values({ empresaId, visitaId, tipo, storagePath: path })
  revalidatePath(`/visitas/${visitaId}`)
  return { ok: true }
}

/** Apaga uma foto (storage + registo). Escopo por empresa. */
export async function apagarFoto(id: string): Promise<Ok> {
  const { empresaId } = await requireEmpresa()
  const row = await db.query.foto.findFirst({
    where: and(eq(foto.id, id), eq(foto.empresaId, empresaId)),
  })
  if (!row) return { ok: false, message: "Foto não encontrada." }

  const admin = createSupabaseAdminClient()
  await admin.storage
    .from(BUCKET_SERVICO)
    .remove([row.storagePath])
    .catch(() => {})
  await db.delete(foto).where(and(eq(foto.id, id), eq(foto.empresaId, empresaId)))
  revalidatePath(`/visitas/${row.visitaId}`)
  return { ok: true }
}
