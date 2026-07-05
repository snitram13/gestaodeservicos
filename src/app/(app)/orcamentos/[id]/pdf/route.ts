import { requireEmpresa } from "@/lib/auth"
import { bufferOrcamento } from "@/lib/pdf-gen"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { empresaId } = await requireEmpresa()
  const { id } = await params

  const r = await bufferOrcamento(id, empresaId)
  if (!r) return new Response("Orçamento não encontrado", { status: 404 })

  return new Response(new Uint8Array(r.buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="orcamento-${r.numero}.pdf"`,
    },
  })
}
