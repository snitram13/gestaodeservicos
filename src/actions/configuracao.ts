"use server"

import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"

import { db } from "@/db/client"
import { configuracao } from "@/db/schema"
import { requireUser } from "@/lib/auth"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import {
  configuracaoSchema,
  type ConfiguracaoFormValues,
} from "@/lib/validations/configuracao"

type Ok = { ok: true } | { ok: false; message: string }

async function obterId(): Promise<string> {
  const row = await db.query.configuracao.findFirst({ columns: { id: true } })
  if (row) return row.id
  const [novo] = await db
    .insert(configuracao)
    .values({})
    .returning({ id: configuracao.id })
  return novo.id
}

export async function guardarConfiguracao(
  input: ConfiguracaoFormValues
): Promise<Ok> {
  await requireUser()
  const parsed = configuracaoSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: "Dados inválidos." }

  const d = parsed.data
  const id = await obterId()
  await db
    .update(configuracao)
    .set({
      nomeEmpresa: d.nomeEmpresa.trim(),
      slogan: d.slogan.trim() || null,
      nif: d.nif.trim() || null,
      telefone: d.telefone.trim() || null,
      email: d.email.trim() || null,
      morada: d.morada.trim() || null,
      iban: d.iban.trim() || null,
      atualizadoEm: new Date(),
    })
    .where(eq(configuracao.id, id))

  revalidatePath("/configuracoes")
  return { ok: true }
}

export async function uploadLogo(
  formData: FormData
): Promise<{ ok: true; path: string } | { ok: false; message: string }> {
  await requireUser()
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

  const id = await obterId()
  await db
    .update(configuracao)
    .set({ logoPath: path, atualizadoEm: new Date() })
    .where(eq(configuracao.id, id))

  revalidatePath("/configuracoes")
  return { ok: true, path }
}

export async function removerLogo(): Promise<Ok> {
  await requireUser()
  const id = await obterId()
  const row = await db.query.configuracao.findFirst({
    where: eq(configuracao.id, id),
  })
  if (row?.logoPath) {
    const admin = createSupabaseAdminClient()
    await admin.storage.from("empresa").remove([row.logoPath])
  }
  await db
    .update(configuracao)
    .set({ logoPath: null, atualizadoEm: new Date() })
    .where(eq(configuracao.id, id))

  revalidatePath("/configuracoes")
  return { ok: true }
}
