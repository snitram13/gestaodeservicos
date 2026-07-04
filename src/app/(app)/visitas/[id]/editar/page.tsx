import { notFound } from "next/navigation"
import { and, asc, eq } from "drizzle-orm"

import { db } from "@/db/client"
import { cliente, utilizador, visita } from "@/db/schema"
import { requireEmpresa } from "@/lib/auth"
import { temModuloAtual } from "@/lib/modulos"
import { MODULOS, rotulosServico } from "@/lib/constants/modulos"
import { PageHeader } from "@/components/common/page-header"
import { VisitaForm } from "@/components/visitas/visita-form"

export const metadata = { title: "Editar visita" }

export default async function EditarVisitaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { empresaId } = await requireEmpresa()
  const { id } = await params
  const v = await db.query.visita.findFirst({
    where: and(eq(visita.id, id), eq(visita.empresaId, empresaId)),
    with: { servicos: true },
  })
  if (!v) notFound()
  const r = rotulosServico(await temModuloAtual(MODULOS.ORDENS_SERVICO))

  const clientes = await db
    .select({
      id: cliente.id,
      nome: cliente.nome,
      telefone: cliente.telefone,
      morada: cliente.morada,
      cidade: cliente.cidade,
    })
    .from(cliente)
    .where(eq(cliente.empresaId, empresaId))
    .orderBy(asc(cliente.nome))

  const tecnicos = await db
    .select({
      id: utilizador.id,
      nome: utilizador.nome,
      corAgenda: utilizador.corAgenda,
    })
    .from(utilizador)
    .where(and(eq(utilizador.empresaId, empresaId), eq(utilizador.ativo, true)))
    .orderBy(asc(utilizador.nome))

  return (
    <div className="space-y-4">
      <PageHeader title={`Editar ${r.singular} #${v.numero}`} />
      <VisitaForm visita={v} clientes={clientes} tecnicos={tecnicos} />
    </div>
  )
}
