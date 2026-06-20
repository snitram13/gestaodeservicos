import Link from "next/link"
import { and, asc, gte, lt } from "drizzle-orm"
import { Plus } from "lucide-react"

import { db } from "@/db/client"
import { visita, type Visita } from "@/db/schema"
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
import { DayView } from "@/components/agenda/day-view"
import { WeekView } from "@/components/agenda/week-view"
import { MonthView } from "@/components/agenda/month-view"

export const metadata = { title: "Agenda" }

type Row = Visita & {
  cliente: { nome: string } | null
  servicos: { categoria: CategoriaServico }[]
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string }>
}) {
  const sp = await searchParams
  const vista = vistaValida(sp.view)
  const date =
    sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : hojeKey()

  const dias = diasDaVista(vista, date)
  const { inicio, fim } = intervaloFetch(dias)

  const visitas = (await db.query.visita.findMany({
    where: and(gte(visita.agendadoPara, inicio), lt(visita.agendadoPara, fim)),
    with: {
      cliente: { columns: { nome: true } },
      servicos: { columns: { categoria: true } },
    },
    orderBy: [asc(visita.agendadoPara)],
  })) as Row[]

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
          Nova
        </Link>
      </PageHeader>

      <AgendaNav
        vista={vista}
        date={date}
        label={rotuloVista(vista, date)}
        nav={navDatas(vista, date)}
      />

      {vista === "dia" && (
        <DayView dia={dias[0]} visitas={porDia.get(dias[0]) ?? []} />
      )}
      {vista === "semana" && (
        <WeekView dias={dias} visitasPorDia={porDia} hoje={hojeKey()} />
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
