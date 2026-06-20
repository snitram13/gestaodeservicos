import Link from "next/link"
import { and, desc, eq } from "drizzle-orm"
import { CalendarCheck, Plus } from "lucide-react"

import { db } from "@/db/client"
import { visita } from "@/db/schema"
import type { CategoriaServico, EstadoVisita } from "@/lib/constants/enums"
import type { Visita } from "@/db/schema"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { EmptyState } from "@/components/common/empty-state"
import { PageHeader } from "@/components/common/page-header"
import { VisitasFiltros } from "@/components/visitas/visitas-filtros"
import { VisitasList } from "@/components/visitas/visitas-list"

export const metadata = { title: "Visitas" }

type Row = Visita & {
  cliente: { nome: string } | null
  servicos: { categoria: CategoriaServico }[]
}

export default async function VisitasPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>
}) {
  const { estado } = await searchParams
  const where = estado ? eq(visita.estado, estado as EstadoVisita) : undefined

  const visitas = (await db.query.visita.findMany({
    where: where ? and(where) : undefined,
    with: {
      cliente: { columns: { nome: true } },
      servicos: { columns: { categoria: true } },
    },
    orderBy: [desc(visita.agendadoPara)],
  })) as Row[]

  return (
    <div className="space-y-4">
      <PageHeader title="Visitas" description={`${visitas.length} visita(s)`}>
        <Link href="/visitas/novo" className={cn(buttonVariants(), "h-10 gap-1.5")}>
          <Plus className="size-4" />
          Nova
        </Link>
      </PageHeader>

      <VisitasFiltros estado={estado} />

      {visitas.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title={estado ? "Sem visitas com este estado" : "Ainda não há visitas"}
          description="Crie uma visita e adicione os serviços realizados."
        >
          <Link href="/visitas/novo" className={cn(buttonVariants(), "gap-1.5")}>
            <Plus className="size-4" />
            Nova visita
          </Link>
        </EmptyState>
      ) : (
        <VisitasList visitas={visitas} />
      )}
    </div>
  )
}
