import Link from "next/link"
import { desc, eq } from "drizzle-orm"
import { FileText, Plus } from "lucide-react"

import { db } from "@/db/client"
import { orcamento, type Orcamento } from "@/db/schema"
import { requireEmpresa } from "@/lib/auth"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { EmptyState } from "@/components/common/empty-state"
import { PageHeader } from "@/components/common/page-header"
import { OrcamentosList } from "@/components/orcamentos/orcamentos-list"

export const metadata = { title: "Orçamentos" }

type Row = Orcamento & { cliente: { nome: string } | null }

export default async function OrcamentosPage() {
  const { empresaId } = await requireEmpresa()
  const orcamentos = (await db.query.orcamento.findMany({
    where: eq(orcamento.empresaId, empresaId),
    with: { cliente: { columns: { nome: true } } },
    orderBy: [desc(orcamento.criadoEm)],
  })) as Row[]

  return (
    <div className="space-y-4">
      <PageHeader
        title="Orçamentos"
        description={`${orcamentos.length} orçamento(s)`}
      >
        <Link
          href="/orcamentos/novo"
          className={cn(buttonVariants(), "h-10 gap-1.5")}
        >
          <Plus className="size-4" />
          Novo
        </Link>
      </PageHeader>

      {orcamentos.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Ainda não há orçamentos"
          description="Crie um orçamento com linhas de item e gere um PDF para enviar ao cliente."
        >
          <Link
            href="/orcamentos/novo"
            className={cn(buttonVariants(), "gap-1.5")}
          >
            <Plus className="size-4" />
            Novo orçamento
          </Link>
        </EmptyState>
      ) : (
        <OrcamentosList orcamentos={orcamentos} />
      )}
    </div>
  )
}
