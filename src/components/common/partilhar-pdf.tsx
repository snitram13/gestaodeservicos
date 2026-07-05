"use client"

import { useState } from "react"
import { FileText, Loader2, Share2 } from "lucide-react"
import { toast } from "sonner"

import { waLink } from "@/lib/whatsapp"
import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"

/**
 * Partilha um PDF (gerado numa rota autenticada) diretamente pela partilha
 * nativa do dispositivo — no telemóvel, o ficheiro vai direto para o WhatsApp
 * SEM ter de descarregar e anexar. Em ecrã sem suporte: abre o WhatsApp com a
 * mensagem (se houver telefone) ou descarrega o PDF.
 */
export function PartilharPdf({
  pdfUrl,
  nomeFicheiro,
  titulo,
  telefone,
  mensagem,
  mostrarPdf = true,
}: {
  pdfUrl: string
  nomeFicheiro: string
  titulo: string
  telefone?: string | null
  mensagem: string
  mostrarPdf?: boolean
}) {
  const [loading, setLoading] = useState(false)

  async function partilhar() {
    setLoading(true)
    try {
      const res = await fetch(pdfUrl)
      if (!res.ok) throw new Error("pdf")
      const blob = await res.blob()
      const file = new File([blob], nomeFicheiro, { type: "application/pdf" })
      const nav = navigator as Navigator & {
        canShare?: (data?: unknown) => boolean
      }
      if (nav.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: titulo, text: mensagem })
      } else if (telefone) {
        window.open(waLink(telefone, mensagem), "_blank")
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = nomeFicheiro
        a.click()
        URL.revokeObjectURL(url)
        toast.info("PDF descarregado — anexe-o no WhatsApp.")
      }
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return
      toast.error("Não foi possível partilhar o PDF.")
    } finally {
      setLoading(false)
    }
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
    </>
  )
}
