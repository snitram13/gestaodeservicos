import { notFound } from "next/navigation"
import { and, eq } from "drizzle-orm"

import { db } from "@/db/client"
import { cliente } from "@/db/schema"
import { requireEmpresa } from "@/lib/auth"
import { ClienteForm } from "@/components/clientes/cliente-form"
import { PageHeader } from "@/components/common/page-header"

export const metadata = { title: "Editar cliente" }

export default async function EditarClientePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { empresaId } = await requireEmpresa()
  const { id } = await params
  const c = await db.query.cliente.findFirst({
    where: and(eq(cliente.id, id), eq(cliente.empresaId, empresaId)),
  })
  if (!c) notFound()

  return (
    <div className="space-y-4">
      <PageHeader title="Editar cliente" />
      <ClienteForm
        clienteId={id}
        defaultValues={{
          nome: c.nome,
          telefone: c.telefone,
          email: c.email ?? "",
          nif: c.nif ?? "",
          morada: c.morada ?? "",
          cidade: c.cidade ?? "",
          codigoPostal: c.codigoPostal ?? "",
          notas: c.notas ?? "",
        }}
      />
    </div>
  )
}
