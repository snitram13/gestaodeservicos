import { CATEGORIA_META } from "@/lib/constants/categorias"
import { useT } from "@/components/i18n/idioma-provider"
import type { CategoriaServico } from "@/lib/constants/enums"
import { cn } from "@/lib/utils"

export function CategoriaChip({
  categoria,
  className,
}: {
  categoria: CategoriaServico
  className?: string
}) {
  const t = useT()
  const meta = CATEGORIA_META[categoria]
  const Icon = meta.icon
  return (
    <span
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-lg",
        meta.chip,
        className
      )}
      title={t(meta.label)}
    >
      <Icon className="size-4.5" />
    </span>
  )
}
