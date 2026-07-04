import Link from "next/link"
import { notFound } from "next/navigation"
import { and, eq } from "drizzle-orm"
import { ArrowLeft, Download, MessageCircle, Pencil, Wrench } from "lucide-react"

import { db } from "@/db/client"
import { orcamento } from "@/db/schema"
import { requireEmpresa } from "@/lib/auth"
import { temModuloAtual } from "@/lib/modulos"
import { MODULOS, rotulosServico } from "@/lib/constants/modulos"
import { EstadoVisitaBadge } from "@/components/visitas/estado-badge"
import { cn } from "@/lib/utils"
import { formatData } from "@/lib/formatters/date"
import { formatEuro } from "@/lib/formatters/currency"
import { waLink } from "@/lib/whatsapp"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DeleteOrcamentoButton } from "@/components/orcamentos/delete-orcamento-button"
import { EstadoOrcamentoSelect } from "@/components/orcamentos/estado-select"

export default async function OrcamentoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { empresaId } = await requireEmpresa()
  const { id } = await params
  const o = await db.query.orcamento.findFirst({
    where: and(eq(orcamento.id, id), eq(orcamento.empresaId, empresaId)),
    with: { cliente: true, itens: true, visita: true },
  })
  if (!o) notFound()
  const r = rotulosServico(await temModuloAtual(MODULOS.ORDENS_SERVICO))

  const itens = [...o.itens].sort((a, b) => a.ordem - b.ordem)

  const textoWhats = `Olá ${o.cliente?.nome ?? ""}, segue o orçamento "${o.titulo}" no valor de ${formatEuro(o.total)}. Fico a aguardar a sua confirmação. Obrigado!`

  return (
    <div className="space-y-4">
      <Link
        href="/orcamentos"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" />
        Orçamentos
      </Link>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-2xl font-semibold tracking-tight">
            {o.titulo}
          </h2>
          <p className="text-muted-foreground">
            #{o.numero}
            {o.cliente && (
              <>
                {" · "}
                <Link
                  href={`/clientes/${o.clienteId}`}
                  className="text-primary hover:underline"
                >
                  {o.cliente.nome}
                </Link>
              </>
            )}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            href={`/orcamentos/${id}/editar`}
            className={cn(buttonVariants({ variant: "outline", size: "icon" }))}
            aria-label="Editar"
          >
            <Pencil className="size-4" />
          </Link>
          <DeleteOrcamentoButton id={id} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <EstadoOrcamentoSelect id={id} estado={o.estado} />
        <a
          href={`/orcamentos/${id}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ variant: "outline" }), "h-9 gap-1.5")}
        >
          <Download className="size-4" />
          PDF
        </a>
        {o.cliente && (
          <a
            href={waLink(o.cliente.telefone, textoWhats)}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "outline" }), "h-9 gap-1.5")}
          >
            <MessageCircle className="size-4" />
            WhatsApp
          </a>
        )}
        <Link
          href={`/visitas/novo?orcamento=${id}`}
          className={cn(buttonVariants({ variant: "outline" }), "h-9 gap-1.5")}
        >
          <Wrench className="size-4" />
          Criar visita
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Linhas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {itens.map((it) => (
              <div
                key={it.id}
                className="flex items-start justify-between gap-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p>{it.descricao}</p>
                  <p className="text-muted-foreground text-xs">
                    {Number(it.quantidade)} × {formatEuro(it.precoUnit)}
                  </p>
                </div>
                <span className="font-medium">{formatEuro(it.totalLinha)}</span>
              </div>
            ))}
          </div>

          <div className="mt-3 ml-auto grid max-w-xs gap-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatEuro(o.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                IVA ({Number(o.taxaIva)}%)
              </span>
              <span>{formatEuro(o.totalIva)}</span>
            </div>
            <div className="flex justify-between border-t pt-1 text-base font-semibold">
              <span>Total</span>
              <span>{formatEuro(o.total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {o.visita && (
        <Card>
          <CardHeader>
            <CardTitle>{r.associada}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Link
              href={`/visitas/${o.visita.id}`}
              className="hover:bg-muted/50 flex items-center gap-3 px-4 py-3"
            >
              <Wrench className="text-muted-foreground size-4 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {o.visita.titulo || `${r.Singular} #${o.visita.numero}`}
                </p>
                <p className="text-muted-foreground text-sm">
                  #{o.visita.numero} · {formatData(o.visita.agendadoPara)}
                </p>
              </div>
              <EstadoVisitaBadge estado={o.visita.estado} />
            </Link>
          </CardContent>
        </Card>
      )}

      {(o.descricao || o.notas || o.validade) && (
        <Card>
          <CardContent className="grid gap-3 text-sm">
            {o.validade && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Válido até</span>
                <span>{formatData(o.validade)}</span>
              </div>
            )}
            {o.descricao && (
              <div>
                <p className="text-muted-foreground text-xs">Descrição</p>
                <p className="mt-0.5 whitespace-pre-wrap">{o.descricao}</p>
              </div>
            )}
            {o.notas && (
              <div>
                <p className="text-muted-foreground text-xs">Notas</p>
                <p className="mt-0.5 whitespace-pre-wrap">{o.notas}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
