"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { ADMIN_NAV_ITEMS, isActiveHref, navNegocio } from "@/lib/navigation"
import { cn } from "@/lib/utils"

export function SidebarNav({
  onNavigate,
  showAdmin,
  temServicos,
}: {
  onNavigate?: () => void
  showAdmin?: boolean
  temServicos?: boolean
}) {
  const pathname = usePathname()
  // O super-admin vê a navegação de controlador da plataforma, não a de negócio.
  const items = showAdmin ? ADMIN_NAV_ITEMS : navNegocio(!!temServicos)

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active = isActiveHref(pathname, item.href)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-5 shrink-0" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
