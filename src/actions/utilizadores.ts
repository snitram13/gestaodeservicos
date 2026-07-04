"use server"

import { revalidatePath } from "next/cache"
import { and, eq } from "drizzle-orm"

import { db } from "@/db/client"
import { empresa, utilizador } from "@/db/schema"
import { requireRole } from "@/lib/auth"
import { contarFuncionarios } from "@/lib/funcionarios"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import {
  criarUtilizadorSchema,
  editarUtilizadorSchema,
  type CriarUtilizadorValues,
  type EditarUtilizadorValues,
} from "@/lib/validations/utilizador"

type Resultado = { ok: true } | { ok: false; message: string }

/** Já não há lugar para mais um funcionário ativo? (limite do plano) */
async function limiteAtingido(
  empresaId: string
): Promise<{ atingido: boolean; limite: number }> {
  const emp = await db.query.empresa.findFirst({
    columns: { limiteFuncionarios: true },
    where: eq(empresa.id, empresaId),
  })
  const limite = emp?.limiteFuncionarios ?? 0
  const atuais = await contarFuncionarios(empresaId)
  return { atingido: atuais >= limite, limite }
}

/**
 * Cria um funcionário: conta de acesso (Supabase Auth) + linha `utilizador` na
 * empresa do gestor autenticado. Sempre isolado à empresa do contexto. Respeita
 * o limite de lugares do plano.
 */
export async function criarUtilizador(
  input: CriarUtilizadorValues
): Promise<Resultado> {
  const ctx = await requireRole("OWNER", "ADMIN")
  const parsed = criarUtilizadorSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: "Dados inválidos." }

  // Não cria a conta de acesso se já não houver lugar (evita órfão).
  const { atingido, limite } = await limiteAtingido(ctx.empresaId)
  if (atingido) {
    return {
      ok: false,
      message: `Limite de funcionários atingido (${limite}). Contacte o administrador do sistema para disponibilizar mais lugares.`,
    }
  }

  const d = parsed.data
  const email = d.email.trim().toLowerCase()

  const admin = createSupabaseAdminClient()
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: d.password,
    email_confirm: true,
  })
  if (error || !data.user) {
    const msg = error?.message ?? ""
    if (/already|exist|registered/i.test(msg)) {
      return { ok: false, message: "Já existe uma conta com este email." }
    }
    return { ok: false, message: "Não foi possível criar a conta de acesso." }
  }

  const novoUserId = data.user.id
  try {
    await db.insert(utilizador).values({
      id: novoUserId,
      empresaId: ctx.empresaId,
      nome: d.nome.trim(),
      email,
      role: d.role,
      corAgenda: d.corAgenda.trim() || null,
      ativo: true,
    })
  } catch (e) {
    // Falha ao gravar o perfil → remove o auth user órfão (ex.: email já
    // usado noutra empresa, que colide com o índice único global).
    await admin.auth.admin.deleteUser(novoUserId).catch(() => {})
    const msg = e instanceof Error ? e.message : ""
    if (/duplicate|unique|already/i.test(msg)) {
      return { ok: false, message: "Já existe um utilizador com este email." }
    }
    return { ok: false, message: "Não foi possível criar o utilizador." }
  }

  revalidatePath("/configuracoes")
  return { ok: true }
}

/**
 * Atualiza nome/cargo/cor de um funcionário. Confirma que o alvo pertence à
 * empresa do contexto ANTES de mudar (o WHERE é sempre por id + empresa). O
 * OWNER não é despromovido por aqui.
 */
export async function atualizarUtilizador(
  id: string,
  input: EditarUtilizadorValues
): Promise<Resultado> {
  const ctx = await requireRole("OWNER", "ADMIN")
  const parsed = editarUtilizadorSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: "Dados inválidos." }

  const alvo = await db.query.utilizador.findFirst({
    where: and(eq(utilizador.id, id), eq(utilizador.empresaId, ctx.empresaId)),
    columns: { id: true, role: true },
  })
  if (!alvo) return { ok: false, message: "Utilizador não encontrado." }

  const d = parsed.data
  // Preserva o cargo do OWNER — não pode ser despromovido nesta secção.
  const novoRole = alvo.role === "OWNER" ? "OWNER" : d.role

  await db
    .update(utilizador)
    .set({
      nome: d.nome.trim(),
      role: novoRole,
      corAgenda: d.corAgenda.trim() || null,
    })
    .where(and(eq(utilizador.id, id), eq(utilizador.empresaId, ctx.empresaId)))

  revalidatePath("/configuracoes")
  return { ok: true }
}

/**
 * Ativa/desativa o acesso de um funcionário. Não permite desativar a própria
 * conta nem o último OWNER ativo da empresa. Escopo sempre por id + empresa.
 */
export async function definirEstadoUtilizador(
  id: string,
  ativo: boolean
): Promise<Resultado> {
  const ctx = await requireRole("OWNER", "ADMIN")

  if (!ativo && id === ctx.userId) {
    return { ok: false, message: "Não pode desativar a sua própria conta." }
  }

  const alvo = await db.query.utilizador.findFirst({
    where: and(eq(utilizador.id, id), eq(utilizador.empresaId, ctx.empresaId)),
    columns: { id: true, role: true, ativo: true },
  })
  if (!alvo) return { ok: false, message: "Utilizador não encontrado." }

  // Reativar um funcionário volta a ocupar um lugar → respeita o limite.
  if (ativo && !alvo.ativo && alvo.role !== "OWNER") {
    const { atingido, limite } = await limiteAtingido(ctx.empresaId)
    if (atingido) {
      return {
        ok: false,
        message: `Limite de funcionários atingido (${limite}). Contacte o administrador do sistema.`,
      }
    }
  }

  if (!ativo && alvo.role === "OWNER") {
    const ownersAtivos = await db.query.utilizador.findMany({
      where: and(
        eq(utilizador.empresaId, ctx.empresaId),
        eq(utilizador.role, "OWNER"),
        eq(utilizador.ativo, true)
      ),
      columns: { id: true },
    })
    if (ownersAtivos.length <= 1) {
      return {
        ok: false,
        message: "Não pode desativar o único proprietário ativo da empresa.",
      }
    }
  }

  await db
    .update(utilizador)
    .set({ ativo })
    .where(and(eq(utilizador.id, id), eq(utilizador.empresaId, ctx.empresaId)))

  revalidatePath("/configuracoes")
  return { ok: true }
}
