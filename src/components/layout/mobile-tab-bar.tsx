"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { MOBILE_TABS, isActiveHref, type NavItem } from "@/lib/navigation"
import { cn } from "@/lib/utils"
import { QuickActionFab } from "./quick-actions"

function TabLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActiveHref(pathname, item.href)
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-full flex-col items-center justify-center gap-1 text-[0.7rem] font-medium",
        active ? "text-primary" : "text-muted-foreground"
      )}
    >
      <Icon className="size-5" />
      {item.label}
    </Link>
  )
}

export function MobileTabBar() {
  const pathname = usePathname()
  const left = MOBILE_TABS.slice(0, 2)
  const right = MOBILE_TABS.slice(2, 4)

  return (
    <nav className="bg-background/95 fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur md:hidden">
      <div className="grid grid-cols-5 items-center pb-[env(safe-area-inset-bottom)]">
        {left.map((item) => (
          <div key={item.href} className="h-16">
            <TabLink item={item} pathname={pathname} />
          </div>
        ))}
        <div className="flex h-16 items-center justify-center">
          <QuickActionFab />
        </div>
        {right.map((item) => (
          <div key={item.href} className="h-16">
            <TabLink item={item} pathname={pathname} />
          </div>
        ))}
      </div>
    </nav>
  )
}
