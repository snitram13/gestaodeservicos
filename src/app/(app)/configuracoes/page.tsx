import { getConfiguracao } from "@/lib/configuracao"
import { getUser } from "@/lib/auth"
import { PageHeader } from "@/components/common/page-header"
import { EmpresaForm } from "@/components/configuracoes/empresa-form"
import { ContaForm } from "@/components/configuracoes/conta-form"

export const metadata = { title: "Definições" }

export default async function ConfiguracoesPage() {
  const [cfg, user] = await Promise.all([getConfiguracao(), getUser()])

  return (
    <div className="space-y-4">
      <PageHeader
        title="Definições"
        description="Dados da empresa (usados nos orçamentos) e conta."
      />
      <EmpresaForm configuracao={cfg} />
      <ContaForm email={user?.email} />
    </div>
  )
}
