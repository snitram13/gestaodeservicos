import { notFound } from "next/navigation"
import { asc, eq } from "drizzle-orm"

import { db } from "@/db/client"
import { cliente, orcamento } from "@/db/schema"
import { PageHeader } from "@/components/common/page-header"
import { OrcamentoForm } from "@/components/orcamentos/orcamento-form"

export const metadata = { title: "Editar orçamento" }

export default async function EditarOrcamentoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const o = await db.query.orcamento.findFirst({
    where: eq(orcamento.id, id),
    with: { itens: true },
  })
  if (!o) notFound()

  const clientes = await db
    .select({
      id: cliente.id,
      nome: cliente.nome,
      telefone: cliente.telefone,
    })
    .from(cliente)
    .orderBy(asc(cliente.nome))

  return (
    <div className="space-y-4">
      <PageHeader title={`Editar orçamento #${o.numero}`} />
      <OrcamentoForm orcamento={o} clientes={clientes} />
    </div>
  )
}
