import { ClienteForm } from "@/components/clientes/cliente-form"
import { PageHeader } from "@/components/common/page-header"
import { getPais, getT } from "@/lib/i18n"

export const metadata = { title: "Novo cliente" }

export default async function NovoClientePage() {
  const [t, pais] = await Promise.all([getT(), getPais()])
  return (
    <div className="space-y-4">
      <PageHeader
        title={t("Novo cliente")}
        description={t("Registar um novo cliente.")}
      />
      <ClienteForm pais={pais} />
    </div>
  )
}
