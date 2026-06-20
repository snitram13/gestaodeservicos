import { asc, eq } from "drizzle-orm"

import { db } from "@/db/client"
import { cliente, orcamento } from "@/db/schema"
import type { VisitaFormValues } from "@/lib/validations/visita"
import { PageHeader } from "@/components/common/page-header"
import { VisitaForm } from "@/components/visitas/visita-form"

export const metadata = { title: "Nova visita" }

export default async function NovaVisitaPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string; data?: string; orcamento?: string }>
}) {
  const { cliente: clienteId, data, orcamento: orcamentoId } = await searchParams

  const clientes = await db
    .select({
      id: cliente.id,
      nome: cliente.nome,
      telefone: cliente.telefone,
      morada: cliente.morada,
      cidade: cliente.cidade,
    })
    .from(cliente)
    .orderBy(asc(cliente.nome))

  let prefill: Partial<VisitaFormValues> = {}
  let orcamentoOrigemId: string | undefined
  if (clienteId) prefill.clienteId = clienteId
  if (data) prefill.agendadoPara = data

  // Pré-preencher a partir de um orçamento (linhas → serviços)
  if (orcamentoId) {
    const o = await db.query.orcamento.findFirst({
      where: eq(orcamento.id, orcamentoId),
      with: { itens: true },
    })
    if (o) {
      const servicos = [...o.itens]
        .sort((a, b) => a.ordem - b.ordem)
        .map((it) => ({
          categoria: o.categoria,
          titulo: it.descricao,
          descricao: "",
          maoDeObra: it.totalLinha,
          material: "0",
        }))
      prefill = {
        clienteId: o.clienteId,
        servicos:
          servicos.length > 0
            ? servicos
            : [
                {
                  categoria: o.categoria,
                  titulo: o.titulo,
                  descricao: "",
                  maoDeObra: "0",
                  material: "0",
                },
              ],
      }
      orcamentoOrigemId = o.id
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Nova visita" />
      <VisitaForm
        clientes={clientes}
        prefill={prefill}
        orcamentoOrigemId={orcamentoOrigemId}
      />
    </div>
  )
}
