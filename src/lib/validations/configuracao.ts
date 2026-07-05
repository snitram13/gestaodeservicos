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
  taxaIvaPadrao: z
    .string()
    .trim()
    .refine(
      (v) => /^\d{1,2}([.,]\d{1,2})?$/.test(v),
      "Taxa de IVA inválida (ex.: 23 ou 0)."
    ),
})

export type ConfiguracaoFormValues = z.infer<typeof configuracaoSchema>
