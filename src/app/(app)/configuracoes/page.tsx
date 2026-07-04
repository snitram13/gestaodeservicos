import { redirect } from "next/navigation"

import { getEmpresaAtual } from "@/lib/configuracao"
import { getUser, isSuperAdmin } from "@/lib/auth"
import { PageHeader } from "@/components/common/page-header"
import { EmpresaForm } from "@/components/configuracoes/empresa-form"
import { UtilizadoresSection } from "@/components/configuracoes/utilizadores-section"
import { ContaForm } from "@/components/configuracoes/conta-form"

export const metadata = { title: "Definições" }

export default async function ConfiguracoesPage() {
  const user = await getUser()
  // O super-admin tem as suas próprias definições (não a config de negócio).
  if (isSuperAdmin(user?.email)) redirect("/admin/definicoes")
  const cfg = await getEmpresaAtual()

  return (
    <div className="space-y-4">
      <PageHeader
        title="Definições"
        description="Dados da empresa (usados nos orçamentos) e conta."
      />
      <EmpresaForm configuracao={cfg} />
      <UtilizadoresSection />
      <ContaForm email={user?.email} />
    </div>
  )
}
