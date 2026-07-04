import Link from "next/link"
import { and, asc, eq, ilike, or } from "drizzle-orm"
import { Plus, Users } from "lucide-react"

import { db } from "@/db/client"
import { cliente } from "@/db/schema"
import { requireEmpresa } from "@/lib/auth"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { EmptyState } from "@/components/common/empty-state"
import { PageHeader } from "@/components/common/page-header"
import { ClientesList } from "@/components/clientes/clientes-list"
import { ClientesSearch } from "@/components/clientes/clientes-search"

export const metadata = { title: "Clientes" }

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { empresaId } = await requireEmpresa()
  const { q } = await searchParams
  const termo = (q ?? "").trim()
  const where = termo
    ? and(
        eq(cliente.empresaId, empresaId),
        or(
          ilike(cliente.nome, `%${termo}%`),
          ilike(cliente.telefone, `%${termo}%`)
        )
      )
    : eq(cliente.empresaId, empresaId)

  const clientes = await db
    .select()
    .from(cliente)
    .where(where)
    .orderBy(asc(cliente.nome))

  return (
    <div className="space-y-4">
      <PageHeader
        title="Clientes"
        description={`${clientes.length} ${clientes.length === 1 ? "cliente" : "clientes"}`}
      >
        <Link href="/clientes/novo" className={cn(buttonVariants(), "h-10 gap-1.5")}>
          <Plus className="size-4" />
          Novo
        </Link>
      </PageHeader>

      <ClientesSearch defaultValue={termo} />

      {clientes.length === 0 ? (
        <EmptyState
          icon={Users}
          title={termo ? "Sem resultados" : "Ainda não há clientes"}
          description={
            termo
              ? "Tente procurar por outro nome ou telefone."
              : "Comece por adicionar o seu primeiro cliente."
          }
        >
          {!termo && (
            <Link
              href="/clientes/novo"
              className={cn(buttonVariants(), "gap-1.5")}
            >
              <Plus className="size-4" />
              Novo cliente
            </Link>
          )}
        </EmptyState>
      ) : (
        <ClientesList clientes={clientes} />
      )}
    </div>
  )
}
