import { requireSuperAdmin, superAdminEmails } from "@/lib/auth"
import {
  MENSALIDADE_EUR,
  PRECO_FUNCIONARIO_EUR,
  TRIAL_DIAS,
} from "@/lib/constants/subscricao"
import { formatEuro } from "@/lib/formatters/currency"
import { PageHeader } from "@/components/common/page-header"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ContaForm } from "@/components/configuracoes/conta-form"

export const metadata = { title: "Definições" }

/**
 * Definições do super-admin (controlador da plataforma): a sua conta (mudar
 * password) e os parâmetros do aluguer. NÃO mostra a configuração de negócio
 * (empresa/NIF/IBAN/logótipo/utilizadores) — isso é dos clientes.
 */
export default async function AdminDefinicoesPage() {
  const ctx = await requireSuperAdmin()
  const admins = superAdminEmails()

  return (
    <div className="space-y-4">
      <PageHeader
        title="Definições"
        description="A tua conta de administrador e os parâmetros da plataforma."
      />

      <ContaForm email={ctx.email} />

      <Card>
        <CardHeader>
          <CardTitle>Plataforma</CardTitle>
          <CardDescription>
            Parâmetros do aluguer. Para alterar, é preciso mexer na configuração
            do projeto — pede-me e eu ajusto.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:max-w-md">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Mensalidade base</span>
            <span className="font-medium">{formatEuro(MENSALIDADE_EUR)}/mês</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Por funcionário</span>
            <span className="font-medium">
              {formatEuro(PRECO_FUNCIONARIO_EUR)}/mês
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Período gratuito</span>
            <span className="font-medium">{TRIAL_DIAS} dias</span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <span className="text-muted-foreground shrink-0">
              Administradores
            </span>
            <span className="text-right font-medium break-all">
              {admins.length > 0 ? admins.join(", ") : "—"}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
