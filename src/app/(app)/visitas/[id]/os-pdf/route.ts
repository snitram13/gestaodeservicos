import { createElement } from "react"
import { renderToBuffer } from "@react-pdf/renderer"
import { and, eq } from "drizzle-orm"

import { db } from "@/db/client"
import { visita } from "@/db/schema"
import { requireEmpresa } from "@/lib/auth"
import { temModuloAtual } from "@/lib/modulos"
import { MODULOS } from "@/lib/constants/modulos"
import { getConfiguracao } from "@/lib/configuracao"
import { BUCKET_SERVICO, urlAssinada, urlsAssinadas } from "@/lib/storage"
import { OrdemServicoPDF } from "@/components/servicos/ordem-servico-pdf"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { empresaId } = await requireEmpresa()
  if (!(await temModuloAtual(MODULOS.ORDENS_SERVICO))) {
    return new Response("Módulo não disponível", { status: 403 })
  }
  const { id } = await params

  const v = await db.query.visita.findFirst({
    where: and(eq(visita.id, id), eq(visita.empresaId, empresaId)),
    with: { cliente: true, servicos: true, fotos: true },
  })
  if (!v) return new Response("Visita não encontrada", { status: 404 })

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
  const buffer = await renderToBuffer(element)

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="ordem-servico-${v.numero}.pdf"`,
    },
  })
}
