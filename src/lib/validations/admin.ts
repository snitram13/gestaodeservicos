import { z } from "zod"

/** Criação de um cliente (tenant) pelo super-admin: empresa + dono OWNER. */
export const criarClienteSchema = z.object({
  nomeEmpresa: z.string().trim().min(1, "Indique o nome da empresa."),
  nomeDono: z.string().trim().min(1, "Indique o nome do responsável."),
  email: z
    .string()
    .trim()
    .refine((v) => /^\S+@\S+\.\S+$/.test(v), "Email inválido."),
  // Vazio → é gerada uma palavra-passe temporária automaticamente.
  password: z
    .string()
    .refine((v) => v === "" || v.length >= 6, "Mínimo 6 caracteres."),
  // Lugares de funcionário disponibilizados ao cliente (cada um custa +4,99/mês).
  // String no formulário; convertida para inteiro na action.
  limiteFuncionarios: z
    .string()
    .refine((v) => v.trim() === "" || /^\d+$/.test(v.trim()), "Número inválido."),
})

export type CriarClienteValues = z.infer<typeof criarClienteSchema>

export const CRIAR_CLIENTE_VAZIO: CriarClienteValues = {
  nomeEmpresa: "",
  nomeDono: "",
  email: "",
  password: "",
  limiteFuncionarios: "0",
}
