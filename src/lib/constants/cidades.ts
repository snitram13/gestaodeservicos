/** Concelhos/localidades da área metropolitana do Porto onde a PN atua. */
export const CIDADES = [
  "Porto",
  "Vila Nova de Gaia",
  "Matosinhos",
  "Maia",
  "Gondomar",
  "Rio Tinto",
  "Valongo",
  "Ermesinde",
  "Senhora da Hora",
  "Espinho",
  "Outra",
] as const

export type Cidade = (typeof CIDADES)[number]
