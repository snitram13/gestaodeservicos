/**
 * Módulos opcionais que o super-admin liga/desliga por cliente. Guardados em
 * `empresa.modulos` (array de chaves). Ficheiro puro (sem React/DB).
 */

export const MODULOS = {
  /** Ordens de serviço: fotos antes/depois, assinatura, PDF e WhatsApp. */
  ORDENS_SERVICO: "ordens_servico",
} as const

export type ModuloKey = (typeof MODULOS)[keyof typeof MODULOS]

export type ModuloMeta = {
  key: ModuloKey
  nome: string
  descricao: string
}

export const MODULOS_META: ModuloMeta[] = [
  {
    key: MODULOS.ORDENS_SERVICO,
    nome: "Ordens de Serviço",
    descricao:
      "Fotos antes/depois, assinatura do cliente, PDF da ordem de serviço e partilha por WhatsApp na visita. Quando ligado, o menu do cliente passa a chamar-se “Serviços”.",
  },
]

/** A empresa tem um dado módulo ativo? */
export function temModulo(
  modulos: string[] | null | undefined,
  key: ModuloKey
): boolean {
  return !!modulos && modulos.includes(key)
}

/**
 * Rótulos da unidade agendável: "Visita" por omissão, "Serviço" quando o módulo
 * Ordens de Serviço está ligado. Usado nos títulos/botões das páginas para não
 * misturar "Serviços" (menu) com "Visitas" (páginas).
 */
export function rotulosServico(temServicos: boolean) {
  if (temServicos) {
    return {
      singular: "serviço",
      plural: "serviços",
      Singular: "Serviço",
      Plural: "Serviços",
      novo: "Novo serviço",
      criado: "Serviço criado",
      atualizado: "Serviço atualizado",
      apagado: "Serviço apagado",
      apagarAria: "Apagar serviço",
      apagarTitulo: "Apagar serviço?",
      apagarDesc:
        "Vai apagar o serviço e os seus dados. Esta ação não pode ser anulada.",
      notas: "Notas do serviço",
      semNoDia: "Sem serviços neste dia",
      agendar: "Toque abaixo para agendar um serviço.",
      novoNoDia: "Novo serviço neste dia",
      proximo: "Próximo serviço",
      semHoje: "Sem serviços agendados para hoje.",
      hoje: "Serviços hoje",
      associada: "Serviço associado",
    }
  }
  return {
    singular: "visita",
    plural: "visitas",
    Singular: "Visita",
    Plural: "Visitas",
    novo: "Nova visita",
    criado: "Visita criada",
    atualizado: "Visita atualizada",
    apagado: "Visita apagada",
    apagarAria: "Apagar visita",
    apagarTitulo: "Apagar visita?",
    apagarDesc:
      "Vai apagar a visita e os serviços associados. Esta ação não pode ser anulada.",
    notas: "Notas da visita",
    semNoDia: "Sem visitas neste dia",
    agendar: "Toque abaixo para agendar uma visita.",
    novoNoDia: "Nova visita neste dia",
    proximo: "Próxima visita",
    semHoje: "Sem visitas agendadas para hoje.",
    hoje: "Visitas hoje",
    associada: "Visita associada",
  }
}
