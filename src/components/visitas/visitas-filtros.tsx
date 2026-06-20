"use client"

import { usePathname, useRouter } from "next/navigation"

import { ESTADO_VISITA_OPCOES } from "@/lib/constants/estados"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const TODOS = "TODOS"

export function VisitasFiltros({ estado }: { estado?: string }) {
  const router = useRouter()
  const pathname = usePathname()

  function aplicar(v: string) {
    router.replace(
      v && v !== TODOS ? `${pathname}?estado=${v}` : pathname,
      { scroll: false }
    )
  }

  return (
    <Select value={estado ?? TODOS} onValueChange={(v) => aplicar(v ?? TODOS)}>
      <SelectTrigger className="h-10 w-[190px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={TODOS}>Todos os estados</SelectItem>
        {ESTADO_VISITA_OPCOES.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
