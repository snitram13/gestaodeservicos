import type { CategoriaTransacao, MetodoPagamento } from "./enums"

export const CATEGORIA_TRANSACAO_LABEL: Record<CategoriaTransacao, string> = {
  SERVICO: "Serviço",
  ADIANTAMENTO: "Adiantamento",
  MATERIAL: "Material",
  COMBUSTIVEL: "Combustível",
  FERRAMENTA: "Ferramentas",
  PUBLICIDADE: "Publicidade",
  IMPOSTO: "Impostos",
  OUTRO: "Outro",
}

export const CATEGORIAS_ENTRADA: CategoriaTransacao[] = [
  "SERVICO",
  "ADIANTAMENTO",
  "OUTRO",
]

export const CATEGORIAS_SAIDA: CategoriaTransacao[] = [
  "MATERIAL",
  "COMBUSTIVEL",
  "FERRAMENTA",
  "PUBLICIDADE",
  "IMPOSTO",
  "OUTRO",
]

export const METODO_LABEL: Record<MetodoPagamento, string> = {
  DINHEIRO: "Dinheiro",
  MBWAY: "MB Way",
  TRANSFERENCIA: "Transferência",
  MULTIBANCO: "Multibanco",
  OUTRO: "Outro",
}
