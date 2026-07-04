import { Ban } from "lucide-react"

import { signOut } from "@/actions/auth"
import { getUtilizadorAtual, requireUser } from "@/lib/auth"
import { contarFuncionarios } from "@/lib/funcionarios"
import { mensalidadeDe } from "@/lib/subscricao"
import { formatEuro } from "@/lib/formatters/currency"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export const metadata = { title: "Acesso suspenso" }

/**
 * Ecrã mostrado quando a empresa do utilizador está suspensa (`empresa.ativo =
 * false`) — ex.: mensalidade em falta. Fora do grupo `(app)` de propósito, para
 * não voltar a passar por `requireEmpresa()` (evita ciclo de redireccionamento).
 */
export default async function SuspensoPage() {
  await requireUser()
  // Mensalidade real (base + funcionários ativos × 4,99) para esta empresa.
  const u = await getUtilizadorAtual()
  const valor = mensalidadeDe(u ? await contarFuncionarios(u.empresaId) : 0)

  return (
    <Card className="w-full max-w-sm" size="default">
      <CardHeader className="items-center text-center">
        <div className="bg-destructive/10 text-destructive mx-auto mb-2 flex size-12 items-center justify-center rounded-xl">
          <Ban className="size-6" />
        </div>
        <CardTitle className="text-xl">Acesso suspenso</CardTitle>
        <CardDescription>
          O período de acesso a esta conta terminou. Para voltar a usar a
          aplicação, contacte o administrador do sistema e regularize a
          mensalidade de {formatEuro(valor)}/mês.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={signOut}>
          <Button type="submit" variant="outline" className="h-11 w-full">
            Terminar sessão
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
