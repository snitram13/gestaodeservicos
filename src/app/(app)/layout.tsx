import { AppShell } from "@/components/layout/app-shell"
import { AvisoAcesso } from "@/components/layout/aviso-acesso"
import { IdiomaProvider } from "@/components/i18n/idioma-provider"
import { RotulosProvider } from "@/components/servicos/rotulos"
import { getDicionario, getIdioma, getPais } from "@/lib/i18n"
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
  const [idioma, pais, dic] = await Promise.all([
    getIdioma(),
    getPais(),
    getDicionario(),
  ])
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
      <IdiomaProvider idioma={idioma} pais={pais} dic={dic}>
        <RotulosProvider temServicos={temServicos}>
          <AvisoAcesso />
          {children}
        </RotulosProvider>
      </IdiomaProvider>
    </AppShell>
  )
}
