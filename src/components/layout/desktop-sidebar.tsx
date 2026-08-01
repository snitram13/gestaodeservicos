import { Wrench } from "lucide-react"
import { getT } from "@/lib/i18n"

import { SidebarNav } from "./sidebar-nav"

export async function DesktopSidebar({
  showAdmin,
  temServicos,
}: {
  showAdmin?: boolean
  temServicos?: boolean
}) {
  const t = await getT()
  return (
    <aside className="bg-sidebar sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r md:flex">
      <div className="flex h-16 items-center gap-2.5 border-b px-5">
        <div className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-lg">
          <Wrench className="size-5" />
        </div>
        <div className="leading-tight">
          <p className="font-semibold">{t("Gestão")}</p>
          <p className="text-muted-foreground text-xs">{t("de Serviços")}</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <SidebarNav showAdmin={showAdmin} temServicos={temServicos} />
      </div>
      <div className="text-muted-foreground border-t p-4 text-xs">
        © {t("Gestão de Serviços")}
      </div>
    </aside>
  )
}
