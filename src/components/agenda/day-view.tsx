import Link from "next/link"
import { getT } from "@/lib/i18n"
import { getFormatos } from "@/lib/formatos"
import { CalendarDays, Plus } from "lucide-react"

import type { CategoriaServico } from "@/lib/constants/enums"
import type { Visita } from "@/db/schema"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { EmptyState } from "@/components/common/empty-state"
import { rotulosServico } from "@/lib/constants/modulos"
import { CategoriaChip } from "@/components/visitas/categoria-chip"
import { EstadoVisitaBadge } from "@/components/visitas/estado-badge"

type Row = Visita & {
  cliente: { nome: string } | null
  servicos: { categoria: CategoriaServico }[]
  tecnico: { id: string; nome: string; corAgenda: string | null } | null
}

export async function DayView({
  dia,
  visitas,
  temServicos,
}: {
  dia: string
  visitas: Row[]
  temServicos?: boolean
}) {
  const f = await getFormatos()
  const t = await getT()
  const r = rotulosServico(!!temServicos, t)
  return (
    <div className="space-y-2">
      {visitas.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title={r.semNoDia}
          description={r.agendar}
        />
      ) : (
        visitas.map((v) => {
          const cor = v.tecnico?.corAgenda ?? undefined
          return (
            <Link key={v.id} href={`/visitas/${v.id}`}>
              <Card
                className={cn("gap-0 p-3", cor && "border-l-4")}
                style={cor ? { borderLeftColor: cor } : undefined}
              >
                <div className="flex items-center gap-3">
                  <div className="text-muted-foreground w-12 shrink-0 text-sm font-medium">
                    {f.hora(v.agendadoPara)}
                  </div>
                  <CategoriaChip categoria={v.servicos[0]?.categoria ?? "OUTROS"} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {v.titulo || `${r.Singular} #${v.numero}`}
                    </p>
                    <p className="text-muted-foreground flex items-center gap-1.5 truncate text-sm">
                      <span className="truncate">{v.cliente?.nome ?? "—"}</span>
                      {v.tecnico && (
                        <span className="inline-flex shrink-0 items-center gap-1">
                          <span className="opacity-60">·</span>
                          <span
                            className="size-2 shrink-0 rounded-full"
                            style={{ backgroundColor: cor }}
                          />
                          {v.tecnico.nome}
                        </span>
                      )}
                    </p>
                  </div>
                  <EstadoVisitaBadge estado={v.estado} />
                </div>
              </Card>
            </Link>
          )
        })
      )}

      <Link
        href={`/visitas/novo?data=${dia}T09:00`}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "h-11 w-full border-dashed gap-1.5"
        )}
      >
        <Plus className="size-4" />
        {r.novoNoDia}
      </Link>
    </div>
  )
}
