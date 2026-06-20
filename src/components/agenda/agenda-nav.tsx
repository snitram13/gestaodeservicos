import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import type { Vista } from "@/lib/agenda"

const VISTAS: { v: Vista; label: string }[] = [
  { v: "dia", label: "Dia" },
  { v: "semana", label: "Semana" },
  { v: "mes", label: "Mês" },
]

export function AgendaNav({
  vista,
  date,
  label,
  nav,
}: {
  vista: Vista
  date: string
  label: string
  nav: { anterior: string; seguinte: string; hoje: string }
}) {
  const href = (v: Vista, d: string) => `/agenda?view=${v}&date=${d}`

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <Link
          href={href(vista, nav.anterior)}
          className={cn(buttonVariants({ variant: "outline", size: "icon" }))}
          aria-label="Anterior"
        >
          <ChevronLeft className="size-4" />
        </Link>
        <Link
          href={href(vista, nav.seguinte)}
          className={cn(buttonVariants({ variant: "outline", size: "icon" }))}
          aria-label="Seguinte"
        >
          <ChevronRight className="size-4" />
        </Link>
        <Link
          href={href(vista, nav.hoje)}
          className={cn(buttonVariants({ variant: "outline" }), "h-9")}
        >
          Hoje
        </Link>
        <span className="ml-1 font-medium capitalize">{label}</span>
      </div>

      <div className="bg-muted inline-flex w-fit rounded-lg p-0.5">
        {VISTAS.map(({ v, label }) => (
          <Link
            key={v}
            href={href(v, date)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              vista === v
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground"
            )}
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  )
}
