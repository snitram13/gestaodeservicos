import "server-only"
import { redirect } from "next/navigation"

import { createSupabaseServerClient } from "@/lib/supabase/server"

/** Devolve o utilizador autenticado (ou null). Valida sempre no servidor. */
export async function getUser() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

/**
 * Garante que existe sessão. Deve ser a primeira linha de cada Server Action e
 * de cada página protegida — as Server Actions são endpoints públicos, por isso
 * o proxy não é suficiente como única barreira de segurança.
 */
export async function requireUser() {
  const user = await getUser()
  if (!user) {
    redirect("/login")
  }
  return user
}
