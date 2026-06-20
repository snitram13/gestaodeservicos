import { z } from "zod"

export const configuracaoSchema = z.object({
  nomeEmpresa: z.string().trim().min(1, "Indique o nome da empresa."),
  slogan: z.string().trim(),
  nif: z
    .string()
    .trim()
    .refine((v) => v === "" || /^\d{9}$/.test(v), "O NIF deve ter 9 dígitos."),
  telefone: z.string().trim(),
  email: z
    .string()
    .trim()
    .refine((v) => v === "" || /^\S+@\S+\.\S+$/.test(v), "Email inválido."),
  morada: z.string().trim(),
  iban: z.string().trim(),
})

export type ConfiguracaoFormValues = z.infer<typeof configuracaoSchema>
