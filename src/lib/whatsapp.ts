import { normalizarTelefone } from "@/lib/formatters/phone"

/**
 * Constrói um link `wa.me` com texto opcional já preenchido.
 * Funciona na web e no telemóvel (abre a app do WhatsApp).
 */
export function waLink(telefone: string | null | undefined, texto?: string) {
  const num = normalizarTelefone(telefone).replace("+", "")
  const base = num ? `https://wa.me/${num}` : "https://wa.me/"
  return texto ? `${base}?text=${encodeURIComponent(texto)}` : base
}

/**
 * Substitui marcadores {nome}, {data}, {hora}, {valor}, {morada}... pelo
 * respetivo valor. Marcadores sem valor são removidos.
 */
export function interpolarMensagem(
  template: string,
  vars: Record<string, string | number | null | undefined>
): string {
  return template.replace(/\{(\w+)\}/g, (_, chave: string) => {
    const v = vars[chave]
    return v === null || v === undefined ? "" : String(v)
  })
}
