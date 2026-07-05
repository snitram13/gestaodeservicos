import Link from "next/link"
import { notFound } from "next/navigation"
import { desc, eq } from "drizzle-orm"
import { ArrowLeft } from "lucide-react"

import { db } from "@/db/client"
import { empresa, pagamento } from "@/db/schema"
import { requireSuperAdmin } from "@/lib/auth"
import { estadoAcesso, mensalidadeDe } from "@/lib/subscricao"
import { contarFuncionariosDe } from "@/lib/funcionarios"
import { diasDesde, rotuloAtividade, usoDeEmpresa } from "@/lib/admin-stats"
import {
  MENSALIDADE_EUR,
  PRECO_FUNCIONARIO_EUR,
} from "@/lib/constants/subscricao"
import { formatData } from "@/lib/formatters/date"
import { formatEuro } from "@/lib/formatters/currency"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "@/components/common/stat-card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  EmpresaAcoes,
  LimiteFuncionariosControl,
} from "@/components/admin/admin-client"

export const metadata = { title: "Cliente" }

export default async function AdminClientePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const ctx = await requireSuperAdmin()

  const emp = await db.query.empresa.findFirst({
    where: eq(empresa.id, id),
    with: {
      utilizadores: {
        columns: { nome: true, email: true, role: true, ativo: true },
      },
    },
  })
  // A própria empresa do super-admin não é um cliente.
  if (!emp || emp.id === ctx.empresaId) notFound()

  const [pagamentos, uso] = await Promise.all([
    db
      .select()
      .from(pagamento)
      .where(eq(pagamento.empresaId, id))
      .orderBy(desc(pagamento.data), desc(pagamento.criadoEm)),
    usoDeEmpresa(id),
  ])

  const totalPago = pagamentos.reduce((s, p) => s + Number(p.valor), 0)
  const est = estadoAcesso(emp.acessoAte)
  const dono = emp.utilizadores.find((u) => u.role === "OWNER")
  const diasAt = diasDesde(uso.ultimaAtividade)
  const parado = diasAt == null || diasAt > 30
  const nFunc = contarFuncionariosDe(emp.utilizadores)
  const mensalidade = mensalidadeDe(nFunc)

  return (
    <div className="space-y-4">
      <Link
        href="/admin"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" />
        Clientes
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-2xl font-semibold tracking-tight">
            {emp.nome}
          </h2>
          <p className="text-muted-foreground truncate">
            {dono ? `${dono.nome} · ${dono.email}` : "—"}
          </p>
        </div>
        <EmpresaAcoes
          item={{
            id: emp.id,
            nome: emp.nome,
            ativo: emp.ativo,
            isMinha: false,
            mensalidade,
          }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Estado"
          value={
            !emp.ativo
              ? "Suspensa"
              : est.estado === "expirado"
                ? "Expirada"
                : est.estado === "ilimitado"
                  ? "Ilimitada"
                  : "Ativa"
          }
          accent={
            !emp.ativo || est.estado === "expirado"
              ? "text-destructive"
              : "text-emerald-600"
          }
        />
        <StatCard
          label="Acesso até"
          value={est.acessoAte ? formatData(est.acessoAte) : "—"}
          hint={
            est.estado === "ativo" && est.diasRestantes != null
              ? `faltam ${est.diasRestantes} dias`
              : undefined
          }
        />
        <StatCard label="Total pago" value={formatEuro(totalPago)} />
        <StatCard label="Pagamentos" value={String(pagamentos.length)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plano e mensalidade</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-1.5 text-sm sm:max-w-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Base (app + dono)</span>
              <span>{formatEuro(MENSALIDADE_EUR)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Funcionários ({nFunc} × {formatEuro(PRECO_FUNCIONARIO_EUR)})
              </span>
              <span>{formatEuro(nFunc * PRECO_FUNCIONARIO_EUR)}</span>
            </div>
            <div className="mt-1 flex justify-between border-t pt-2 font-semibold">
              <span>Mensalidade</span>
              <span>{formatEuro(mensalidade)}</span>
            </div>
          </div>
          <p className="text-muted-foreground text-sm">
            <strong className="text-foreground">{nFunc}</strong> de{" "}
            <strong className="text-foreground">{emp.limiteFuncionarios}</strong>{" "}
            lugares em uso.
          </p>
          <LimiteFuncionariosControl
            empresaId={emp.id}
            limite={emp.limiteFuncionarios}
          />
        </CardContent>
      </Card>

      <div>
        <h3 className="text-muted-foreground mb-2 text-sm font-medium">
          Utilização da app
        </h3>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <StatCard
            label="Última atividade"
            value={rotuloAtividade(uso.ultimaAtividade)}
            hint={parado ? "cliente pouco ativo" : undefined}
            accent={parado ? "text-amber-600" : "text-emerald-600"}
          />
          <StatCard label="Atividade (30 dias)" value={`${uso.visitas30d} visitas`} />
          <StatCard label="Utilizadores" value={String(emp.utilizadores.length)} />
          <StatCard label="Clientes (deles)" value={String(uso.clientes)} />
          <StatCard label="Visitas (total)" value={String(uso.visitas)} />
          <StatCard label="Orçamentos" value={String(uso.orcamentos)} />
        </div>
      </div>

      <Card className="p-0">
        <CardHeader className="px-4 pt-4">
          <CardTitle>Histórico de pagamentos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Data</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="pr-4">Acesso até</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagamentos.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-muted-foreground py-8 text-center"
                  >
                    Sem pagamentos registados. Use “Registar pagamento” quando o
                    cliente pagar.
                  </TableCell>
                </TableRow>
              ) : (
                pagamentos.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="pl-4 font-medium">
                      {formatData(p.data)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatEuro(p.valor)}
                    </TableCell>
                    <TableCell className="text-muted-foreground pr-4">
                      {p.periodoAte ? formatData(p.periodoAte) : "—"}
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
