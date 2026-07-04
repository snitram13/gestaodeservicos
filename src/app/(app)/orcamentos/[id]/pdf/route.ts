import { createElement } from "react"
import { renderToBuffer } from "@react-pdf/renderer"
import { and, eq } from "drizzle-orm"

import { db } from "@/db/client"
import { orcamento } from "@/db/schema"
import { requireEmpresa } from "@/lib/auth"
import { getConfiguracao } from "@/lib/configuracao"
import { OrcamentoPDF } from "@/components/orcamentos/orcamento-pdf"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { empresaId } = await requireEmpresa()
  const { id } = await params

  const o = await db.query.orcamento.findFirst({
    where: and(eq(orcamento.id, id), eq(orcamento.empresaId, empresaId)),
    with: { cliente: true, itens: true },
  })
  if (!o) return new Response("Orçamento não encontrado", { status: 404 })

  const config = await getConfiguracao()
  const element = createElement(OrcamentoPDF, {
    orcamento: o,
    config,
  }) as Parameters<typeof renderToBuffer>[0]
  const buffer = await renderToBuffer(element)

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="orcamento-${o.numero}.pdf"`,
    },
  })
}
