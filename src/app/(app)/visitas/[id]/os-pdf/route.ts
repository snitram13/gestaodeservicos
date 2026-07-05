import { requireEmpresa } from "@/lib/auth"
import { temModuloAtual } from "@/lib/modulos"
import { MODULOS } from "@/lib/constants/modulos"
import { bufferOrdemServico } from "@/lib/pdf-gen"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { empresaId } = await requireEmpresa()
  if (!(await temModuloAtual(MODULOS.ORDENS_SERVICO))) {
    return new Response("Módulo não disponível", { status: 403 })
  }
  const { id } = await params

  const r = await bufferOrdemServico(id, empresaId)
  if (!r) return new Response("Visita não encontrada", { status: 404 })

  return new Response(new Uint8Array(r.buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="ordem-servico-${r.numero}.pdf"`,
    },
  })
}
