import "server-only"
import { cache } from "react"
import { redirect } from "next/navigation"
import { eq } from "drizzle-orm"

import { db } from "@/db/client"
import { empresa, utilizador, type Utilizador } from "@/db/schema"
import type { RoleUtilizador } from "@/lib/constants/enums"
import { createSupabaseServerClient } from "@/lib/supabase/server"

/** Devolve o utilizador Supabase autenticado (ou null). Cacheado por pedido. */
export const getUser = cache(async () => {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
})

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

/**
 * Linha `utilizador` (empresa + cargo) do utilizador autenticado, ou null se
 * não houver sessão / conta órfã. Cacheado por pedido.
 */
export const getUtilizadorAtual = cache(async (): Promise<Utilizador | null> => {
  const user = await getUser()
  if (!user) return null
  const row = await db.query.utilizador.findFirst({
    where: eq(utilizador.id, user.id),
  })
  return row ?? null
})

/** Contexto da empresa do pedido atual. */
export type ContextoEmpresa = {
  userId: string
  empresaId: string
  role: RoleUtilizador
  nome: string
  email: string
  utilizador: Utilizador
}

/** Estado da empresa (cacheado por empresaId no pedido). */
const getEmpresaEstado = cache(async (empresaId: string) => {
  return db.query.empresa.findFirst({
    columns: { id: true, nome: true, ativo: true, acessoAte: true },
    where: eq(empresa.id, empresaId),
  })
})

/**
 * Barreira de isolação multi-empresa. Garante sessão + associação a uma
 * empresa ATIVA e devolve o `empresaId` a usar em TODAS as queries/inserts.
 * Deve ser a primeira linha de cada Server Action e de cada página protegida
 * que toque em dados de negócio (substitui `requireUser()` nesses casos).
 * Se a empresa estiver suspensa (`ativo=false`, ex.: mensalidade em falta),
 * ninguém dessa empresa entra — exceto o super-admin (para poder reativar).
 */
export async function requireEmpresa(): Promise<ContextoEmpresa> {
  const user = await requireUser()
  const u = await getUtilizadorAtual()
  // Conta sem `utilizador`/empresa associada, ou desativada → sem acesso.
  if (!u || !u.ativo) {
    redirect("/login")
  }
  const emp = await getEmpresaEstado(u.empresaId)
  if (!emp) {
    redirect("/login")
  }
  // Bloqueada = suspensa manualmente OU período de acesso (trial/mensalidade)
  // expirado. O super-admin nunca é bloqueado (para poder reativar/registar
  // pagamentos).
  const expirada = emp.acessoAte != null && emp.acessoAte.getTime() <= Date.now()
  if ((!emp.ativo || expirada) && !isSuperAdmin(user.email)) {
    redirect("/suspenso")
  }
  return {
    userId: user.id,
    empresaId: u.empresaId,
    role: u.role,
    nome: u.nome,
    email: u.email,
    utilizador: u,
  }
}

/** OWNER e ADMIN podem gerir utilizadores e a configuração da empresa. */
export function podeGerir(role: RoleUtilizador): boolean {
  return role === "OWNER" || role === "ADMIN"
}

/* ------------------------------------------------------------------ */
/* Super-admin (dono da plataforma / aluguer) — via env               */
/* ------------------------------------------------------------------ */

/** Emails com acesso de super-admin (gestão de clientes/tenants). */
export function superAdminEmails(): string[] {
  return (process.env.SUPER_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

/** O email pertence a um super-admin da plataforma? */
export function isSuperAdmin(email: string | null | undefined): boolean {
  return !!email && superAdminEmails().includes(email.toLowerCase())
}

/**
 * Garante que o utilizador autenticado é super-admin (área /admin de gestão
 * de clientes). Sem permissão → volta ao início.
 */
export async function requireSuperAdmin(): Promise<ContextoEmpresa> {
  const ctx = await requireEmpresa()
  if (!isSuperAdmin(ctx.email)) {
    redirect("/")
  }
  return ctx
}

/**
 * Garante que o utilizador tem um dos cargos indicados (gestão de empresa /
 * utilizadores). Sem permissão → volta ao início. Usar em ecrãs e actions de
 * administração; os dados de negócio continuam de acesso total dentro da
 * empresa (usar `requireEmpresa()`).
 */
export async function requireRole(
  ...roles: RoleUtilizador[]
): Promise<ContextoEmpresa> {
  const ctx = await requireEmpresa()
  if (!roles.includes(ctx.role)) {
    redirect("/")
  }
  return ctx
}
