import Link from "next/link"
import { desc } from "drizzle-orm"
import { Building2, TrendingUp, UserCheck, Wallet } from "lucide-react"

import { db } from "@/db/client"
import { empresa, pagamento } from "@/db/schema"
import { requireSuperAdmin } from "@/lib/auth"
import { estadoAcesso, mensalidadeDe } from "@/lib/subscricao"
import { contarFuncionariosDe } from "@/lib/funcionarios"
import { diasDesde, rotuloAtividade, usoPorEmpresa } from "@/lib/admin-stats"
import { AVISO_DIAS } from "@/lib/constants/subscricao"
import { hojeKey } from "@/lib/agenda"
import { cn } from "@/lib/utils"
import { formatData } from "@/lib/formatters/date"
import { formatEuro } from "@/lib/formatters/currency"
import { PageHeader } from "@/components/common/page-header"
import { StatCard } from "@/components/common/stat-card"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EmpresaAcoes, NovoClienteDialog } from "@/components/admin/admin-client"

export const metadata = { title: "Painel" }

/**
 * Painel do controlador da plataforma (super-admin): visão geral dos clientes,
 * KPIs financeiros (mensalidade = base + funcionários) e utilização.
 */
export default async function AdminPage() {
  const ctx = await requireSuperAdmin()

  const [empresas, pagamentos, usos] = await Promise.all([
    db.query.empresa.findMany({
      orderBy: [desc(empresa.criadoEm)],
      with: { utilizadores: { columns: { role: true, ativo: true } } },
    }),
    db
      .select({ data: pagamento.data, valor: pagamento.valor })
      .from(pagamento),
    usoPorEmpresa(),
  ])

  const mesAtual = hojeKey().slice(0, 7)
  const recebidoMes = pagamentos
    .filter((p) => p.data.slice(0, 7) === mesAtual)
    .reduce((s, p) => s + Number(p.valor), 0)

  const clientes = empresas.filter((e) => e.id !== ctx.empresaId)
  const mensalidadePorEmpresa = new Map<string, number>()
  for (const e of clientes) {
    mensalidadePorEmpresa.set(
      e.id,
      mensalidadeDe(contarFuncionariosDe(e.utilizadores))
    )
  }
  const ativos = clientes.filter(
    (e) => e.ativo && estadoAcesso(e.acessoAte).estado !== "expirado"
  )
  const mrr = ativos.reduce(
    (s, e) => s + (mensalidadePorEmpresa.get(e.id) ?? 0),
    0
  )

  return (
    <div className="space-y-5">
      <PageHeader
        title="Painel"
        description="Os teus clientes: financeiro e utilização"
      >
        <NovoClienteDialog />
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Clientes" value={String(clientes.length)} icon={Building2} />
        <StatCard
          label="Com acesso"
          value={String(ativos.length)}
          icon={UserCheck}
          accent="text-emerald-600"
        />
        <StatCard
          label="Receita mensal"
          value={formatEuro(mrr)}
          hint="estimada (clientes ativos)"
          icon={TrendingUp}
        />
        <StatCard
          label="Recebido este mês"
          value={formatEuro(recebidoMes)}
          icon={Wallet}
          accent="text-emerald-600"
          href="/admin/financeiro"
        />
      </div>

      <Card className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Empresa</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Última atividade</TableHead>
              <TableHead>Acesso até</TableHead>
              <TableHead className="text-right">Mensalidade</TableHead>
              <TableHead className="pr-4 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientes.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-muted-foreground py-8 text-center"
                >
                  Ainda não tens clientes. Cria o primeiro com “Novo cliente”.
                </TableCell>
              </TableRow>
            ) : (
              clientes.map((e) => {
                const est = estadoAcesso(e.acessoAte)
                const uso = usos.get(e.id) ?? null
                const diasAt = diasDesde(uso?.ultimaAtividade ?? null)
                const parado = diasAt == null || diasAt > 30
                return (
                  <TableRow key={e.id}>
                    <TableCell className="pl-4 font-medium">
                      <Link href={`/admin/${e.id}`} className="hover:underline">
                        {e.nome}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {!e.ativo ? (
                        <Badge variant="destructive">Suspensa</Badge>
                      ) : est.estado === "expirado" ? (
                        <Badge variant="destructive">Expirada</Badge>
                      ) : est.estado === "ilimitado" ? (
                        <Badge variant="outline">Ilimitada</Badge>
                      ) : est.diasRestantes != null &&
                        est.diasRestantes <= AVISO_DIAS ? (
                        <Badge variant="outline" className="text-amber-600">
                          Termina em {est.diasRestantes}d
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Ativa</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "text-sm",
                          parado ? "text-amber-600" : "text-muted-foreground"
                        )}
                      >
                        {rotuloAtividade(uso?.ultimaAtividade ?? null)}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {est.acessoAte ? formatData(est.acessoAte) : "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatEuro(mensalidadePorEmpresa.get(e.id) ?? 0)}
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <EmpresaAcoes
                        item={{
                          id: e.id,
                          nome: e.nome,
                          ativo: e.ativo,
                          isMinha: false,
                          mensalidade: mensalidadePorEmpresa.get(e.id) ?? 0,
                        }}
                      />
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
