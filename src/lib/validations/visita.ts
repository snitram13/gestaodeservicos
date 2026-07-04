import { z } from "zod"

import { CATEGORIAS_SERVICO, ESTADOS_VISITA } from "@/lib/constants/enums"

export const servicoLinhaSchema = z.object({
  categoria: z.enum(CATEGORIAS_SERVICO),
  titulo: z.string().trim().min(1, "Indique o serviço."),
  descricao: z.string().trim(),
  maoDeObra: z.string(),
  material: z.string(),
})

export const visitaSchema = z.object({
  clienteId: z.string().min(1, "Selecione um cliente."),
  tecnicoId: z.string().optional(),
  estado: z.enum(ESTADOS_VISITA),
  agendadoPara: z.string().min(1, "Indique a data e a hora."),
  moradaServico: z.string().trim(),
  cidade: z.string().trim(),
  descricao: z.string().trim(),
  deslocacao: z.string(),
  kmPercorridos: z.string(),
  servicos: z.array(servicoLinhaSchema).min(1, "Adicione pelo menos um serviço."),
})

export type VisitaFormValues = z.infer<typeof visitaSchema>
export type ServicoLinhaValues = z.infer<typeof servicoLinhaSchema>

export const SERVICO_LINHA_VAZIO: ServicoLinhaValues = {
  categoria: "OUTROS",
  titulo: "",
  descricao: "",
  maoDeObra: "0",
  material: "0",
}
