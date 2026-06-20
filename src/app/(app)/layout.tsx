import { AppShell } from "@/components/layout/app-shell"
import { requireUser } from "@/lib/auth"

// Todas as páginas autenticadas mostram dados por pedido — nunca pré-gerar.
export const dynamic = "force-dynamic"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireUser()
  return <AppShell userEmail={user.email}>{children}</AppShell>
}
