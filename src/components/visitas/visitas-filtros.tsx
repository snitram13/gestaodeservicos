"use client"

import { usePathname, useRouter } from "next/navigation"
import { useT } from "@/components/i18n/idioma-provider"

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
  const t = useT()
  const router = useRouter()
  const pathname = usePathname()

  function aplicar(v: string) {
  const t = useT()
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
        <SelectItem value={TODOS}>{t("Todos os estados")}</SelectItem>
        {ESTADO_VISITA_OPCOES.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
