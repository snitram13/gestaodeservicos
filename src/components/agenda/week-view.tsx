import Link from "next/link"

import type { Visita } from "@/db/schema"
import { cn } from "@/lib/utils"
import { formatHora } from "@/lib/formatters/date"
import { rotuloDia } from "@/lib/agenda"
import { rotulosServico } from "@/lib/constants/modulos"
import { ESTADO_VISITA_META } from "@/lib/constants/estados"

type Row = Visita & {
  cliente: { nome: string } | null
  tecnico: { id: string; nome: string; corAgenda: string | null } | null
}

export function WeekView({
  dias,
  visitasPorDia,
  hoje,
  temServicos,
}: {
  dias: string[]
  visitasPorDia: Map<string, Row[]>
  hoje: string
  temServicos?: boolean
}) {
  const rot = rotulosServico(!!temServicos)
  return (
    <div className="grid grid-cols-1 gap-2 md:h-[calc(100dvh-14rem)] md:grid-cols-7">
      {dias.map((dia) => {
        const lista = visitasPorDia.get(dia) ?? []
        const r = rotuloDia(dia)
        const isHoje = dia === hoje
        return (
          <div
            key={dia}
            className={cn(
              "bg-card flex min-h-24 flex-col overflow-hidden rounded-lg border p-2 md:min-h-0",
              isHoje && "border-primary/40 bg-primary/5"
            )}
          >
            <Link
              href={`/agenda?view=dia&date=${dia}`}
              className="mb-1.5 flex shrink-0 items-center gap-1.5"
            >
              <span className="text-muted-foreground text-xs capitalize">
                {r.semana}
              </span>
              <span
                className={cn(
                  "inline-flex size-6 items-center justify-center rounded-full text-sm font-medium",
                  isHoje && "bg-primary text-primary-foreground"
                )}
              >
                {r.dia}
              </span>
              {lista.length > 0 && (
                <span className="text-muted-foreground ml-auto text-xs">
                  {lista.length}
                </span>
              )}
            </Link>
            <div className="space-y-1 overflow-y-auto md:flex-1">
              {lista.map((v) => {
                const cor = v.tecnico?.corAgenda ?? undefined
                return (
                <Link
                  key={v.id}
                  href={`/visitas/${v.id}`}
                  className={cn(
                    "hover:bg-muted bg-muted/40 block rounded-md px-1.5 py-1 text-xs",
                    cor && "border-l-2 pl-1"
                  )}
                  style={cor ? { borderLeftColor: cor } : undefined}
                  title={v.tecnico?.nome}
                >
                  <span className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "size-2 shrink-0 rounded-full",
                        ESTADO_VISITA_META[v.estado].dot
                      )}
                    />
                    <span className="text-muted-foreground shrink-0">
                      {formatHora(v.agendadoPara)}
                    </span>
                  </span>
                  <span className="mt-0.5 block truncate font-medium">
                    {v.titulo || `${rot.Singular} #${v.numero}`}
                  </span>
                  {v.cliente?.nome && (
                    <span className="text-muted-foreground block truncate">
                      {v.cliente.nome}
                    </span>
                  )}
                </Link>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
