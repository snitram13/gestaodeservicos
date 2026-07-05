import "server-only"
import { createElement } from "react"
import { renderToBuffer } from "@react-pdf/renderer"
import { and, eq } from "drizzle-orm"

import { db } from "@/db/client"
import { orcamento, visita } from "@/db/schema"
import { getConfiguracao } from "@/lib/configuracao"
import { BUCKET_SERVICO, urlAssinada, urlsAssinadas } from "@/lib/storage"
import { OrcamentoPDF } from "@/components/orcamentos/orcamento-pdf"
import { OrdemServicoPDF } from "@/components/servicos/ordem-servico-pdf"

type Gerado = { buffer: Buffer; numero: number }

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
  const element = createElement(OrcamentoPDF, {
    orcamento: o,
    config,
  }) as Parameters<typeof renderToBuffer>[0]
  return { buffer: await renderToBuffer(element), numero: o.numero }
}

/** Gera o PDF de uma ordem de serviço (buffer) com fotos + assinatura. */
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
  const antesPaths = v.fotos.filter((f) => f.tipo === "ANTES").map((f) => f.storagePath)
  const depoisPaths = v.fotos.filter((f) => f.tipo === "DEPOIS").map((f) => f.storagePath)
  const urls = await urlsAssinadas(BUCKET_SERVICO, [...antesPaths, ...depoisPaths])
  const assinaturaUrl = await urlAssinada(BUCKET_SERVICO, v.assinaturaPath)
  const daPath = (p: string) => urls[p]

  const element = createElement(OrdemServicoPDF, {
    visita: v,
    config,
    fotosAntes: antesPaths.map(daPath).filter((u): u is string => !!u),
    fotosDepois: depoisPaths.map(daPath).filter((u): u is string => !!u),
    assinaturaUrl,
  }) as Parameters<typeof renderToBuffer>[0]
  return { buffer: await renderToBuffer(element), numero: v.numero }
}
