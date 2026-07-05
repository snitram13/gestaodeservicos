import { and, asc, eq } from "drizzle-orm"

import { db } from "@/db/client"
import { cliente, orcamento, utilizador } from "@/db/schema"
import { requireEmpresa } from "@/lib/auth"
import { temModuloAtual } from "@/lib/modulos"
import { MODULOS, rotulosServico } from "@/lib/constants/modulos"
import type { VisitaFormValues } from "@/lib/validations/visita"
import { PageHeader } from "@/components/common/page-header"
import { VisitaForm } from "@/components/visitas/visita-form"

export const metadata = { title: "Nova visita" }

export default async function NovaVisitaPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string; data?: string; orcamento?: string }>
}) {
  const { empresaId } = await requireEmpresa()
  const r = rotulosServico(await temModuloAtual(MODULOS.ORDENS_SERVICO))
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
    .where(eq(cliente.empresaId, empresaId))
    .orderBy(asc(cliente.nome))

  const tecnicos = await db
    .select({
      id: utilizador.id,
      nome: utilizador.nome,
      corAgenda: utilizador.corAgenda,
    })
    .from(utilizador)
    .where(and(eq(utilizador.empresaId, empresaId), eq(utilizador.ativo, true)))
    .orderBy(asc(utilizador.nome))

  let prefill: Partial<VisitaFormValues> = {}
  let orcamentoOrigemId: string | undefined
  if (clienteId) prefill.clienteId = clienteId
  if (data) prefill.agendadoPara = data

  // Pré-preencher a partir de um orçamento (linhas → serviços)
  if (orcamentoId) {
    const o = await db.query.orcamento.findFirst({
      where: and(eq(orcamento.id, orcamentoId), eq(orcamento.empresaId, empresaId)),
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
        // Local da obra do orçamento tem prioridade; senão o formulário
        // preenche a partir da morada do cliente.
        ...(o.morada ? { moradaServico: o.morada } : {}),
        ...(o.cidade ? { cidade: o.cidade } : {}),
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
      <PageHeader title={r.novo} />
      <VisitaForm
        clientes={clientes}
        tecnicos={tecnicos}
        prefill={prefill}
        orcamentoOrigemId={orcamentoOrigemId}
      />
    </div>
  )
}
