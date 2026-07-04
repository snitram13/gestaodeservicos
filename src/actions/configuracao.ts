"use server"

import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"

import { db } from "@/db/client"
import { empresa } from "@/db/schema"
import { requireEmpresa } from "@/lib/auth"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import {
  configuracaoSchema,
  type ConfiguracaoFormValues,
} from "@/lib/validations/configuracao"

type Ok = { ok: true } | { ok: false; message: string }

export async function guardarConfiguracao(
  input: ConfiguracaoFormValues
): Promise<Ok> {
  const { empresaId } = await requireEmpresa()
  const parsed = configuracaoSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: "Dados inválidos." }

  const d = parsed.data
  await db
    .update(empresa)
    .set({
      nome: d.nomeEmpresa.trim(),
      slogan: d.slogan.trim() || null,
      nif: d.nif.trim() || null,
      telefone: d.telefone.trim() || null,
      email: d.email.trim() || null,
      morada: d.morada.trim() || null,
      iban: d.iban.trim() || null,
      atualizadoEm: new Date(),
    })
    .where(eq(empresa.id, empresaId))

  revalidatePath("/configuracoes")
  return { ok: true }
}

export async function uploadLogo(
  formData: FormData
): Promise<{ ok: true; path: string } | { ok: false; message: string }> {
  const { empresaId } = await requireEmpresa()
  const file = formData.get("file")
  if (!(file instanceof File) || file.size === 0)
    return { ok: false, message: "Ficheiro inválido." }
  if (file.size > 2 * 1024 * 1024)
    return { ok: false, message: "O logótipo deve ter menos de 2 MB." }

  const ext = (file.name.split(".").pop() || "png").toLowerCase()
  const path = `logo-${crypto.randomUUID()}.${ext}`
  const admin = createSupabaseAdminClient()
  const { error } = await admin.storage
    .from("empresa")
    .upload(path, file, { contentType: file.type, upsert: true })
  if (error) return { ok: false, message: error.message }

  await db
    .update(empresa)
    .set({ logoPath: path, atualizadoEm: new Date() })
    .where(eq(empresa.id, empresaId))

  revalidatePath("/configuracoes")
  return { ok: true, path }
}

export async function removerLogo(): Promise<Ok> {
  const { empresaId } = await requireEmpresa()
  const row = await db.query.empresa.findFirst({
    where: eq(empresa.id, empresaId),
  })
  if (row?.logoPath) {
    const admin = createSupabaseAdminClient()
    await admin.storage.from("empresa").remove([row.logoPath])
  }
  await db
    .update(empresa)
    .set({ logoPath: null, atualizadoEm: new Date() })
    .where(eq(empresa.id, empresaId))

  revalidatePath("/configuracoes")
  return { ok: true }
}
