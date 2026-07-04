"use server"

import { randomBytes } from "node:crypto"
import { revalidatePath } from "next/cache"
import { addMonths } from "date-fns"
import { eq } from "drizzle-orm"

import { db } from "@/db/client"
import { empresa, pagamento, utilizador } from "@/db/schema"
import { requireSuperAdmin } from "@/lib/auth"
import { hojeKey } from "@/lib/agenda"
import { contarFuncionarios } from "@/lib/funcionarios"
import { fimDoTrial, mensalidadeDe } from "@/lib/subscricao"
import { MODULOS_META, type ModuloKey } from "@/lib/constants/modulos"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import {
  criarClienteSchema,
  type CriarClienteValues,
} from "@/lib/validations/admin"

type Ok = { ok: true } | { ok: false; message: string }
type CriarResultado =
  | { ok: true; email: string; password: string }
  | { ok: false; message: string }

/** Palavra-passe temporária legível (ex.: "pn-8f3a1c9d"). */
function gerarPassword(): string {
  return `pn-${randomBytes(5).toString("hex")}`
}

/**
 * Cria um cliente novo (tenant): utilizador Supabase + `empresa` + `utilizador`
 * OWNER associado. Devolve as credenciais para o super-admin as entregar ao
 * cliente. Só o super-admin pode executar.
 */
export async function criarCliente(
  input: CriarClienteValues
): Promise<CriarResultado> {
  await requireSuperAdmin()
  const parsed = criarClienteSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    }
  }

  const email = parsed.data.email.toLowerCase()
  const password = parsed.data.password.trim() || gerarPassword()
  const limite = Math.min(
    999,
    Math.max(0, Math.trunc(Number(parsed.data.limiteFuncionarios) || 0))
  )
  const admin = createSupabaseAdminClient()

  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error || !created?.user) {
    const msg = error?.message?.toLowerCase() ?? ""
    if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
      return { ok: false, message: "Já existe uma conta com este email." }
    }
    return { ok: false, message: "Não foi possível criar a conta." }
  }

  const userId = created.user.id
  try {
    const [nova] = await db
      .insert(empresa)
      // Período gratuito de 45 dias + lugares de funcionário atribuídos.
      .values({
        nome: parsed.data.nomeEmpresa,
        acessoAte: fimDoTrial(),
        limiteFuncionarios: limite,
      })
      .returning({ id: empresa.id })

    await db.insert(utilizador).values({
      id: userId,
      empresaId: nova.id,
      nome: parsed.data.nomeDono,
      email,
      role: "OWNER",
      ativo: true,
    })
  } catch {
    // Limpa o auth user órfão para não bloquear novas tentativas.
    await admin.auth.admin.deleteUser(userId).catch(() => {})
    return { ok: false, message: "Não foi possível criar a empresa." }
  }

  revalidatePath("/admin")
  return { ok: true, email, password }
}

/**
 * Suspende (ativo=false) ou reativa (ativo=true) uma empresa cliente. Suspensa,
 * ninguém dessa empresa consegue entrar (ver `requireEmpresa`). Só o super-admin
 * executa; não pode suspender a própria empresa.
 */
export async function definirEstadoEmpresa(
  empresaId: string,
  ativo: boolean
): Promise<Ok> {
  const ctx = await requireSuperAdmin()
  if (empresaId === ctx.empresaId) {
    return { ok: false, message: "Não podes suspender a tua própria empresa." }
  }
  await db
    .update(empresa)
    .set({ ativo, atualizadoEm: new Date() })
    .where(eq(empresa.id, empresaId))
  revalidatePath("/admin")
  return { ok: true }
}

/**
 * Regista um pagamento da mensalidade: estende o acesso em +1 mês (a partir da
 * data de fim atual, se ainda no futuro, senão a partir de agora) e garante que
 * a empresa fica ativa. É assim que o super-admin desbloqueia um cliente que
 * pagou. Só o super-admin executa.
 */
export async function registarPagamento(empresaId: string): Promise<Ok> {
  await requireSuperAdmin()
  const alvo = await db.query.empresa.findFirst({
    columns: { acessoAte: true },
    where: eq(empresa.id, empresaId),
  })
  if (!alvo) return { ok: false, message: "Empresa não encontrada." }

  const agora = new Date()
  const base =
    alvo.acessoAte && alvo.acessoAte.getTime() > agora.getTime()
      ? alvo.acessoAte
      : agora
  const novaData = addMonths(base, 1)
  // Mensalidade atual = base + funcionários ativos × 4,99.
  const nFunc = await contarFuncionarios(empresaId)
  const valor = mensalidadeDe(nFunc)
  await db
    .update(empresa)
    .set({ acessoAte: novaData, ativo: true, atualizadoEm: new Date() })
    .where(eq(empresa.id, empresaId))
  // Regista no ledger da plataforma (para o financeiro por cliente).
  await db.insert(pagamento).values({
    empresaId,
    valor: String(valor),
    data: hojeKey(),
    periodoAte: novaData,
  })
  revalidatePath("/admin")
  revalidatePath("/admin/financeiro")
  revalidatePath(`/admin/${empresaId}`)
  return { ok: true }
}

/**
 * Define o nº de lugares de funcionário de um cliente (0..N). O cliente pode
 * cadastrar funcionários até este limite; cada funcionário ativo acrescenta
 * 4,99/mês. Só o super-admin executa.
 */
export async function definirLimiteFuncionarios(
  empresaId: string,
  limite: number
): Promise<Ok> {
  await requireSuperAdmin()
  const n = Math.trunc(limite)
  if (!Number.isFinite(n) || n < 0 || n > 999) {
    return { ok: false, message: "Número de lugares inválido." }
  }
  await db
    .update(empresa)
    .set({ limiteFuncionarios: n, atualizadoEm: new Date() })
    .where(eq(empresa.id, empresaId))
  revalidatePath("/admin")
  revalidatePath(`/admin/${empresaId}`)
  return { ok: true }
}

/**
 * Liga/desliga um módulo opcional para um cliente. Só o super-admin executa.
 */
export async function definirModulo(
  empresaId: string,
  modulo: string,
  ativo: boolean
): Promise<Ok> {
  await requireSuperAdmin()
  const validos = MODULOS_META.map((m) => m.key as string)
  if (!validos.includes(modulo)) {
    return { ok: false, message: "Módulo inválido." }
  }
  const alvo = await db.query.empresa.findFirst({
    columns: { modulos: true },
    where: eq(empresa.id, empresaId),
  })
  if (!alvo) return { ok: false, message: "Empresa não encontrada." }

  const set = new Set(alvo.modulos ?? [])
  if (ativo) set.add(modulo)
  else set.delete(modulo)
  await db
    .update(empresa)
    .set({ modulos: Array.from(set) as ModuloKey[], atualizadoEm: new Date() })
    .where(eq(empresa.id, empresaId))
  revalidatePath("/admin")
  revalidatePath(`/admin/${empresaId}`)
  return { ok: true }
}
