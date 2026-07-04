import { z } from "zod"

/**
 * Validações da gestão de utilizadores (Definições → Utilizadores).
 *
 * O OWNER (proprietário) NÃO se cria por aqui — só se atribuem cargos de
 * gestão/operação. Ficheiro puro (sem React), partilhado entre a action e o
 * formulário.
 */

/** Cargos atribuíveis na app (o OWNER só existe via registo da empresa). */
export const ROLES_ATRIBUIVEIS = ["ADMIN", "TECNICO"] as const
export type RoleAtribuivel = (typeof ROLES_ATRIBUIVEIS)[number]

const nome = z.string().trim().min(2, "Indique o nome (mínimo 2 caracteres).")

const email = z
  .string()
  .trim()
  .refine((v) => /^\S+@\S+\.\S+$/.test(v), "Email inválido.")

const role = z.enum(ROLES_ATRIBUIVEIS)

// Cor opcional para a agenda (formato #RRGGBB). Vazio = sem cor definida.
const corAgenda = z
  .string()
  .trim()
  .refine(
    (v) => v === "" || /^#[0-9a-fA-F]{6}$/.test(v),
    "Cor inválida (use #RRGGBB)."
  )

/** Criação: exige email + password (o auth user é criado no servidor). */
export const criarUtilizadorSchema = z.object({
  nome,
  email,
  password: z.string().min(6, "A password deve ter pelo menos 6 caracteres."),
  role,
  corAgenda,
})

/**
 * Edição: sem email nem password (o email é imutável; a password troca-se na
 * secção "Conta" do próprio utilizador).
 */
export const editarUtilizadorSchema = z.object({
  nome,
  role,
  corAgenda,
})

export type CriarUtilizadorValues = z.infer<typeof criarUtilizadorSchema>
export type EditarUtilizadorValues = z.infer<typeof editarUtilizadorSchema>

export const CRIAR_UTILIZADOR_VAZIO: CriarUtilizadorValues = {
  nome: "",
  email: "",
  password: "",
  role: "TECNICO",
  corAgenda: "#3b82f6",
}
