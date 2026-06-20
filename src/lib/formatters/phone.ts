/**
 * Normalização de números de telefone portugueses para o formato E.164
 * (+351XXXXXXXXX), usado em links `tel:` e `wa.me`.
 */

export function normalizarTelefone(raw: string | null | undefined): string {
  if (!raw) return ""
  const digitos = raw.replace(/\D/g, "")
  if (!digitos) return ""
  if (digitos.startsWith("00351")) return `+${digitos.slice(2)}`
  if (digitos.startsWith("351")) return `+${digitos}`
  if (digitos.length === 9) return `+351${digitos}`
  return `+${digitos}`
}

/** Apresentação amigável: 912 345 678 */
export function formatTelefone(raw: string | null | undefined): string {
  if (!raw) return "—"
  const digitos = raw.replace(/\D/g, "")
  const local = digitos.startsWith("351") ? digitos.slice(3) : digitos
  if (local.length === 9) {
    return `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`
  }
  return raw
}

/** Link para ligar. */
export function telLink(raw: string | null | undefined): string {
  return `tel:${normalizarTelefone(raw)}`
}
