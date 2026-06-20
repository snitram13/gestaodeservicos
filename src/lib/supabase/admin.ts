import "server-only"
import { createClient } from "@supabase/supabase-js"

/**
 * Cliente Supabase com a chave de serviço (service role). NUNCA usar no
 * browser. Útil para operações administrativas como upload de fotos para o
 * Storage a partir de Server Actions.
 */
export function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )
}
