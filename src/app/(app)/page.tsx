import Link from "next/link"
import { redirect } from "next/navigation"
import {
  addDays,
  addMonths,
  format,
  parseISO,
  startOfMonth,
  subDays,
  subMonths,
} from "date-fns"
import { pt } from "date-fns/locale"
import { and, asc, eq, gte, inArray, lt } from "drizzle-orm"
import { ArrowRight, CalendarClock, Euro, FileText, Users } from "lucide-react"

import { db } from "@/db/client"
import {
  cliente,
  orcamento,
  transacaoFinanceira,
  visita,
  type Visita,
} from "@/db/schema"
import type { CategoriaServico } from "@/lib/constants/enums"
import { isSuperAdmin, requireEmpresa } from "@/lib/auth"
import { temModuloAtual } from "@/lib/modulos"
import { MODULOS, rotulosServico } from "@/lib/constants/modulos"
import { hojeKey } from "@/lib/agenda"
import {
  chaveDia,
  formatData,
  formatDiaExtenso,
  formatHora,
} from "@/lib/formatters/date"
import { formatEuro } from "@/lib/formatters/currency"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "@/components/common/stat-card"
import { CategoriaChip } from "@/components/visitas/categoria-chip"
import { EstadoVisitaBadge } from "@/components/visitas/estado-badge"
import { FaturacaoChart } from "@/components/dashboard/faturacao-chart"

export const metadata = { title: "Início" }

type VisitaRow = Visita & {
  cliente: { nome: string } | null
  servicos: { categoria: CategoriaServico }[]
}

export default async function DashboardPage() {
  const { empresaId, email } = await requireEmpresa()
  // O dono da plataforma não usa a app de negócio — vai para o painel de controlo.
  if (isSuperAdmin(email)) redirect("/admin")
  const r = rotulosServico(await temModuloAtual(MODULOS.ORDENS_SERVICO))
  const hoje = hojeKey()
  const inicioMes = `${hoje.slice(0, 7)}-01`
  const fimMes = format(addMonths(parseISO(inicioMes), 1), "yyyy-MM-dd")
  const seisMesesAtras = format(
    startOfMonth(subMonths(parseISO(inicioMes), 5)),
    "yyyy-MM-dd"
  )
  const janelaIni = subDays(parseISO(hoje), 1)
  const janelaFim = addDays(parseISO(hoje), 2)

  const [entradasMes, nClientes, nOrcPendentes, janela, proxima, entradas6m] =
    await Promise.all([
      db
        .select({ valor: transacaoFinanceira.valor })
        .from(transacaoFinanceira)
        .where(
          and(
            eq(transacaoFinanceira.empresaId, empresaId),
            eq(transacaoFinanceira.tipo, "ENTRADA"),
            gte(transacaoFinanceira.data, inicioMes),
            lt(transacaoFinanceira.data, fimMes)
          )
        ),
      db.$count(cliente, eq(cliente.empresaId, empresaId)),
      db.$count(
        orcamento,
        and(
          eq(orcamento.empresaId, empresaId),
          inArray(orcamento.estado, ["RASCUNHO", "ENVIADO"])
        )
      ),
      db.query.visita.findMany({
        where: and(
          eq(visita.empresaId, empresaId),
          gte(visita.agendadoPara, janelaIni),
          lt(visita.agendadoPara, janelaFim)
        ),
        with: {
          cliente: { columns: { nome: true } },
          servicos: { columns: { categoria: true } },
        },
        orderBy: [asc(visita.agendadoPara)],
      }),
      db.query.visita.findFirst({
        where: and(
          eq(visita.empresaId, empresaId),
          gte(visita.agendadoPara, new Date()),
          eq(visita.estado, "AGENDADO")
        ),
        with: {
          cliente: { columns: { nome: true } },
          servicos: { columns: { categoria: true } },
        },
        orderBy: [asc(visita.agendadoPara)],
      }),
      db
        .select({ data: transacaoFinanceira.data, valor: transacaoFinanceira.valor })
        .from(transacaoFinanceira)
        .where(
          and(
            eq(transacaoFinanceira.empresaId, empresaId),
            eq(transacaoFinanceira.tipo, "ENTRADA"),
            gte(transacaoFinanceira.data, seisMesesAtras)
          )
        ),
    ])

  const faturacaoMes = entradasMes.reduce((s, t) => s + Number(t.valor), 0)
  const visitasHoje = (janela as VisitaRow[]).filter(
    (v) => chaveDia(v.agendadoPara) === hoje
  )
  const prox = proxima as VisitaRow | undefined

  const chart: { mes: string; total: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = subMonths(parseISO(inicioMes), i)
    const key = format(d, "yyyy-MM")
    const total = entradas6m
      .filter((t) => t.data.slice(0, 7) === key)
      .reduce((s, t) => s + Number(t.valor), 0)
    chart.push({ mes: format(d, "LLL", { locale: pt }), total })
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Olá! 👋</h2>
        <p className="text-muted-foreground mt-1 capitalize">
          {formatDiaExtenso(new Date())}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Faturação do mês"
          value={formatEuro(faturacaoMes)}
          icon={Euro}
          accent="text-emerald-600"
          href="/financeiro"
        />
        <StatCard
          label={r.hoje}
          value={String(visitasHoje.length)}
          icon={CalendarClock}
          href="/agenda?view=dia"
        />
        <StatCard
          label="Orçamentos pendentes"
          value={String(nOrcPendentes)}
          icon={FileText}
          href="/orcamentos"
        />
        <StatCard
          label="Clientes"
          value={String(nClientes)}
          icon={Users}
          href="/clientes"
        />
      </div>

      {prox && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="flex items-center gap-3">
            <CategoriaChip categoria={prox.servicos[0]?.categoria ?? "OUTROS"} />
            <div className="min-w-0 flex-1">
              <p className="text-muted-foreground text-xs">{r.proximo}</p>
              <Link
                href={`/visitas/${prox.id}`}
                className="block truncate font-medium"
              >
                {prox.titulo || `${r.Singular} #${prox.numero}`}
              </Link>
              <p className="text-muted-foreground truncate text-sm">
                {prox.cliente?.nome} · {formatData(prox.agendadoPara)} às{" "}
                {formatHora(prox.agendadoPara)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Hoje</CardTitle>
            <Link
              href="/agenda?view=dia"
              className="text-primary inline-flex items-center gap-1 text-sm"
            >
              Agenda <ArrowRight className="size-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            {visitasHoje.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-sm">
                {r.semHoje}
              </p>
            ) : (
              <div className="divide-y">
                {visitasHoje.map((v) => (
                  <Link
                    key={v.id}
                    href={`/visitas/${v.id}`}
                    className="flex items-center gap-3 py-2.5"
                  >
                    <span className="text-muted-foreground w-12 shrink-0 text-sm font-medium">
                      {formatHora(v.agendadoPara)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {v.titulo || `${r.Singular} #${v.numero}`}
                      </p>
                      <p className="text-muted-foreground truncate text-sm">
                        {v.cliente?.nome ?? "—"}
                      </p>
                    </div>
                    <EstadoVisitaBadge estado={v.estado} />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Faturação (últimos 6 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <FaturacaoChart data={chart} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
