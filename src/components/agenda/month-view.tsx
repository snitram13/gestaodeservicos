import Link from "next/link"

import type { Visita } from "@/db/schema"
import { cn } from "@/lib/utils"
import { rotuloDia } from "@/lib/agenda"
import { ESTADO_VISITA_META } from "@/lib/constants/estados"

type Row = Visita & { cliente: { nome: string } | null }

const DIAS_SEMANA = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]

export function MonthView({
  dias,
  visitasPorDia,
  hoje,
  mesAtual,
}: {
  dias: string[]
  visitasPorDia: Map<string, Row[]>
  hoje: string
  mesAtual: number
}) {
  return (
    <div>
      <div className="text-muted-foreground mb-1 grid grid-cols-7 gap-1 text-center text-xs font-medium">
        {DIAS_SEMANA.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {dias.map((dia) => {
          const lista = visitasPorDia.get(dia) ?? []
          const r = rotuloDia(dia)
          const isHoje = dia === hoje
          const noMes = r.mesNum === mesAtual
          return (
            <Link
              key={dia}
              href={`/agenda?view=dia&date=${dia}`}
              className={cn(
                "bg-card hover:bg-muted/50 flex min-h-16 flex-col rounded-md border p-1 transition-colors sm:min-h-20",
                !noMes && "opacity-40"
              )}
            >
              <span
                className={cn(
                  "inline-flex size-6 items-center justify-center self-end rounded-full text-xs font-medium",
                  isHoje && "bg-primary text-primary-foreground"
                )}
              >
                {r.dia}
              </span>
              <div className="mt-auto flex flex-wrap gap-0.5">
                {lista.slice(0, 4).map((v) => (
                  <span
                    key={v.id}
                    className={cn(
                      "size-1.5 rounded-full",
                      ESTADO_VISITA_META[v.estado].dot
                    )}
                  />
                ))}
                {lista.length > 4 && (
                  <span className="text-muted-foreground text-[0.6rem] leading-none">
                    +{lista.length - 4}
                  </span>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
