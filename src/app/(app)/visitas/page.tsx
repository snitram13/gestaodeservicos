import Link from "next/link"
import { and, desc, eq } from "drizzle-orm"
import { CalendarCheck, Plus } from "lucide-react"

import { db } from "@/db/client"
import { visita } from "@/db/schema"
import { requireEmpresa } from "@/lib/auth"
import { temModuloAtual } from "@/lib/modulos"
import { MODULOS, rotulosServico } from "@/lib/constants/modulos"
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
  tecnico: { nome: string } | null
  servicos: { categoria: CategoriaServico }[]
}

export default async function VisitasPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>
}) {
  const { empresaId } = await requireEmpresa()
  const { estado } = await searchParams
  const temServicos = await temModuloAtual(MODULOS.ORDENS_SERVICO)
  const r = rotulosServico(temServicos)

  const visitas = (await db.query.visita.findMany({
    where: and(
      eq(visita.empresaId, empresaId),
      estado ? eq(visita.estado, estado as EstadoVisita) : undefined
    ),
    with: {
      cliente: { columns: { nome: true } },
      tecnico: { columns: { nome: true } },
      servicos: { columns: { categoria: true } },
    },
    orderBy: [desc(visita.agendadoPara)],
  })) as Row[]

  return (
    <div className="space-y-4">
      <PageHeader
        title={r.Plural}
        description={`${visitas.length} ${visitas.length === 1 ? r.singular : r.plural}`}
      >
        <Link href="/visitas/novo" className={cn(buttonVariants(), "h-10 gap-1.5")}>
          <Plus className="size-4" />
          {r.novo}
        </Link>
      </PageHeader>

      <VisitasFiltros estado={estado} />

      {visitas.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title={
            estado
              ? `Sem ${r.plural} com este estado`
              : `Ainda não há ${r.plural}`
          }
          description="Registe aqui o trabalho realizado."
        >
          <Link href="/visitas/novo" className={cn(buttonVariants(), "gap-1.5")}>
            <Plus className="size-4" />
            {r.novo}
          </Link>
        </EmptyState>
      ) : (
        <VisitasList visitas={visitas} temServicos={temServicos} />
      )}
    </div>
  )
}
