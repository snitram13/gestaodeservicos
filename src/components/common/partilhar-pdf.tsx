"use client"

import { useState } from "react"
import { FileText, Loader2, MessageCircle, Send } from "lucide-react"
import { toast } from "sonner"

import { linkOrcamentoPdf, linkOrdemServicoPdf } from "@/actions/partilha"
import { waLink } from "@/lib/whatsapp"
import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"

/**
 * "Ver PDF" + "WhatsApp". No telemóvel envia o PDF EM SI pela partilha nativa:
 * - Android: 1 toque.
 * - iPhone: o gesto perde-se enquanto o PDF é preparado, por isso guardamos o
 *   ficheiro e mostramos um 2º botão "Enviar PDF" (aí o iOS já deixa anexar).
 * - Computador (sem suporte a anexar ficheiros): recorre a enviar um LINK.
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
  const [ficheiro, setFicheiro] = useState<File | null>(null)

  function suportaAnexar(): boolean {
    try {
      const nav = navigator as Navigator & {
        canShare?: (data?: unknown) => boolean
      }
      const teste = new File(["x"], "t.pdf", { type: "application/pdf" })
      return !!nav.canShare?.({ files: [teste] })
    } catch {
      return false
    }
  }

  async function partilhar(file: File): Promise<"ok" | "cancelado" | "falhou"> {
    try {
      await navigator.share({ files: [file], text: mensagem })
      return "ok"
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return "cancelado"
      return "falhou"
    }
  }

  async function enviarLink(comAviso = false) {
    const res =
      tipo === "orcamento"
        ? await linkOrcamentoPdf(id)
        : await linkOrdemServicoPdf(id)
    if (!res.ok) {
      toast.error("Não foi possível preparar o PDF", { description: res.message })
      return
    }
    if (comAviso) {
      toast.info("Este dispositivo não anexa ficheiros — enviei o link do PDF.")
    }
    window.open(waLink(telefone, `${mensagem}\n\n${res.url}`), "_blank")
  }

  async function onClick() {
    // 2º toque (iPhone): o ficheiro já está pronto → partilhar com gesto fresco.
    if (ficheiro) {
      const r = await partilhar(ficheiro)
      setFicheiro(null)
      if (r === "falhou") await enviarLink()
      return
    }

    // Computador / sem suporte a anexar → link.
    if (!suportaAnexar()) {
      setLoading(true)
      await enviarLink(true)
      setLoading(false)
      return
    }

    // Preparar o PDF (descarregar).
    setLoading(true)
    let file: File | null = null
    try {
      const resp = await fetch(pdfUrl)
      if (resp.ok) {
        const nome = tipo === "orcamento" ? "orcamento" : "ordem-servico"
        file = new File([await resp.blob()], `${nome}.pdf`, {
          type: "application/pdf",
        })
      }
    } catch {
      /* ignora — cai no link */
    }
    setLoading(false)
    if (!file) {
      await enviarLink()
      return
    }

    // Tentar já (Android partilha; iPhone costuma perder o gesto).
    const r = await partilhar(file)
    if (r === "ok" || r === "cancelado") return
    // Gesto perdido → guardar e pedir 2º toque.
    setFicheiro(file)
    toast.info('PDF pronto — toque em "Enviar PDF" para anexar no WhatsApp.')
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
        variant={ficheiro ? "default" : "outline"}
        className="h-9 gap-1.5"
        onClick={onClick}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : ficheiro ? (
          <Send className="size-4" />
        ) : (
          <MessageCircle className="size-4" />
        )}
        {ficheiro ? "Enviar PDF" : "WhatsApp"}
      </Button>
    </>
  )
}
