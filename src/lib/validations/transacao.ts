import { z } from "zod"

import { CATEGORIAS_TRANSACAO, TIPOS_TRANSACAO } from "@/lib/constants/enums"
import { parseEuro } from "@/lib/formatters/currency"

export const transacaoSchema = z.object({
  tipo: z.enum(TIPOS_TRANSACAO),
  categoria: z.enum(CATEGORIAS_TRANSACAO),
  valor: z
    .string()
    .refine((v) => parseEuro(v) > 0, "Indique um valor maior que zero."),
  data: z.string().min(1, "Indique a data."),
  descricao: z.string().trim(),
  metodoPagamento: z.string(),
})

export type TransacaoFormValues = z.infer<typeof transacaoSchema>
