import { Badge } from "@/components/ui/badge"
import type { EstadoOrcamento } from "@/lib/constants/enums"
import { ESTADO_ORCAMENTO_META } from "@/lib/constants/estados"

export function EstadoOrcamentoBadge({ estado }: { estado: EstadoOrcamento }) {
  const meta = ESTADO_ORCAMENTO_META[estado]
  return (
    <Badge variant="outline" className={meta.badge}>
      {meta.label}
    </Badge>
  )
}
