import Link from "next/link"
import { notFound } from "next/navigation"
import { eq } from "drizzle-orm"
import { ArrowLeft, FileText, MessageCircle, Pencil } from "lucide-react"

import { db } from "@/db/client"
import { visita } from "@/db/schema"
import { CATEGORIA_META } from "@/lib/constants/categorias"
import { cn } from "@/lib/utils"
import { formatEuro } from "@/lib/formatters/currency"
import { formatData, formatHora } from "@/lib/formatters/date"
import { waLink } from "@/lib/whatsapp"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CategoriaChip } from "@/components/visitas/categoria-chip"
import { DeleteVisitaButton } from "@/components/visitas/delete-visita-button"
import { EstadoVisitaSelect } from "@/components/visitas/estado-select"
import { EstadoOrcamentoBadge } from "@/components/orcamentos/estado-badge"
import { RegistarPagamentoButton } from "@/components/financeiro/registar-pagamento-button"

export default async function VisitaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const v = await db.query.visita.findFirst({
    where: eq(visita.id, id),
    with: { cliente: true, servicos: true, orcamentos: true },
  })
  if (!v) notFound()

  const servicos = [...v.servicos].sort((a, b) => a.ordem - b.ordem)
  const totalServicos = servicos.reduce((s, x) => s + Number(x.valor), 0)
  const rotulo = v.titulo || `Visita #${v.numero}`

  return (
    <div className="space-y-4">
      <Link
        href="/visitas"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" />
        Visitas
      </Link>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-2xl font-semibold tracking-tight">
            {rotulo}
          </h2>
          <p className="text-muted-foreground">
            #{v.numero}
            {v.cliente && (
              <>
                {" · "}
                <Link
                  href={`/clientes/${v.clienteId}`}
                  className="text-primary hover:underline"
                >
                  {v.cliente.nome}
                </Link>
              </>
            )}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            href={`/visitas/${id}/editar`}
            className={cn(buttonVariants({ variant: "outline", size: "icon" }))}
            aria-label="Editar"
          >
            <Pencil className="size-4" />
          </Link>
          <DeleteVisitaButton id={id} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <EstadoVisitaSelect id={id} estado={v.estado} />
        {v.cliente && (
          <a
            href={waLink(
              v.cliente.telefone,
              `Olá ${v.cliente.nome}, sobre a visita de ${formatData(v.agendadoPara)}: `
            )}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "outline" }), "h-9 gap-1.5")}
          >
            <MessageCircle className="size-4" />
            WhatsApp
          </a>
        )}
        <Link
          href={`/orcamentos/novo?visita=${id}`}
          className={cn(buttonVariants({ variant: "outline" }), "h-9 gap-1.5")}
        >
          <FileText className="size-4" />
          Criar orçamento
        </Link>
        {v.estado === "CONCLUIDO" && (
          <RegistarPagamentoButton visitaId={id} valorSugerido={v.valor} />
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Serviços ({servicos.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {servicos.map((s) => (
              <div key={s.id} className="flex items-center gap-3">
                <CategoriaChip categoria={s.categoria} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{s.titulo}</p>
                  <p className="text-muted-foreground truncate text-sm">
                    {CATEGORIA_META[s.categoria].label}
                    {s.descricao ? ` · ${s.descricao}` : ""}
                  </p>
                </div>
                <span className="font-medium">{formatEuro(s.valor)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Valores</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Serviços</span>
              <span>{formatEuro(totalServicos)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Deslocação</span>
              <span>{formatEuro(v.deslocacao)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between border-t pt-2">
              <span className="font-medium">Total</span>
              <span className="text-lg font-semibold">{formatEuro(v.valor)}</span>
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              {formatData(v.agendadoPara)} às {formatHora(v.agendadoPara)}
              {Number(v.kmPercorridos) > 0 ? ` · ${v.kmPercorridos} km` : ""}
            </p>
          </CardContent>
        </Card>
      </div>

      {v.orcamentos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Orçamentos associados</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {v.orcamentos.map((o) => (
                <Link
                  key={o.id}
                  href={`/orcamentos/${o.id}`}
                  className="hover:bg-muted/50 flex items-center gap-3 px-4 py-3"
                >
                  <FileText className="text-muted-foreground size-4 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{o.titulo}</p>
                    <p className="text-muted-foreground text-sm">#{o.numero}</p>
                  </div>
                  <EstadoOrcamentoBadge estado={o.estado} />
                  <span className="text-sm font-medium">{formatEuro(o.total)}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {v.descricao && (
        <Card>
          <CardContent>
            <p className="text-muted-foreground text-xs">Notas</p>
            <p className="mt-0.5 whitespace-pre-wrap text-sm">{v.descricao}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
