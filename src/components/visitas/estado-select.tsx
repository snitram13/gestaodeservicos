"use client"

import { useState } from "react"
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
  const router = useRouter()
  const [valor, setValor] = useState<EstadoVisita>(estado)
  const [pending, setPending] = useState(false)

  async function onChange(novo: string | null) {
    if (!novo) return
    const estadoNovo = novo as EstadoVisita
    setValor(estadoNovo)
    setPending(true)
    const res = await atualizarEstadoVisita(id, estadoNovo)
    setPending(false)
    if (!res.ok) {
      toast.error("Não foi possível atualizar o estado")
      setValor(estado)
      return
    }
    toast.success("Estado atualizado")
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
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
