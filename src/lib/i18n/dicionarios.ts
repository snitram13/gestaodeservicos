import type { Idioma } from "@/lib/constants/idiomas"
import { ES } from "@/lib/i18n/es"
import { FR } from "@/lib/i18n/fr"

/**
 * Tradução com o **texto português como chave**. Vantagens: o código continua
 * legível (`t("Novo cliente")`), não é preciso manter um dicionário português,
 * e um texto ainda não traduzido aparece em português em vez de rebentar.
 *
 * Interpolação: `t("Faltam {dias} dias", { dias: 5 })`.
 */
export type Traduzir = (
  texto: string,
  vars?: Record<string, string | number>
) => string

const DICIONARIOS: Record<Idioma, Record<string, string>> = {
  pt: {},
  es: ES,
  fr: FR,
}

function interpolar(texto: string, vars?: Record<string, string | number>) {
  if (!vars) return texto
  return texto.replace(/\{(\w+)\}/g, (todo, chave: string) =>
    chave in vars ? String(vars[chave]) : todo
  )
}

/** Dicionário completo de um idioma (para o provider do lado do cliente). */
export function dicionarioDe(idioma: Idioma): Record<string, string> {
  return DICIONARIOS[idioma] ?? {}
}

export function traduzir(
  idioma: Idioma,
  texto: string,
  vars?: Record<string, string | number>
): string {
  const dic = DICIONARIOS[idioma] ?? {}
  return interpolar(dic[texto] ?? texto, vars)
}

/** Quantos textos faltam traduzir (usado pelo script de verificação). */
export function cobertura(idioma: Idioma, chaves: string[]) {
  const dic = DICIONARIOS[idioma] ?? {}
  const faltam = chaves.filter((c) => !dic[c])
  return { total: chaves.length, traduzidos: chaves.length - faltam.length, faltam }
}
