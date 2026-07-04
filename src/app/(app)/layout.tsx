import { AppShell } from "@/components/layout/app-shell"
import { AvisoAcesso } from "@/components/layout/aviso-acesso"
import { RotulosProvider } from "@/components/servicos/rotulos"
import { isSuperAdmin, requireUser } from "@/lib/auth"
import { getModulosAtuais } from "@/lib/modulos"
import { MODULOS, temModulo } from "@/lib/constants/modulos"

// Todas as páginas autenticadas mostram dados por pedido — nunca pré-gerar.
export const dynamic = "force-dynamic"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireUser()
  const superAdmin = isSuperAdmin(user.email)
  // Quando o módulo Ordens de Serviço está ligado, o menu "Visitas" → "Serviços".
  const temServicos = superAdmin
    ? false
    : temModulo(await getModulosAtuais(), MODULOS.ORDENS_SERVICO)

  return (
    <AppShell
      userEmail={user.email}
      showAdmin={superAdmin}
      temServicos={temServicos}
    >
      <RotulosProvider temServicos={temServicos}>
        <AvisoAcesso />
        {children}
      </RotulosProvider>
    </AppShell>
  )
}
