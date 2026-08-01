import { redirect } from "next/navigation"

import { getEmpresaAtual } from "@/lib/configuracao"
import { getUser, isSuperAdmin } from "@/lib/auth"
import { PageHeader } from "@/components/common/page-header"
import { EmpresaForm } from "@/components/configuracoes/empresa-form"
import { UtilizadoresSection } from "@/components/configuracoes/utilizadores-section"
import { ContaForm } from "@/components/configuracoes/conta-form"
import { SeletorIdioma } from "@/components/i18n/seletor-idioma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getIdioma, getT } from "@/lib/i18n"

export const metadata = { title: "Definições" }

export default async function ConfiguracoesPage() {
  const user = await getUser()
  // O super-admin tem as suas próprias definições (não a config de negócio).
  if (isSuperAdmin(user?.email)) redirect("/admin/definicoes")
  const cfg = await getEmpresaAtual()
  const [t, idioma] = await Promise.all([getT(), getIdioma()])

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("Definições")}
        description={t("Dados da empresa (usados nos orçamentos) e conta.")}
      />
      <Card>
        <CardHeader>
          <CardTitle>{t("Idioma")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-muted-foreground text-sm">
            {t("Escolha o idioma em que quer ver a aplicação.")}
          </p>
          <SeletorIdioma atual={idioma} />
        </CardContent>
      </Card>
      <EmpresaForm configuracao={cfg} />
      <UtilizadoresSection />
      <ContaForm email={user?.email} />
    </div>
  )
}
