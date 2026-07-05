"use client"

import { useState } from "react"
import { FileText, Loader2, MessageCircle } from "lucide-react"
import { toast } from "sonner"

import { linkOrcamentoPdf, linkOrdemServicoPdf } from "@/actions/partilha"
import { waLink } from "@/lib/whatsapp"
import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"

/**
 * "Ver PDF" + "WhatsApp". No telemóvel, o botão WhatsApp partilha o PDF EM SI
 * pela partilha nativa (o ficheiro vai anexado). Onde não há suporte (ex.:
 * computador), recorre a enviar um LINK do PDF por WhatsApp.
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

  // Tenta partilhar o ficheiro PDF em si. Devolve true se já tratou do envio
  // (partilhou ou o utilizador cancelou); false para usar o recurso do link.
  async function partilharFicheiro(): Promise<boolean> {
    try {
      const resp = await fetch(pdfUrl)
      if (!resp.ok) return false
      const blob = await resp.blob()
      const nome = tipo === "orcamento" ? "orcamento" : "ordem-servico"
      const file = new File([blob], `${nome}.pdf`, { type: "application/pdf" })
      const nav = navigator as Navigator & {
        canShare?: (data?: unknown) => boolean
      }
      if (!nav.canShare?.({ files: [file] })) return false
      await navigator.share({ files: [file], text: mensagem })
      return true
    } catch (e) {
      // Utilizador fechou a folha de partilha → não fazer mais nada.
      if (e instanceof Error && e.name === "AbortError") return true
      return false
    }
  }

  async function enviarWhatsApp() {
    setLoading(true)
    // 1) Enviar o PDF em si pela partilha nativa (telemóvel).
    if (await partilharFicheiro()) {
      setLoading(false)
      return
    }
    // 2) Recurso (computador / sem suporte): link do PDF por WhatsApp.
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
