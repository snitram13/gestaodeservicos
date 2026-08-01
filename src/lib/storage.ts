import "server-only"

import { createSupabaseAdminClient } from "@/lib/supabase/admin"

/** Bucket privado das ordens de serviço (fotos + assinaturas). */
export const BUCKET_SERVICO = "servico"

/** URL assinada temporária para um objeto privado do Storage. */
export async function urlAssinada(
  bucket: string,
  path: string | null | undefined,
  expiraSeg = 3600
): Promise<string | null> {
  if (!path) return null
  const admin = createSupabaseAdminClient()
  const { data } = await admin.storage
    .from(bucket)
    .createSignedUrl(path, expiraSeg)
  return data?.signedUrl ?? null
}

/**
 * Apaga objetos do storage. Silencioso de propósito: falhar a limpar um
 * ficheiro nunca deve impedir a operação principal (apagar o serviço/cliente).
 */
export async function apagarDoStorage(
  bucket: string,
  paths: (string | null | undefined)[]
): Promise<void> {
  const limpos = paths.filter((p): p is string => !!p)
  if (limpos.length === 0) return
  const admin = createSupabaseAdminClient()
  await admin.storage
    .from(bucket)
    .remove(limpos)
    .catch(() => {})
}

/**
 * Lista recursivamente todos os objetos sob um prefixo (o storage do Supabase
 * não tem pastas reais — é preciso descer nível a nível).
 */
export async function listarRecursivo(
  bucket: string,
  prefixo: string
): Promise<string[]> {
  const admin = createSupabaseAdminClient()
  const encontrados: string[] = []
  async function descer(atual: string) {
    const { data } = await admin.storage
      .from(bucket)
      .list(atual, { limit: 1000 })
    for (const item of data ?? []) {
      const caminho = `${atual}/${item.name}`
      // Objetos têm `id`; "pastas" (prefixos) vêm com id null.
      if (item.id) encontrados.push(caminho)
      else await descer(caminho)
    }
  }
  await descer(prefixo)
  return encontrados
}

/** URLs assinadas para vários objetos (path → url). */
export async function urlsAssinadas(
  bucket: string,
  paths: string[],
  expiraSeg = 3600
): Promise<Record<string, string>> {
  if (paths.length === 0) return {}
  const admin = createSupabaseAdminClient()
  const { data } = await admin.storage
    .from(bucket)
    .createSignedUrls(paths, expiraSeg)
  const map: Record<string, string> = {}
  for (const item of data ?? []) {
    if (item.signedUrl && item.path) map[item.path] = item.signedUrl
  }
  return map
}
