import { Badge } from "@/components/ui/badge"
import type { EstadoVisita } from "@/lib/constants/enums"
import { ESTADO_VISITA_META } from "@/lib/constants/estados"

export function EstadoVisitaBadge({ estado }: { estado: EstadoVisita }) {
  const meta = ESTADO_VISITA_META[estado]
  return (
    <Badge variant="outline" className={meta.badge}>
      {meta.label}
    </Badge>
  )
}
