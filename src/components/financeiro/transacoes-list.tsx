import { ArrowDownLeft, ArrowUpRight } from "lucide-react"

import type { TransacaoFinanceira } from "@/db/schema"
import { cn } from "@/lib/utils"
import { formatData } from "@/lib/formatters/date"
import { formatEuro } from "@/lib/formatters/currency"
import {
  CATEGORIA_TRANSACAO_LABEL,
  METODO_LABEL,
} from "@/lib/constants/financeiro"
import { Card } from "@/components/ui/card"
import { DeleteTransacaoButton } from "./delete-transacao-button"

export function TransacoesList({
  transacoes,
}: {
  transacoes: TransacaoFinanceira[]
}) {
  return (
    <Card className="gap-0 overflow-hidden p-0">
      {transacoes.map((t, i) => {
        const entrada = t.tipo === "ENTRADA"
        return (
          <div
            key={t.id}
            className={cn("flex items-center gap-3 p-3", i > 0 && "border-t")}
          >
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-lg",
                entrada
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-red-100 text-red-700"
              )}
            >
              {entrada ? (
                <ArrowDownLeft className="size-4" />
              ) : (
                <ArrowUpRight className="size-4" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">
                {t.descricao || CATEGORIA_TRANSACAO_LABEL[t.categoria]}
              </p>
              <p className="text-muted-foreground truncate text-sm">
                {formatData(t.data)} · {CATEGORIA_TRANSACAO_LABEL[t.categoria]}
                {t.metodoPagamento ? ` · ${METODO_LABEL[t.metodoPagamento]}` : ""}
              </p>
            </div>
            <span
              className={cn(
                "shrink-0 font-semibold",
                entrada ? "text-emerald-600" : "text-red-600"
              )}
            >
              {entrada ? "+" : "−"}
              {formatEuro(t.valor)}
            </span>
            <DeleteTransacaoButton id={t.id} />
          </div>
        )
      })}
    </Card>
  )
}
