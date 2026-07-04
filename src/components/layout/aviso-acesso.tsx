import { TriangleAlert } from "lucide-react"

import { getEmpresaAtual } from "@/lib/configuracao"
import { contarFuncionarios } from "@/lib/funcionarios"
import { estadoAcesso, mensalidadeDe } from "@/lib/subscricao"
import { AVISO_DIAS } from "@/lib/constants/subscricao"
import { formatEuro } from "@/lib/formatters/currency"

/**
 * Faixa de aviso mostrada no topo da app quando faltam poucos dias de acesso
 * (fim do período gratuito ou da mensalidade). Empresas ilimitadas (ex.: a do
 * super-admin) não veem nada. Empresas já expiradas nem chegam aqui (são
 * redirecionadas para /suspenso por `requireEmpresa`).
 */
export async function AvisoAcesso() {
  const emp = await getEmpresaAtual()
  const est = estadoAcesso(emp.acessoAte)

  if (
    est.estado !== "ativo" ||
    est.diasRestantes == null ||
    est.diasRestantes > AVISO_DIAS
  ) {
    return null
  }

  const dias = est.diasRestantes
  const quando = dias === 1 ? "amanhã" : `dentro de ${dias} dias`
  // Mensalidade real = base + funcionários ativos × 4,99.
  const valor = mensalidadeDe(await contarFuncionarios(emp.id))

  return (
    <div className="mb-4 flex items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-200">
      <TriangleAlert className="mt-0.5 size-5 shrink-0" />
      <p>
        O seu acesso à aplicação termina <strong>{quando}</strong>. Para
        continuar, contacte o administrador do sistema e regularize a
        mensalidade de <strong>{formatEuro(valor)}/mês</strong>.
      </p>
    </div>
  )
}
