import "server-only"
import { createElement } from "react"
import { renderToBuffer } from "@react-pdf/renderer"
import { and, eq } from "drizzle-orm"
import type { SupabaseClient } from "@supabase/supabase-js"

import { db } from "@/db/client"
import { orcamento, visita } from "@/db/schema"
import { getConfiguracao } from "@/lib/configuracao"
import { BUCKET_SERVICO } from "@/lib/storage"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { OrcamentoPDF } from "@/components/orcamentos/orcamento-pdf"
import { OrdemServicoPDF } from "@/components/servicos/ordem-servico-pdf"

const BUCKET_LOGO = "empresa"

type Gerado = { buffer: Buffer; numero: number }

/**
 * Descarrega um ficheiro do Storage e devolve-o como data-URI base64. Embutir
 * as imagens (em vez de passar URLs remotos) é o que faz o PDF ter as fotos de
 * forma FIÁVEL em serverless — o @react-pdf a ir buscar imagens por URL falha
 * no Vercel. Devolve null se não houver caminho ou o download falhar.
 */
async function comoDataUri(
  admin: SupabaseClient,
  bucket: string,
  path: string | null | undefined
): Promise<string | null> {
  if (!path) return null
  const { data, error } = await admin.storage.from(bucket).download(path)
  if (error || !data) return null
  const buf = Buffer.from(await data.arrayBuffer())
  const tipo = data.type || "image/jpeg"
  return `data:${tipo};base64,${buf.toString("base64")}`
}

/** Gera o PDF de um orçamento (buffer). Reutilizado pela rota e pela partilha. */
export async function bufferOrcamento(
  id: string,
  empresaId: string
): Promise<Gerado | null> {
  const o = await db.query.orcamento.findFirst({
    where: and(eq(orcamento.id, id), eq(orcamento.empresaId, empresaId)),
    with: { cliente: true, itens: true },
  })
  if (!o) return null
  const config = await getConfiguracao()
  const admin = createSupabaseAdminClient()
  const logo = await comoDataUri(admin, BUCKET_LOGO, config.logoPath)

  const element = createElement(OrcamentoPDF, {
    orcamento: o,
    config,
    logo,
  }) as Parameters<typeof renderToBuffer>[0]
  return { buffer: await renderToBuffer(element), numero: o.numero }
}

/** Gera o PDF de uma ordem de serviço (buffer) com fotos + assinatura embutidas. */
export async function bufferOrdemServico(
  id: string,
  empresaId: string
): Promise<Gerado | null> {
  const v = await db.query.visita.findFirst({
    where: and(eq(visita.id, id), eq(visita.empresaId, empresaId)),
    with: { cliente: true, servicos: true, fotos: true },
  })
  if (!v) return null

  const config = await getConfiguracao()
  const admin = createSupabaseAdminClient()
  const antes = v.fotos.filter((f) => f.tipo === "ANTES")
  const depois = v.fotos.filter((f) => f.tipo === "DEPOIS")

  const [fotosAntes, fotosDepois, assinaturaUrl, logo] = await Promise.all([
    Promise.all(antes.map((f) => comoDataUri(admin, BUCKET_SERVICO, f.storagePath))),
    Promise.all(depois.map((f) => comoDataUri(admin, BUCKET_SERVICO, f.storagePath))),
    comoDataUri(admin, BUCKET_SERVICO, v.assinaturaPath),
    comoDataUri(admin, BUCKET_LOGO, config.logoPath),
  ])

  const element = createElement(OrdemServicoPDF, {
    visita: v,
    config,
    logo,
    fotosAntes: fotosAntes.filter((u): u is string => !!u),
    fotosDepois: fotosDepois.filter((u): u is string => !!u),
    assinaturaUrl,
  }) as Parameters<typeof renderToBuffer>[0]
  return { buffer: await renderToBuffer(element), numero: v.numero }
}
