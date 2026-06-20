import Link from "next/link"
import { notFound } from "next/navigation"
import { desc, eq } from "drizzle-orm"
import { ArrowLeft, FileText, Pencil, Wrench } from "lucide-react"

import { db } from "@/db/client"
import { cliente, orcamento, visita } from "@/db/schema"
import { cn } from "@/lib/utils"
import { formatData } from "@/lib/formatters/date"
import { formatEuro } from "@/lib/formatters/currency"
import { formatTelefone } from "@/lib/formatters/phone"
import { buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { ClienteQuickActions } from "@/components/clientes/cliente-quick-actions"
import { DeleteClienteButton } from "@/components/clientes/delete-cliente-button"
import { EstadoVisitaBadge } from "@/components/visitas/estado-badge"
import { EstadoOrcamentoBadge } from "@/components/orcamentos/estado-badge"

export default async function ClienteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const c = await db.query.cliente.findFirst({ where: eq(cliente.id, id) })
  if (!c) notFound()

  const [visitas, orcamentos] = await Promise.all([
    db.query.visita.findMany({
      where: eq(visita.clienteId, id),
      orderBy: [desc(visita.agendadoPara)],
    }),
    db.query.orcamento.findMany({
      where: eq(orcamento.clienteId, id),
      orderBy: [desc(orcamento.criadoEm)],
    }),
  ])

  return (
    <div className="space-y-4">
      <Link
        href="/clientes"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" />
        Clientes
      </Link>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-2xl font-semibold tracking-tight">
            {c.nome}
          </h2>
          <p className="text-muted-foreground">
            {formatTelefone(c.telefone)}
            {c.cidade ? ` · ${c.cidade}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            href={`/clientes/${id}/editar`}
            className={cn(buttonVariants({ variant: "outline", size: "icon" }))}
            aria-label="Editar"
          >
            <Pencil className="size-4" />
          </Link>
          <DeleteClienteButton id={id} nome={c.nome} />
        </div>
      </div>

      <ClienteQuickActions cliente={c} />

      <Tabs defaultValue="visitas" className="mt-2">
        <TabsList className="w-full">
          <TabsTrigger value="visitas">Visitas ({visitas.length})</TabsTrigger>
          <TabsTrigger value="orcamentos">
            Orçamentos ({orcamentos.length})
          </TabsTrigger>
          <TabsTrigger value="info">Info</TabsTrigger>
        </TabsList>

        <TabsContent value="visitas">
          {visitas.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              Ainda não há visitas para este cliente.
            </p>
          ) : (
            <Card className="gap-0 overflow-hidden p-0">
              {visitas.map((v, i) => (
                <Link
                  key={v.id}
                  href={`/visitas/${v.id}`}
                  className={cn(
                    "hover:bg-muted/50 flex items-center gap-3 p-3",
                    i > 0 && "border-t"
                  )}
                >
                  <Wrench className="text-muted-foreground size-4 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {v.titulo || `Visita #${v.numero}`}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      #{v.numero} · {formatData(v.agendadoPara)}
                    </p>
                  </div>
                  <EstadoVisitaBadge estado={v.estado} />
                  <span className="w-20 text-right text-sm font-medium">
                    {formatEuro(v.valor)}
                  </span>
                </Link>
              ))}
            </Card>
          )}
        </TabsContent>

        <TabsContent value="orcamentos">
          {orcamentos.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              Ainda não há orçamentos para este cliente.
            </p>
          ) : (
            <Card className="gap-0 overflow-hidden p-0">
              {orcamentos.map((o, i) => (
                <Link
                  key={o.id}
                  href={`/orcamentos/${o.id}`}
                  className={cn(
                    "hover:bg-muted/50 flex items-center gap-3 p-3",
                    i > 0 && "border-t"
                  )}
                >
                  <FileText className="text-muted-foreground size-4 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{o.titulo}</p>
                    <p className="text-muted-foreground text-sm">
                      #{o.numero} · {formatData(o.criadoEm)}
                    </p>
                  </div>
                  <EstadoOrcamentoBadge estado={o.estado} />
                  <span className="w-20 text-right text-sm font-medium">
                    {formatEuro(o.total)}
                  </span>
                </Link>
              ))}
            </Card>
          )}
        </TabsContent>

        <TabsContent value="info">
          <Card className="p-4">
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <Info termo="Email" valor={c.email} />
              <Info termo="NIF" valor={c.nif} />
              <Info termo="Morada" valor={c.morada} />
              <Info termo="Código postal" valor={c.codigoPostal} />
              <Info termo="Cidade" valor={c.cidade} />
              <Info termo="Observações" valor={c.notas} full />
            </dl>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function Info({
  termo,
  valor,
  full,
}: {
  termo: string
  valor: string | null
  full?: boolean
}) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <dt className="text-muted-foreground text-xs">{termo}</dt>
      <dd className="mt-0.5 whitespace-pre-wrap">{valor || "—"}</dd>
    </div>
  )
}
