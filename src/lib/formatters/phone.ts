/**
 * Números de telefone no formato E.164 (+351…, +34…, +33…), usados em links
 * `tel:` e `wa.me`. O país vem da empresa (tenant) — ver `constants/paises.ts`.
 * Sem país indicado assume-se Portugal, para o código antigo continuar igual.
 */
import { metaPais, PAIS_PADRAO, type Pais } from "@/lib/constants/paises"

export function normalizarTelefone(
  raw: string | null | undefined,
  pais: Pais = PAIS_PADRAO
): string {
  if (!raw) return ""
  const digitos = raw.replace(/\D/g, "")
  if (!digitos) return ""
  const { prefixo, digitosTelefone } = metaPais(pais)

  // Já vem em formato internacional: 00XX… ou XX… .
  if (digitos.startsWith(`00${prefixo}`)) return `+${digitos.slice(2)}`
  if (digitos.startsWith(prefixo) && digitos.length > digitosTelefone) {
    return `+${digitos}`
  }

  // Número local. Em França escreve-se com um 0 à frente (06…) que NÃO entra
  // no número internacional: +33 6 12 34 56 78.
  const local =
    pais === "FR" && digitos.startsWith("0") ? digitos.slice(1) : digitos
  const esperado = pais === "FR" ? digitosTelefone - 1 : digitosTelefone
  if (local.length === esperado) return `+${prefixo}${local}`

  return `+${digitos}`
}

/** Apresentação amigável: 912 345 678 (PT/ES) · 06 12 34 56 78 (FR). */
export function formatTelefone(
  raw: string | null | undefined,
  pais: Pais = PAIS_PADRAO
): string {
  if (!raw) return "—"
  const meta = metaPais(pais)
  // Passa primeiro pelo E.164 para tratar 00351…, +351…, espaços, etc.
  let digitos = normalizarTelefone(raw, pais).replace(/^\+/, "")
  if (digitos.startsWith(meta.prefixo)) {
    digitos = digitos.slice(meta.prefixo.length)
    // Em França o número nacional volta a mostrar-se com o 0 inicial.
    if (meta.prefixo === "33") digitos = `0${digitos}`
  }
  if (digitos.length !== meta.digitosTelefone) return raw

  const partes: string[] = []
  let i = 0
  for (const n of meta.grupoTelefone) {
    partes.push(digitos.slice(i, i + n))
    i += n
  }
  return partes.join(" ")
}

/** Link para ligar. */
export function telLink(
  raw: string | null | undefined,
  pais: Pais = PAIS_PADRAO
): string {
  return `tel:${normalizarTelefone(raw, pais)}`
}
