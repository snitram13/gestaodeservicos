"use server"

import { requireUser } from "@/lib/auth"
import { getPais } from "@/lib/i18n"

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
  // O país da empresa decide onde procurar (PT e FR têm serviço; ES não).
  const pais = await getPais()
  if (pais === "FR") return procurarMoradaFR(codigoPostal)
  if (pais !== "PT") {
    return { ok: false, message: "Preencha a morada à mão." }
  }

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

/**
 * França: API oficial gratuita (Base Adresse Nationale, sem chave). Um code
 * postal cobre várias comunas — devolvemos a comuna mais provável (a de maior
 * pontuação) e deixamos a rua para o utilizador, que é o que a API dá aqui.
 */
async function procurarMoradaFR(codigoPostal: string): Promise<Resultado> {
  const digits = codigoPostal.replace(/\D/g, "")
  if (digits.length !== 5) {
    return { ok: false, message: "Código postal incompleto." }
  }
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 8000)
    const res = await fetch(
      `https://api-adresse.data.gouv.fr/search/?q=${digits}&type=municipality&limit=1`,
      { signal: controller.signal, headers: { Accept: "application/json" } }
    )
    clearTimeout(timer)
    if (!res.ok) return { ok: false, message: "Código postal não encontrado." }

    const d = (await res.json()) as {
      features?: { properties?: { city?: string; context?: string } }[]
    }
    const props = d.features?.[0]?.properties
    const cidade = (props?.city ?? "").trim()
    if (!cidade) return { ok: false, message: "Código postal não encontrado." }
    // context = "75, Paris, Île-de-France" → departamento e região.
    const contexto = (props?.context ?? "").split(",").map((p) => p.trim())
    return {
      ok: true,
      morada: "",
      cidade,
      concelho: contexto[1] ?? "",
      distrito: contexto[2] ?? "",
    }
  } catch {
    return { ok: false, message: "Não foi possível procurar o código postal." }
  }
}
