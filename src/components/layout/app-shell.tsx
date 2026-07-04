import { DesktopSidebar } from "./desktop-sidebar"
import { MobileTabBar } from "./mobile-tab-bar"
import { TopBar } from "./top-bar"

export function AppShell({
  children,
  userEmail,
  showAdmin,
  temServicos,
}: {
  children: React.ReactNode
  userEmail?: string
  showAdmin?: boolean
  temServicos?: boolean
}) {
  return (
    <div className="flex min-h-dvh">
      <DesktopSidebar showAdmin={showAdmin} temServicos={temServicos} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          userEmail={userEmail}
          showAdmin={showAdmin}
          temServicos={temServicos}
        />
        <main className="bg-muted/30 flex-1 px-4 py-5 pb-28 md:px-6 md:py-6 md:pb-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
      <MobileTabBar showAdmin={showAdmin} temServicos={temServicos} />
    </div>
  )
}
