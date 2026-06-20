import { notFound } from "next/navigation"
import { asc, eq } from "drizzle-orm"

import { db } from "@/db/client"
import { cliente, visita } from "@/db/schema"
import { PageHeader } from "@/components/common/page-header"
import { VisitaForm } from "@/components/visitas/visita-form"

export const metadata = { title: "Editar visita" }

export default async function EditarVisitaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const v = await db.query.visita.findFirst({
    where: eq(visita.id, id),
    with: { servicos: true },
  })
  if (!v) notFound()

  const clientes = await db
    .select({
      id: cliente.id,
      nome: cliente.nome,
      telefone: cliente.telefone,
      morada: cliente.morada,
      cidade: cliente.cidade,
    })
    .from(cliente)
    .orderBy(asc(cliente.nome))

  return (
    <div className="space-y-4">
      <PageHeader title={`Editar visita #${v.numero}`} />
      <VisitaForm visita={v} clientes={clientes} />
    </div>
  )
}
