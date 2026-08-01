"use client"

import { usePathname } from "next/navigation"
import { useT } from "@/components/i18n/idioma-provider"

import { tituloDaRota } from "@/lib/navigation"
import { MobileDrawer } from "./mobile-drawer"
import { NovoButton } from "./quick-actions"
import { UserMenu } from "./user-menu"

export function TopBar({
  userEmail,
  showAdmin,
  temServicos,
}: {
  userEmail?: string
  showAdmin?: boolean
  temServicos?: boolean
}) {
  const t = useT()
  const pathname = usePathname()

  return (
    <header className="bg-background/80 sticky top-0 z-30 flex h-16 items-center gap-2 border-b px-3 backdrop-blur md:px-6">
      <MobileDrawer showAdmin={showAdmin} temServicos={temServicos} />
      <h1 className="flex-1 truncate text-lg font-semibold">
        {t(tituloDaRota(pathname, temServicos))}
      </h1>
      <div className="flex items-center gap-1.5">
        {/* Ações rápidas de negócio — não fazem sentido para o controlador. */}
        {!showAdmin && (
          <div className="hidden md:block">
            <NovoButton />
          </div>
        )}
        <UserMenu email={userEmail} />
      </div>
    </header>
  )
}
