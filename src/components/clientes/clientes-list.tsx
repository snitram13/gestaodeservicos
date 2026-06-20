import Link from "next/link"
import { ChevronRight, MessageCircle, Phone } from "lucide-react"

import type { Cliente } from "@/db/schema"
import { cn } from "@/lib/utils"
import { formatTelefone, telLink } from "@/lib/formatters/phone"
import { waLink } from "@/lib/whatsapp"
import { buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function ClientesList({ clientes }: { clientes: Cliente[] }) {
  return (
    <>
      {/* Telemóvel: cartões */}
      <div className="grid gap-2 md:hidden">
        {clientes.map((c) => (
          <Card key={c.id} className="gap-0 p-0">
            <div className="flex items-center gap-2 p-3">
              <Link href={`/clientes/${c.id}`} className="min-w-0 flex-1">
                <p className="truncate font-medium">{c.nome}</p>
                <p className="text-muted-foreground truncate text-sm">
                  {formatTelefone(c.telefone)}
                  {c.cidade ? ` · ${c.cidade}` : ""}
                </p>
              </Link>
              <a
                href={telLink(c.telefone)}
                className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
                aria-label="Ligar"
              >
                <Phone className="size-4" />
              </a>
              <a
                href={waLink(c.telefone)}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
                aria-label="WhatsApp"
              >
                <MessageCircle className="size-4" />
              </a>
            </div>
          </Card>
        ))}
      </div>

      {/* Computador: tabela */}
      <Card className="hidden gap-0 overflow-hidden p-0 md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Cidade</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientes.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">
                  <Link href={`/clientes/${c.id}`} className="block">
                    {c.nome}
                  </Link>
                </TableCell>
                <TableCell>{formatTelefone(c.telefone)}</TableCell>
                <TableCell>{c.cidade ?? "—"}</TableCell>
                <TableCell>
                  <Link
                    href={`/clientes/${c.id}`}
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "icon" })
                    )}
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
