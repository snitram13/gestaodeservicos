import Link from "next/link"
import { and, asc, eq, gte, lt } from "drizzle-orm"
import { Plus } from "lucide-react"

import { db } from "@/db/client"
import { utilizador, visita, type Visita } from "@/db/schema"
import { requireEmpresa } from "@/lib/auth"
import { temModuloAtual } from "@/lib/modulos"
import { MODULOS, rotulosServico } from "@/lib/constants/modulos"
import type { CategoriaServico } from "@/lib/constants/enums"
import { cn } from "@/lib/utils"
import { chaveDia } from "@/lib/formatters/date"
import {
  diasDaVista,
  hojeKey,
  intervaloFetch,
  navDatas,
  rotuloVista,
  vistaValida,
} from "@/lib/agenda"
import { buttonVariants } from "@/components/ui/button"
import { PageHeader } from "@/components/common/page-header"
import { AgendaNav } from "@/components/agenda/agenda-nav"
import { AgendaLegenda } from "@/components/agenda/agenda-legenda"
import { DayView } from "@/components/agenda/day-view"
import { WeekView } from "@/components/agenda/week-view"
import { MonthView } from "@/components/agenda/month-view"

export const metadata = { title: "Agenda" }

type Row = Visita & {
  cliente: { nome: string } | null
  servicos: { categoria: CategoriaServico }[]
  tecnico: { id: string; nome: string; corAgenda: string | null } | null
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string }>
}) {
  const { empresaId } = await requireEmpresa()
  const temServicos = await temModuloAtual(MODULOS.ORDENS_SERVICO)
  const r = rotulosServico(temServicos)
  const sp = await searchParams
  const vista = vistaValida(sp.view)
  const date =
    sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : hojeKey()

  const dias = diasDaVista(vista, date)
  const { inicio, fim } = intervaloFetch(dias)

  const [visitas, tecnicos] = await Promise.all([
    db.query.visita.findMany({
      where: and(
        eq(visita.empresaId, empresaId),
        gte(visita.agendadoPara, inicio),
        lt(visita.agendadoPara, fim)
      ),
      with: {
        cliente: { columns: { nome: true } },
        servicos: { columns: { categoria: true } },
        tecnico: { columns: { id: true, nome: true, corAgenda: true } },
      },
      orderBy: [asc(visita.agendadoPara)],
    }) as Promise<Row[]>,
    db.query.utilizador.findMany({
      where: and(eq(utilizador.empresaId, empresaId), eq(utilizador.ativo, true)),
      columns: { id: true, nome: true, corAgenda: true },
      orderBy: [asc(utilizador.nome)],
    }),
  ])

  const porDia = new Map<string, Row[]>()
  for (const v of visitas) {
    const k = chaveDia(v.agendadoPara)
    const arr = porDia.get(k)
    if (arr) arr.push(v)
    else porDia.set(k, [v])
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Agenda">
        <Link href="/visitas/novo" className={cn(buttonVariants(), "h-10 gap-1.5")}>
          <Plus className="size-4" />
          {r.novo}
        </Link>
      </PageHeader>

      <AgendaNav
        vista={vista}
        date={date}
        label={rotuloVista(vista, date)}
        nav={navDatas(vista, date)}
      />

      <AgendaLegenda tecnicos={tecnicos} />

      {vista === "dia" && (
        <DayView
          dia={dias[0]}
          visitas={porDia.get(dias[0]) ?? []}
          temServicos={temServicos}
        />
      )}
      {vista === "semana" && (
        <WeekView
          dias={dias}
          visitasPorDia={porDia}
          hoje={hojeKey()}
          temServicos={temServicos}
        />
      )}
      {vista === "mes" && (
        <MonthView
          dias={dias}
          visitasPorDia={porDia}
          hoje={hojeKey()}
          mesAtual={Number(date.slice(5, 7))}
        />
      )}
    </div>
  )
}
