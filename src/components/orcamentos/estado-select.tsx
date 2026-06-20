"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { atualizarEstadoOrcamento } from "@/actions/orcamentos"
import type { EstadoOrcamento } from "@/lib/constants/enums"
import { ESTADO_ORCAMENTO_OPCOES } from "@/lib/constants/estados"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function EstadoOrcamentoSelect({
  id,
  estado,
}: {
  id: string
  estado: EstadoOrcamento
}) {
  const router = useRouter()
  const [valor, setValor] = useState<EstadoOrcamento>(estado)
  const [pending, setPending] = useState(false)

  async function onChange(novo: string | null) {
    if (!novo) return
    const novoEstado = novo as EstadoOrcamento
    setValor(novoEstado)
    setPending(true)
    const res = await atualizarEstadoOrcamento(id, novoEstado)
    setPending(false)
    if (!res.ok) {
      toast.error("Não foi possível atualizar")
      setValor(estado)
      return
    }
    toast.success("Estado atualizado")
    router.refresh()
  }

  return (
    <Select value={valor} onValueChange={onChange} disabled={pending}>
      <SelectTrigger className="h-9 w-[150px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ESTADO_ORCAMENTO_OPCOES.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
