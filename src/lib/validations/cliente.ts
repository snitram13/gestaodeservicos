import { z } from "zod"

export const clienteSchema = z.object({
  nome: z.string().trim().min(2, "Indique o nome (mínimo 2 caracteres)."),
  telefone: z.string().trim().min(6, "Indique um telefone válido."),
  email: z
    .string()
    .trim()
    .refine((v) => v === "" || /^\S+@\S+\.\S+$/.test(v), "Email inválido."),
  nif: z
    .string()
    .trim()
    .refine((v) => v === "" || /^\d{9}$/.test(v), "O NIF deve ter 9 dígitos."),
  morada: z.string().trim(),
  cidade: z.string().trim(),
  codigoPostal: z
    .string()
    .trim()
    .refine(
      (v) => v === "" || /^\d{4}-\d{3}$/.test(v),
      "Código postal no formato 0000-000."
    ),
  notas: z.string().trim(),
})

export type ClienteFormValues = z.infer<typeof clienteSchema>

export const CLIENTE_VAZIO: ClienteFormValues = {
  nome: "",
  telefone: "",
  email: "",
  nif: "",
  morada: "",
  cidade: "",
  codigoPostal: "",
  notas: "",
}
