"use client"

import { useState } from "react"
import { FileText, Loader2, MessageCircle } from "lucide-react"
import { toast } from "sonner"

import { linkOrcamentoPdf, linkOrdemServicoPdf } from "@/actions/partilha"
import { waLink } from "@/lib/whatsapp"
import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"

/**
 * "Ver PDF" + "Enviar por WhatsApp". A partilha gera o PDF no servidor, guarda-o
 * e envia um LINK no WhatsApp — funciona em qualquer telemóvel (ao contrário da
 * partilha nativa de ficheiros, que falha em muitos browsers). O cliente abre o
 * link e vê/descarrega o PDF; o utilizador não precisa de descarregar nada.
 */
export function PartilharPdf({
  tipo,
  id,
  pdfUrl,
  telefone,
  mensagem,
  mostrarPdf = true,
}: {
  tipo: "orcamento" | "ordem-servico"
  id: string
  pdfUrl: string
  telefone?: string | null
  mensagem: string
  mostrarPdf?: boolean
}) {
  const [loading, setLoading] = useState(false)

  async function enviarWhatsApp() {
    setLoading(true)
    const res =
      tipo === "orcamento"
        ? await linkOrcamentoPdf(id)
        : await linkOrdemServicoPdf(id)
    setLoading(false)
    if (!res.ok) {
      toast.error("Não foi possível preparar o PDF", { description: res.message })
      return
    }
    window.open(waLink(telefone, `${mensagem}\n\n${res.url}`), "_blank")
  }

  return (
    <>
      {mostrarPdf && (
        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ variant: "outline" }), "h-9 gap-1.5")}
        >
          <FileText className="size-4" />
          PDF
        </a>
      )}
      <Button
        type="button"
        variant="outline"
        className="h-9 gap-1.5"
        onClick={enviarWhatsApp}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <MessageCircle className="size-4" />
        )}
        WhatsApp
      </Button>
    </>
  )
}
