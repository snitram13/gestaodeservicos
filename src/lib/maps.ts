/**
 * Link de pesquisa no Google Maps para uma morada (abre navegação no
 * telemóvel). Não requer chave de API.
 */
export function mapsLink(
  morada: string | null | undefined,
  cidade?: string | null
): string {
  const query = [morada, cidade].filter(Boolean).join(", ").trim()
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    query || "Porto"
  )}`
}
