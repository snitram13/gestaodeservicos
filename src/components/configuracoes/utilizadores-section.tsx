import { eq } from "drizzle-orm"

import { db } from "@/db/client"
import { utilizador } from "@/db/schema"
import { podeGerir, requireEmpresa } from "@/lib/auth"
import type { RoleUtilizador } from "@/lib/constants/enums"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  NovoFuncionarioDialog,
  UtilizadorAcoes,
} from "@/components/configuracoes/utilizadores-client"

const ROLE_LABEL: Record<RoleUtilizador, string> = {
  OWNER: "Proprietário",
  ADMIN: "Administrador",
  TECNICO: "Técnico",
}

function roleVariant(
  role: RoleUtilizador
): "default" | "secondary" | "outline" {
  if (role === "OWNER") return "default"
  if (role === "ADMIN") return "secondary"
  return "outline"
}

/**
 * Secção "Utilizadores" das Definições. Só é visível a quem pode gerir a
 * empresa (OWNER/ADMIN); os dados são sempre da empresa do contexto.
 */
export async function UtilizadoresSection() {
  const { empresaId, role, userId } = await requireEmpresa()
  if (!podeGerir(role)) return null

  const utilizadores = await db.query.utilizador.findMany({
    where: eq(utilizador.empresaId, empresaId),
    orderBy: (u, { asc }) => [asc(u.nome)],
    columns: {
      id: true,
      nome: true,
      email: true,
      role: true,
      ativo: true,
      corAgenda: true,
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Utilizadores</CardTitle>
        <CardDescription>
          Funcionários com acesso à aplicação desta empresa.
        </CardDescription>
        <CardAction>
          <NovoFuncionarioDialog />
        </CardAction>
      </CardHeader>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Cargo</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Cor</TableHead>
            <TableHead className="pr-4 text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {utilizadores.map((u) => (
            <TableRow key={u.id}>
              <TableCell className="pl-4 font-medium">
                {u.nome}
                {u.id === userId && (
                  <span className="text-muted-foreground"> (você)</span>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">{u.email}</TableCell>
              <TableCell>
                <Badge variant={roleVariant(u.role)}>{ROLE_LABEL[u.role]}</Badge>
              </TableCell>
              <TableCell>
                {u.ativo ? (
                  <Badge variant="secondary">Ativo</Badge>
                ) : (
                  <Badge variant="outline">Inativo</Badge>
                )}
              </TableCell>
              <TableCell>
                {u.corAgenda ? (
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="size-4 rounded-full ring-1 ring-foreground/10"
                      style={{ backgroundColor: u.corAgenda }}
                    />
                    <span className="text-muted-foreground text-xs">
                      {u.corAgenda}
                    </span>
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="pr-4 text-right">
                <UtilizadorAcoes
                  item={{
                    id: u.id,
                    nome: u.nome,
                    email: u.email,
                    role: u.role,
                    ativo: u.ativo,
                    corAgenda: u.corAgenda,
                  }}
                  isSelf={u.id === userId}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
