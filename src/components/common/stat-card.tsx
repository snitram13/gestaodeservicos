import Link from "next/link"
import { type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  accent,
  href,
}: {
  label: string
  value: string
  icon?: LucideIcon
  hint?: string
  accent?: string
  href?: string
}) {
  const body = (
    <CardContent className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="text-muted-foreground text-sm">{label}</p>
        <p className={cn("mt-1 text-2xl font-semibold tracking-tight", accent)}>
          {value}
        </p>
        {hint && <p className="text-muted-foreground mt-0.5 text-xs">{hint}</p>}
      </div>
      {Icon && (
        <span className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
          <Icon className="size-4.5" />
        </span>
      )}
    </CardContent>
  )

  if (href) {
    return (
      <Card className="hover:bg-muted/30 transition-colors">
        <Link href={href}>{body}</Link>
      </Card>
    )
  }
  return <Card>{body}</Card>
}
