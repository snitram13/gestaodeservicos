import { z } from "zod"

import { CATEGORIAS_SERVICO, ESTADOS_ORCAMENTO } from "@/lib/constants/enums"

export const orcamentoItemSchema = z.object({
  descricao: z.string().trim().min(1, "Indique a descrição da linha."),
  quantidade: z.string(),
  precoUnit: z.string(),
})

export const orcamentoSchema = z.object({
  clienteId: z.string().min(1, "Selecione um cliente."),
  categoria: z.enum(CATEGORIAS_SERVICO),
  estado: z.enum(ESTADOS_ORCAMENTO),
  titulo: z.string().trim().min(2, "Indique um título para o orçamento."),
  descricao: z.string().trim(),
  validade: z.string(),
  taxaIva: z.string(),
  notas: z.string().trim(),
  itens: z.array(orcamentoItemSchema).min(1, "Adicione pelo menos uma linha."),
})

export type OrcamentoFormValues = z.infer<typeof orcamentoSchema>
export type OrcamentoItemValues = z.infer<typeof orcamentoItemSchema>

export const ORCAMENTO_ITEM_VAZIO: OrcamentoItemValues = {
  descricao: "",
  quantidade: "1",
  precoUnit: "0",
}
