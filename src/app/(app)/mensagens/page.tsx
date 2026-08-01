import { asc, eq } from "drizzle-orm"
import { getT } from "@/lib/i18n"

import { db } from "@/db/client"
import { cliente } from "@/db/schema"
import { requireEmpresa } from "@/lib/auth"
import { TEMPLATES_WHATSAPP } from "@/lib/constants/mensagens-whatsapp"
import { Card } from "@/components/ui/card"
import { PageHeader } from "@/components/common/page-header"
import { EnviarMensagem } from "@/components/mensagens/enviar-mensagem"

export const metadata = { title: "Mensagens" }

export default async function MensagensPage() {
  const t = await getT()
  const { empresaId } = await requireEmpresa()
  const clientes = await db
    .select({
      id: cliente.id,
      nome: cliente.nome,
      telefone: cliente.telefone,
    })
    .from(cliente)
    .where(eq(cliente.empresaId, empresaId))
    .orderBy(asc(cliente.nome))

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("Mensagens WhatsApp")}
        description={t("Modelos rápidos para enviar aos clientes.")}
      />

      <EnviarMensagem clientes={clientes} />

      <div>
        <h3 className="mb-2 text-sm font-medium">{t("Modelos disponíveis")}</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {TEMPLATES_WHATSAPP.map((m) => (
            <Card key={m.id} className="gap-1 p-4">
              <p className="font-medium">{t(m.titulo)}</p>
              <p className="text-muted-foreground text-sm">{t(m.texto)}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
