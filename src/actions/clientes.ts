"use server"

import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"

import { db } from "@/db/client"
import { cliente } from "@/db/schema"
import { requireUser } from "@/lib/auth"
import { clienteSchema, type ClienteFormValues } from "@/lib/validations/cliente"

type Resultado =
  | { ok: true; id: string }
  | { ok: false; message: string }

function limpar(v: string | undefined | null): string | null {
  const t = v?.trim()
  return t ? t : null
}

function valores(d: ClienteFormValues) {
  return {
    nome: d.nome.trim(),
    telefone: d.telefone.trim(),
    email: limpar(d.email),
    nif: limpar(d.nif),
    morada: limpar(d.morada),
    cidade: limpar(d.cidade),
    codigoPostal: limpar(d.codigoPostal),
    notas: limpar(d.notas),
  }
}

export async function criarCliente(input: ClienteFormValues): Promise<Resultado> {
  await requireUser()
  const parsed = clienteSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: "Dados inválidos." }

  const [row] = await db
    .insert(cliente)
    .values(valores(parsed.data))
    .returning({ id: cliente.id })

  revalidatePath("/clientes")
  return { ok: true, id: row.id }
}

export async function atualizarCliente(
  id: string,
  input: ClienteFormValues
): Promise<Resultado> {
  await requireUser()
  const parsed = clienteSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: "Dados inválidos." }

  await db
    .update(cliente)
    .set({ ...valores(parsed.data), atualizadoEm: new Date() })
    .where(eq(cliente.id, id))

  revalidatePath("/clientes")
  revalidatePath(`/clientes/${id}`)
  return { ok: true, id }
}

export async function apagarCliente(
  id: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  await requireUser()
  try {
    await db.delete(cliente).where(eq(cliente.id, id))
  } catch {
    return {
      ok: false,
      message:
        "Não é possível apagar: este cliente tem serviços ou orçamentos associados.",
    }
  }
  revalidatePath("/clientes")
  return { ok: true }
}
