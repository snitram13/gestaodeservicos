"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import { definirIdioma } from "@/actions/idioma"
import { IDIOMAS, IDIOMAS_META, type Idioma } from "@/lib/constants/idiomas"
import { cn } from "@/lib/utils"

/**
 * Escolha do idioma da interface. Aparece no ecrã de login (guarda em cookie) e
 * nas Definições (guarda também na conta). Botões grandes, pensados para o
 * telemóvel.
 */
export function SeletorIdioma({
  atual,
  className,
}: {
  atual: Idioma
  className?: string
}) {
  const router = useRouter()
  const [pendente, iniciar] = useTransition()

  function escolher(idioma: Idioma) {
    if (idioma === atual || pendente) return
    iniciar(async () => {
      await definirIdioma(idioma)
      router.refresh()
    })
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {IDIOMAS.map((id) => {
        const meta = IDIOMAS_META[id]
        const ativo = id === atual
        return (
          <button
            key={id}
            type="button"
            onClick={() => escolher(id)}
            aria-pressed={ativo}
            disabled={pendente}
            className={cn(
              "flex h-11 items-center gap-2 rounded-lg border px-3 text-sm transition-colors",
              ativo
                ? "border-primary bg-primary/10 text-foreground font-medium"
                : "hover:bg-muted text-muted-foreground"
            )}
          >
            <span aria-hidden className="text-base">
              {meta.bandeira}
            </span>
            {meta.nome}
            {pendente && ativo && <Loader2 className="size-3.5 animate-spin" />}
          </button>
        )
      })}
    </div>
  )
}
