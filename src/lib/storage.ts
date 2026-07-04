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
