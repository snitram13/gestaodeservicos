import Link from "next/link"
import { CalendarDays, Plus } from "lucide-react"

import type { CategoriaServico } from "@/lib/constants/enums"
import type { Visita } from "@/db/schema"
import { cn } from "@/lib/utils"
import { formatHora } from "@/lib/formatters/date"
import { buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { EmptyState } from "@/components/common/empty-state"
import { CategoriaChip } from "@/components/visitas/categoria-chip"
import { EstadoVisitaBadge } from "@/components/visitas/estado-badge"

type Row = Visita & {
  cliente: { nome: string } | null
  servicos: { categoria: CategoriaServico }[]
}

export function DayView({ dia, visitas }: { dia: string; visitas: Row[] }) {
  return (
    <div className="space-y-2">
      {visitas.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Sem visitas neste dia"
          description="Toque abaixo para agendar uma visita."
        />
      ) : (
        visitas.map((v) => (
          <Link key={v.id} href={`/visitas/${v.id}`}>
            <Card className="gap-0 p-3">
              <div className="flex items-center gap-3">
                <div className="text-muted-foreground w-12 shrink-0 text-sm font-medium">
                  {formatHora(v.agendadoPara)}
                </div>
                <CategoriaChip categoria={v.servicos[0]?.categoria ?? "OUTROS"} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {v.titulo || `Visita #${v.numero}`}
                  </p>
                  <p className="text-muted-foreground truncate text-sm">
                    {v.cliente?.nome ?? "—"}
                  </p>
                </div>
                <EstadoVisitaBadge estado={v.estado} />
              </div>
            </Card>
          </Link>
        ))
      )}

      <Link
        href={`/visitas/novo?data=${dia}T09:00`}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "h-11 w-full border-dashed gap-1.5"
        )}
      >
        <Plus className="size-4" />
        Nova visita neste dia
      </Link>
    </div>
  )
}
