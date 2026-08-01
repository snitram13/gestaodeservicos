"use client"

import { useState } from "react"
import { useT } from "@/components/i18n/idioma-provider"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { atualizarEstadoVisita } from "@/actions/visitas"
import type { EstadoVisita } from "@/lib/constants/enums"
import { ESTADO_VISITA_OPCOES } from "@/lib/constants/estados"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function EstadoVisitaSelect({
  id,
  estado,
}: {
  id: string
  estado: EstadoVisita
}) {
  const t = useT()
  const router = useRouter()
  const [valor, setValor] = useState<EstadoVisita>(estado)
  const [pending, setPending] = useState(false)

  async function onChange(novo: string | null) {
  const t = useT()
    if (!novo) return
    const estadoNovo = novo as EstadoVisita
    setValor(estadoNovo)
    setPending(true)
    const res = await atualizarEstadoVisita(id, estadoNovo)
    setPending(false)
    if (!res.ok) {
      toast.error(t("Não foi possível atualizar o estado"))
      setValor(estado)
      return
    }
    toast.success(t("Estado atualizado"))
    router.refresh()
  }

  return (
    <Select value={valor} onValueChange={onChange} disabled={pending}>
      <SelectTrigger className="h-9 w-[170px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ESTADO_VISITA_OPCOES.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {t(o.label)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
