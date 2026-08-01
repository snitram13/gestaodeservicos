import "server-only"
import { cache } from "react"
import { cookies, headers } from "next/headers"
import { eq } from "drizzle-orm"

import { db } from "@/db/client"
import { empresa } from "@/db/schema"
import { getUtilizadorAtual } from "@/lib/auth"
import {
  COOKIE_IDIOMA,
  IDIOMA_PADRAO,
  idiomaValido,
  type Idioma,
} from "@/lib/constants/idiomas"
import { metaPais, paisValido, type Pais } from "@/lib/constants/paises"
import {
  dicionarioDe,
  traduzir,
  type Traduzir,
} from "@/lib/i18n/dicionarios"

/**
 * Idioma do pedido atual, por esta ordem:
 *  1. escolha do utilizador (`utilizador.idioma`);
 *  2. idioma do país da empresa (uma empresa francesa abre em francês);
 *  3. cookie — gravado no último login feito neste dispositivo;
 *  4. idioma do próprio browser (`Accept-Language`), para quem nunca entrou;
 *  5. português.
 *
 * Os pontos 3 e 4 só contam ANTES de haver sessão (ecrã de entrada): depois de
 * entrar, quem manda é a conta e o país da empresa.
 */
export const getIdioma = cache(async (): Promise<Idioma> => {
  const u = await getUtilizadorAtual()
  if (u?.idioma) return idiomaValido(u.idioma)
  if (u) {
    const emp = await db.query.empresa.findFirst({
      columns: { pais: true },
      where: eq(empresa.id, u.empresaId),
    })
    if (emp) return metaPais(emp.pais).idiomaPadrao
  }
  const jar = await cookies()
  const escolhido = jar.get(COOKIE_IDIOMA)?.value
  if (escolhido) return idiomaValido(escolhido)
  return (await idiomaDoBrowser()) ?? IDIOMA_PADRAO
})

/**
 * Primeiro idioma suportado que o browser pede (`Accept-Language`). É o que faz
 * o ecrã de entrada aparecer em francês a um francês que nunca entrou — antes
 * do login não há mais nada que o identifique.
 */
async function idiomaDoBrowser(): Promise<Idioma | null> {
  const cabecalho = (await headers()).get("accept-language")
  if (!cabecalho) return null
  // "fr-FR,fr;q=0.9,en;q=0.8" → ["fr-fr", "fr", "en"]
  const pedidos = cabecalho
    .split(",")
    .map((p) => p.split(";")[0].trim().toLowerCase())
  for (const p of pedidos) {
    const base = p.split("-")[0]
    if (base === "pt" || base === "es" || base === "fr") return base
  }
  return null
}

/** País da empresa do pedido atual (PT se não houver sessão). */
export const getPais = cache(async (): Promise<Pais> => {
  const u = await getUtilizadorAtual()
  if (!u) return "PT"
  const emp = await db.query.empresa.findFirst({
    columns: { pais: true },
    where: eq(empresa.id, u.empresaId),
  })
  return paisValido(emp?.pais)
})

/**
 * Função de tradução para componentes SERVER:
 *   const t = await getT()
 *   <h1>{t("Clientes")}</h1>
 * A chave é o texto em português — sem tradução, fica o português.
 */
export const getT = cache(async (): Promise<Traduzir> => {
  const idioma = await getIdioma()
  return (texto, vars) => traduzir(idioma, texto, vars)
})

/**
 * Dicionário do idioma atual, para entregar aos componentes cliente através do
 * `IdiomaProvider`. Só vai para o browser o idioma em uso.
 */
export const getDicionario = cache(async (): Promise<Record<string, string>> => {
  return dicionarioDe(await getIdioma())
})
