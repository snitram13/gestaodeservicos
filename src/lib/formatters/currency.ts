const eur = new Intl.NumberFormat("pt-PT", {
  style: "currency",
  currency: "EUR",
})

const eurSemSimbolo = new Intl.NumberFormat("pt-PT", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/**
 * Converte o valor (number ou string vinda da BD `numeric`) para um número.
 */
export function paraNumero(
  value: number | string | null | undefined
): number {
  if (value === null || value === undefined || value === "") return 0
  const n = typeof value === "string" ? Number(value.replace(",", ".")) : value
  return Number.isFinite(n) ? n : 0
}

/** Formata em euros à portuguesa: 1 234,56 € */
export function formatEuro(value: number | string | null | undefined): string {
  return eur.format(paraNumero(value))
}

/** Formata sem o símbolo €: 1 234,56 */
export function formatValor(value: number | string | null | undefined): string {
  return eurSemSimbolo.format(paraNumero(value))
}

/**
 * Interpreta um valor escrito pelo utilizador ("1.234,56", "1234,56", "60")
 * e devolve um número. Aceita vírgula ou ponto como separador decimal.
 */
export function parseEuro(input: string): number {
  if (!input) return 0
  const limpo = input
    .replace(/[^\d,.-]/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "") // remove pontos de milhar
    .replace(",", ".")
  const n = Number(limpo)
  return Number.isFinite(n) ? n : 0
}
