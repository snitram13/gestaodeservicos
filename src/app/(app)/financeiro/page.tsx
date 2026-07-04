import Link from "next/link"
import { addMonths, format, parseISO, subMonths } from "date-fns"
import { pt } from "date-fns/locale"
import { and, desc, eq, gte, isNotNull, lt } from "drizzle-orm"
import {
  ChevronLeft,
  ChevronRight,
  Euro,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react"

import { db } from "@/db/client"
import { transacaoFinanceira, visita } from "@/db/schema"
import { requireEmpresa } from "@/lib/auth"
import { hojeKey } from "@/lib/agenda"
import { cn } from "@/lib/utils"
import { formatEuro } from "@/lib/formatters/currency"
import { buttonVariants } from "@/components/ui/button"
import { EmptyState } from "@/components/common/empty-state"
import { PageHeader } from "@/components/common/page-header"
import { StatCard } from "@/components/common/stat-card"
import { NovaTransacaoDialog } from "@/components/financeiro/nova-transacao-dialog"
import { TransacoesList } from "@/components/financeiro/transacoes-list"

export const metadata = { title: "Financeiro" }

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>
}) {
  const { empresaId } = await requireEmpresa()
  const { mes } = await searchParams
  const mesAtual = mes && /^\d{4}-\d{2}$/.test(mes) ? mes : hojeKey().slice(0, 7)
  const inicio = `${mesAtual}-01`
  const fim = format(addMonths(parseISO(inicio), 1), "yyyy-MM-dd")

  const txMes = await db
    .select()
    .from(transacaoFinanceira)
    .where(
      and(
        eq(transacaoFinanceira.empresaId, empresaId),
        gte(transacaoFinanceira.data, inicio),
        lt(transacaoFinanceira.data, fim)
      )
    )
    .orderBy(desc(transacaoFinanceira.data))

  const receita = txMes
    .filter((t) => t.tipo === "ENTRADA")
    .reduce((s, t) => s + Number(t.valor), 0)
  const despesas = txMes
    .filter((t) => t.tipo === "SAIDA")
    .reduce((s, t) => s + Number(t.valor), 0)

  // A receber: serviços concluídos sem pagamento associado
  const [concluidas, pagasRows] = await Promise.all([
    db
      .select({ id: visita.id, valor: visita.valor })
      .from(visita)
      .where(
        and(
          eq(visita.empresaId, empresaId),
          eq(visita.estado, "CONCLUIDO")
        )
      ),
    db
      .selectDistinct({ visitaId: transacaoFinanceira.visitaId })
      .from(transacaoFinanceira)
      .where(
        and(
          eq(transacaoFinanceira.empresaId, empresaId),
          eq(transacaoFinanceira.tipo, "ENTRADA"),
          isNotNull(transacaoFinanceira.visitaId)
        )
      ),
  ])
  const pagas = new Set(pagasRows.map((r) => r.visitaId))
  const aReceber = concluidas
    .filter((v) => !pagas.has(v.id))
    .reduce((sum, v) => sum + Number(v.valor), 0)

  const prev = format(subMonths(parseISO(inicio), 1), "yyyy-MM")
  const next = format(addMonths(parseISO(inicio), 1), "yyyy-MM")
  const label = format(parseISO(inicio), "MMMM 'de' yyyy", { locale: pt })

  return (
    <div className="space-y-4">
      <PageHeader title="Financeiro">
        <NovaTransacaoDialog />
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Receita do mês"
          value={formatEuro(receita)}
          icon={TrendingUp}
          accent="text-emerald-600"
        />
        <StatCard
          label="Despesas do mês"
          value={formatEuro(despesas)}
          icon={TrendingDown}
          accent="text-red-600"
        />
        <StatCard
          label="Saldo do mês"
          value={formatEuro(receita - despesas)}
          icon={Wallet}
        />
        <StatCard
          label="A receber"
          value={formatEuro(aReceber)}
          icon={Euro}
          hint="Serviços concluídos por cobrar"
        />
      </div>

      <div className="flex items-center gap-2">
        <Link
          href={`/financeiro?mes=${prev}`}
          className={cn(buttonVariants({ variant: "outline", size: "icon" }))}
          aria-label="Mês anterior"
        >
          <ChevronLeft className="size-4" />
        </Link>
        <Link
          href={`/financeiro?mes=${next}`}
          className={cn(buttonVariants({ variant: "outline", size: "icon" }))}
          aria-label="Mês seguinte"
        >
          <ChevronRight className="size-4" />
        </Link>
        <span className="font-medium capitalize">{label}</span>
      </div>

      {txMes.length === 0 ? (
        <EmptyState
          icon={Euro}
          title="Sem transações neste mês"
          description="Registe a primeira entrada ou saída."
        >
          <NovaTransacaoDialog />
        </EmptyState>
      ) : (
        <TransacoesList transacoes={txMes} />
      )}
    </div>
  )
}
