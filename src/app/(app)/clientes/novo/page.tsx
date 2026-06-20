import { ClienteForm } from "@/components/clientes/cliente-form"
import { PageHeader } from "@/components/common/page-header"

export const metadata = { title: "Novo cliente" }

export default function NovoClientePage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Novo cliente" description="Registar um novo cliente." />
      <ClienteForm />
    </div>
  )
}
