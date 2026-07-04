/**
 * Modelos de mensagens rápidas de WhatsApp. Os marcadores ({nome}, {data},
 * {hora}, {valor}, {morada}) são preenchidos no momento do envio.
 */
export type TemplateMensagem = {
  id: string
  titulo: string
  texto: string
}

export const TEMPLATES_WHATSAPP: TemplateMensagem[] = [
  {
    id: "confirmacao",
    titulo: "Confirmar agendamento",
    texto:
      "Bom dia {nome}! Confirmo o serviço para {data} às {hora} em {morada}. Com os melhores cumprimentos.",
  },
  {
    id: "a-caminho",
    titulo: "Estou a caminho",
    texto: "Olá {nome}, estou a caminho. Chego dentro de alguns minutos. Obrigado!",
  },
  {
    id: "orcamento",
    titulo: "Orçamento enviado",
    texto:
      "Olá {nome}, segue o orçamento para o serviço solicitado, no valor de {valor}. Fico a aguardar a sua confirmação. Obrigado!",
  },
  {
    id: "concluido",
    titulo: "Serviço concluído",
    texto:
      "Olá {nome}, o serviço foi concluído. Obrigado pela preferência! Para qualquer questão estou ao dispor.",
  },
  {
    id: "avaliacao",
    titulo: "Pedir avaliação",
    texto:
      "Olá {nome}, foi um gosto trabalhar consigo! Se ficou satisfeito com o serviço, agradeço que deixe uma avaliação. Muito obrigado!",
  },
  {
    id: "pagamento",
    titulo: "Lembrete de pagamento",
    texto:
      "Olá {nome}, deixo um lembrete do valor pendente de {valor}, referente ao serviço realizado. Obrigado!",
  },
]
