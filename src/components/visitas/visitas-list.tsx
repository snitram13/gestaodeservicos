import Link from "next/link"
import { ChevronRight } from "lucide-react"

import type { CategoriaServico } from "@/lib/constants/enums"
import type { Visita } from "@/db/schema"
import { formatData, formatHora } from "@/lib/formatters/date"
import { formatEuro } from "@/lib/formatters/currency"
import { rotulosServico } from "@/lib/constants/modulos"
import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CategoriaChip } from "./categoria-chip"
import { EstadoVisitaBadge } from "./estado-badge"

type Row = Visita & {
  cliente: { nome: string } | null
  tecnico: { nome: string } | null
  servicos: { categoria: CategoriaServico }[]
}

function categoriaPrincipal(v: Row): CategoriaServico {
  return v.servicos[0]?.categoria ?? "OUTROS"
}

export function VisitasList({
  visitas,
  temServicos,
}: {
  visitas: Row[]
  temServicos?: boolean
}) {
  const r = rotulosServico(!!temServicos)
  const rotulo = (v: Row) => v.titulo || `${r.Singular} #${v.numero}`
  return (
    <>
      {/* Telemóvel */}
      <div className="grid gap-2 md:hidden">
        {visitas.map((v) => (
          <Link key={v.id} href={`/visitas/${v.id}`}>
            <Card className="gap-0 p-3">
              <div className="flex items-center gap-3">
                <CategoriaChip categoria={categoriaPrincipal(v)} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{rotulo(v)}</p>
                  <p className="text-muted-foreground truncate text-sm">
                    {v.cliente?.nome ?? "—"} · {formatData(v.agendadoPara)},{" "}
                    {formatHora(v.agendadoPara)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <EstadoVisitaBadge estado={v.estado} />
                  <span className="text-sm font-medium">
                    {formatEuro(v.valor)}
                  </span>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Computador */}
      <Card className="hidden gap-0 overflow-hidden p-0 md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{r.Singular}</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Serviços</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visitas.map((v) => (
              <TableRow key={v.id}>
                <TableCell>
                  <Link
                    href={`/visitas/${v.id}`}
                    className="flex items-center gap-2 font-medium"
                  >
                    <CategoriaChip categoria={categoriaPrincipal(v)} />
                    {rotulo(v)}
                  </Link>
                </TableCell>
                <TableCell>
                  {v.cliente?.nome ?? "—"}
                  {v.tecnico?.nome && (
                    <span className="text-muted-foreground block text-xs">
                      {v.tecnico.nome}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {formatData(v.agendadoPara)}, {formatHora(v.agendadoPara)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {v.servicos.length}
                </TableCell>
                <TableCell>
                  <EstadoVisitaBadge estado={v.estado} />
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatEuro(v.valor)}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/visitas/${v.id}`}
                    className="text-muted-foreground inline-flex"
                    aria-label="Ver"
                  >
                    <ChevronRight className="size-4" />
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  )
}
