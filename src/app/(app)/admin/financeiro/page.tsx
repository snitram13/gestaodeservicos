import Link from "next/link"
import { format, parseISO, startOfMonth, subMonths } from "date-fns"
import { pt } from "date-fns/locale"
import { desc } from "drizzle-orm"
import { TrendingUp, Wallet } from "lucide-react"

import { db } from "@/db/client"
import { empresa, pagamento } from "@/db/schema"
import { requireSuperAdmin } from "@/lib/auth"
import { estadoAcesso, mensalidadeDe } from "@/lib/subscricao"
import { contarFuncionariosDe } from "@/lib/funcionarios"
import { hojeKey } from "@/lib/agenda"
import { formatData } from "@/lib/formatters/date"
import { formatEuro } from "@/lib/formatters/currency"
import { PageHeader } from "@/components/common/page-header"
import { StatCard } from "@/components/common/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { FaturacaoChart } from "@/components/dashboard/faturacao-chart"

export const metadata = { title: "Financeiro" }

/** Financeiro do aluguer: quanto o dono da plataforma recebe dos clientes. */
export default async function AdminFinanceiroPage() {
  const ctx = await requireSuperAdmin()

  const [pagamentos, empresas] = await Promise.all([
    db.query.pagamento.findMany({
      orderBy: [desc(pagamento.data), desc(pagamento.criadoEm)],
      with: { empresa: { columns: { nome: true } } },
    }),
    db.query.empresa.findMany({
      columns: { id: true, ativo: true, acessoAte: true },
      with: { utilizadores: { columns: { role: true, ativo: true } } },
    }),
  ])

  const mesAtual = hojeKey().slice(0, 7)
  const recebidoTotal = pagamentos.reduce((s, p) => s + Number(p.valor), 0)
  const recebidoMes = pagamentos
    .filter((p) => p.data.slice(0, 7) === mesAtual)
    .reduce((s, p) => s + Number(p.valor), 0)

  const clientesAtivos = empresas.filter(
    (e) =>
      e.id !== ctx.empresaId &&
      e.ativo &&
      estadoAcesso(e.acessoAte).estado !== "expirado"
  )
  const mrr = clientesAtivos.reduce(
    (s, e) => s + mensalidadeDe(contarFuncionariosDe(e.utilizadores)),
    0
  )

  // Gráfico dos últimos 6 meses.
  const inicioMes = `${mesAtual}-01`
  const chart: { mes: string; total: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = startOfMonth(subMonths(parseISO(inicioMes), i))
    const key = format(d, "yyyy-MM")
    const total = pagamentos
      .filter((p) => p.data.slice(0, 7) === key)
      .reduce((s, p) => s + Number(p.valor), 0)
    chart.push({ mes: format(d, "LLL", { locale: pt }), total })
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Financeiro" description="Mensalidades recebidas dos teus clientes" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard
          label="Recebido este mês"
          value={formatEuro(recebidoMes)}
          icon={Wallet}
          accent="text-emerald-600"
        />
        <StatCard label="Recebido total" value={formatEuro(recebidoTotal)} icon={Wallet} />
        <StatCard
          label="Receita mensal estimada"
          value={formatEuro(mrr)}
          hint={`${clientesAtivos.length} clientes ativos`}
          icon={TrendingUp}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recebido (últimos 6 meses)</CardTitle>
        </CardHeader>
        <CardContent>
          <FaturacaoChart data={chart} />
        </CardContent>
      </Card>

      <Card className="p-0">
        <CardHeader className="px-4 pt-4">
          <CardTitle>Pagamentos recentes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="pr-4 text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagamentos.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-muted-foreground py-8 text-center"
                  >
                    Ainda não há pagamentos registados.
                  </TableCell>
                </TableRow>
              ) : (
                pagamentos.slice(0, 50).map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="pl-4 font-medium">
                      {formatData(p.data)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <Link
                        href={`/admin/${p.empresaId}`}
                        className="hover:underline"
                      >
                        {p.empresa?.nome ?? "—"}
                      </Link>
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      {formatEuro(p.valor)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
