"use server"

import { requireUser } from "@/lib/auth"

type Resultado =
  | { ok: true; morada: string; cidade: string; concelho: string; distrito: string }
  | { ok: false; message: string }

/**
 * Procura a morada a partir de um código postal português (todo o Portugal) via
 * GeoAPI.pt (gratuita, sem chave). Feito no servidor para evitar CORS e poder
 * ter timeout/erros controlados. Devolve rua (Artéria) + localidade.
 */
export async function procurarMorada(codigoPostal: string): Promise<Resultado> {
  await requireUser()

  const digits = codigoPostal.replace(/\D/g, "")
  if (digits.length !== 7) {
    return { ok: false, message: "Código postal incompleto." }
  }
  const cp = `${digits.slice(0, 4)}-${digits.slice(4)}`

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 8000)
    const res = await fetch(`https://json.geoapi.pt/cp/${cp}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    })
    clearTimeout(timer)
    if (res.status === 429) {
      return {
        ok: false,
        message: "Serviço ocupado, tente novamente ou preencha à mão.",
      }
    }
    if (!res.ok) return { ok: false, message: "Código postal não encontrado." }

    const d = (await res.json()) as {
      Localidade?: string
      Concelho?: string
      Distrito?: string
      partes?: { "Artéria"?: string }[]
    }

    const arterias = Array.from(
      new Set(
        (d.partes ?? [])
          .map((p) => (p["Artéria"] ?? "").trim())
          .filter(Boolean)
      )
    )
    const morada = arterias.join(", ")
    const cidade = (d.Localidade || d.Concelho || "").trim()
    const concelho = (d.Concelho || "").trim()
    const distrito = (d.Distrito || "").trim()

    if (!cidade && !morada) {
      return { ok: false, message: "Código postal não encontrado." }
    }
    return { ok: true, morada, cidade, concelho, distrito }
  } catch {
    return { ok: false, message: "Não foi possível procurar o código postal." }
  }
}
