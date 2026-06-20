/**
 * Valores de enumeração — fonte única de verdade partilhada entre a base de
 * dados (Drizzle `pgEnum`) e a interface. Ficheiro puro (sem React).
 */

export const CATEGORIAS_SERVICO = [
  "ELETRICIDADE",
  "CANALIZACAO",
  "PINTURA",
  "MONTAGEM_MOVEIS",
  "INSTALACAO_CANDEEIROS",
  "PEQUENAS_REPARACOES",
  "OUTROS",
] as const
export type CategoriaServico = (typeof CATEGORIAS_SERVICO)[number]

// Estado da VISITA (a visita é a unidade agendável; os serviços são linhas dela)
export const ESTADOS_VISITA = [
  "AGENDADO",
  "EM_ANDAMENTO",
  "CONCLUIDO",
  "CANCELADO",
] as const
export type EstadoVisita = (typeof ESTADOS_VISITA)[number]

export const ESTADOS_ORCAMENTO = [
  "RASCUNHO",
  "ENVIADO",
  "ACEITE",
  "RECUSADO",
  "EXPIRADO",
] as const
export type EstadoOrcamento = (typeof ESTADOS_ORCAMENTO)[number]

export const TIPOS_TRANSACAO = ["ENTRADA", "SAIDA"] as const
export type TipoTransacao = (typeof TIPOS_TRANSACAO)[number]

export const CATEGORIAS_TRANSACAO = [
  "SERVICO",
  "ADIANTAMENTO",
  "MATERIAL",
  "COMBUSTIVEL",
  "FERRAMENTA",
  "PUBLICIDADE",
  "IMPOSTO",
  "OUTRO",
] as const
export type CategoriaTransacao = (typeof CATEGORIAS_TRANSACAO)[number]

export const TIPOS_FOTO = ["ANTES", "DEPOIS"] as const
export type TipoFoto = (typeof TIPOS_FOTO)[number]

export const ROLES_UTILIZADOR = ["OWNER", "TECNICO", "ADMIN"] as const
export type RoleUtilizador = (typeof ROLES_UTILIZADOR)[number]

export const METODOS_PAGAMENTO = [
  "DINHEIRO",
  "MBWAY",
  "TRANSFERENCIA",
  "MULTIBANCO",
  "OUTRO",
] as const
export type MetodoPagamento = (typeof METODOS_PAGAMENTO)[number]
