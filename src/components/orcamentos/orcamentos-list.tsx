import Link from "next/link"
import { ChevronRight, FileText } from "lucide-react"

import type { Orcamento } from "@/db/schema"
import { cn } from "@/lib/utils"
import { formatData } from "@/lib/formatters/date"
import { formatEuro } from "@/lib/formatters/currency"
import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EstadoOrcamentoBadge } from "@/components/orcamentos/estado-badge"

type Row = Orcamento & { cliente: { nome: string } | null }

export function OrcamentosList({ orcamentos }: { orcamentos: Row[] }) {
  return (
    <>
      {/* Telemóvel */}
      <div className="grid gap-2 md:hidden">
        {orcamentos.map((o) => (
          <Link key={o.id} href={`/orcamentos/${o.id}`}>
            <Card className="gap-0 p-3">
              <div className="flex items-center gap-3">
                <FileText className="text-muted-foreground size-4 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{o.titulo}</p>
                  <p className="text-muted-foreground truncate text-sm">
                    #{o.numero} · {o.cliente?.nome ?? "—"}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <EstadoOrcamentoBadge estado={o.estado} />
                  <span className="text-sm font-medium">
                    {formatEuro(o.total)}
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
              <TableHead>Nº</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {orcamentos.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="text-muted-foreground">
                  #{o.numero}
                </TableCell>
                <TableCell className="font-medium">
                  <Link href={`/orcamentos/${o.id}`}>{o.titulo}</Link>
                </TableCell>
                <TableCell>{o.cliente?.nome ?? "—"}</TableCell>
                <TableCell>{formatData(o.criadoEm)}</TableCell>
                <TableCell>
                  <EstadoOrcamentoBadge estado={o.estado} />
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatEuro(o.total)}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/orcamentos/${o.id}`}
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
