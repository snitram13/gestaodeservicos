import { and, asc, eq } from "drizzle-orm"

import { db } from "@/db/client"
import { cliente, visita } from "@/db/schema"
import { requireEmpresa } from "@/lib/auth"
import { getEmpresaAtual } from "@/lib/configuracao"
import { temModuloAtual } from "@/lib/modulos"
import { MODULOS, rotulosServico } from "@/lib/constants/modulos"
import type {
  OrcamentoFormValues,
  OrcamentoItemValues,
} from "@/lib/validations/orcamento"
import { PageHeader } from "@/components/common/page-header"
import { OrcamentoForm } from "@/components/orcamentos/orcamento-form"

export const metadata = { title: "Novo orçamento" }

export default async function NovoOrcamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string; visita?: string }>
}) {
  const { empresaId } = await requireEmpresa()
  const r = rotulosServico(await temModuloAtual(MODULOS.ORDENS_SERVICO))
  const emp = await getEmpresaAtual()
  const { cliente: clienteId, visita: visitaId } = await searchParams

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

  let prefill: Partial<OrcamentoFormValues> | undefined
  let visitaOrigemId: string | undefined

  // Pré-preencher a partir de uma visita (serviços + deslocação → linhas)
  if (visitaId) {
    const v = await db.query.visita.findFirst({
      where: and(eq(visita.id, visitaId), eq(visita.empresaId, empresaId)),
      with: { servicos: true },
    })
    if (v) {
      const servicos = [...v.servicos].sort((a, b) => a.ordem - b.ordem)
      const itens: OrcamentoItemValues[] = servicos.map((s) => ({
        descricao: s.titulo,
        quantidade: "1",
        precoUnit: s.valor,
      }))
      if (Number(v.deslocacao) > 0)
        itens.push({ descricao: "Deslocação", quantidade: "1", precoUnit: v.deslocacao })
      if (itens.length === 0)
        itens.push({
          descricao: v.titulo ?? `${r.Singular} #${v.numero}`,
          quantidade: "1",
          precoUnit: "0",
        })

      prefill = {
        clienteId: v.clienteId,
        categoria: servicos[0]?.categoria ?? "OUTROS",
        titulo: v.titulo ?? `${r.Singular} #${v.numero}`,
        descricao: v.descricao ?? "",
        itens,
      }
      visitaOrigemId = v.id
    }
  } else if (clienteId) {
    prefill = { clienteId }
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Novo orçamento" />
      <OrcamentoForm
        clientes={clientes}
        prefill={prefill}
        visitaOrigemId={visitaOrigemId}
        taxaIvaPadrao={String(Number(emp.taxaIvaPadrao ?? 23))}
      />
    </div>
  )
}
