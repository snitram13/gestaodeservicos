"use client"

import { useState } from "react"
import { FileText, Loader2, Share2 } from "lucide-react"
import { toast } from "sonner"

import { waLink } from "@/lib/whatsapp"
import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"

export function OrdemServicoAcoes({
  visitaId,
  numero,
  telefone,
  mensagem,
}: {
  visitaId: string
  numero: number
  telefone?: string | null
  mensagem: string
}) {
  const [loading, setLoading] = useState(false)
  const pdfUrl = `/visitas/${visitaId}/os-pdf`

  async function partilhar() {
    setLoading(true)
    try {
      const res = await fetch(pdfUrl)
      if (!res.ok) throw new Error("pdf")
      const blob = await res.blob()
      const file = new File([blob], `ordem-servico-${numero}.pdf`, {
        type: "application/pdf",
      })
      const nav = navigator as Navigator & {
        canShare?: (data?: unknown) => boolean
      }
      if (nav.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Ordem de Serviço #${numero}`,
          text: mensagem,
        })
      } else if (telefone) {
        window.open(waLink(telefone, mensagem), "_blank")
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = file.name
        a.click()
        URL.revokeObjectURL(url)
        toast.info("PDF descarregado — anexe-o no WhatsApp.")
      }
    } catch (e) {
      // Utilizador cancelou a partilha nativa — não é erro.
      if (e instanceof Error && e.name === "AbortError") return
      toast.error("Não foi possível partilhar o PDF.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={pdfUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(buttonVariants({ variant: "outline" }), "h-9 gap-1.5")}
      >
        <FileText className="size-4" />
        Gerar PDF
      </a>
      <Button
        type="button"
        variant="outline"
        className="h-9 gap-1.5"
        onClick={partilhar}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Share2 className="size-4" />
        )}
        Partilhar
      </Button>
    </div>
  )
}
