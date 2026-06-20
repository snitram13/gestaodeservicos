import { CATEGORIA_META } from "@/lib/constants/categorias"
import type { CategoriaServico } from "@/lib/constants/enums"
import { cn } from "@/lib/utils"

export function CategoriaChip({
  categoria,
  className,
}: {
  categoria: CategoriaServico
  className?: string
}) {
  const meta = CATEGORIA_META[categoria]
  const Icon = meta.icon
  return (
    <span
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-lg",
        meta.chip,
        className
      )}
      title={meta.label}
    >
      <Icon className="size-4.5" />
    </span>
  )
}
