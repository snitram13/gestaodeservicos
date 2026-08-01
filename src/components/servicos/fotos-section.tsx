"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Camera, ImagePlus, Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { apagarFoto, uploadFoto } from "@/actions/fotos"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

/** Máximo de fotos por seleção (evita esperas enormes no telemóvel). */
const MAX_POR_VEZ = 20

export type FotoUI = {
  id: string
  tipo: "ANTES" | "DEPOIS"
  url: string | null
}

/**
 * Comprime a foto no browser (redimensiona a máx. 1280px, JPEG) antes de a
 * enviar — uma foto de telemóvel (2–5 MB) passa a ~200–400 KB, bem abaixo do
 * limite dos Server Actions (evita ficar "a processar" sem anexar).
 */
async function comprimir(file: File): Promise<File> {
  try {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const r = new FileReader()
      r.onload = () => resolve(r.result as string)
      r.onerror = reject
      r.readAsDataURL(file)
    })
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = reject
      i.src = dataUrl
    })
    const max = 1280
    const scale = Math.min(1, max / Math.max(img.width, img.height))
    const canvas = document.createElement("canvas")
    canvas.width = Math.round(img.width * scale)
    canvas.height = Math.round(img.height * scale)
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.72)
    )
    if (!blob) return file
    return new File([blob], "foto.jpg", { type: "image/jpeg" })
  } catch {
    return file
  }
}

export function FotosSection({
  visitaId,
  fotos,
}: {
  visitaId: string
  fotos: FotoUI[]
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Galeria
        titulo="Antes"
        tipo="ANTES"
        visitaId={visitaId}
        fotos={fotos.filter((f) => f.tipo === "ANTES")}
      />
      <Galeria
        titulo="Depois"
        tipo="DEPOIS"
        visitaId={visitaId}
        fotos={fotos.filter((f) => f.tipo === "DEPOIS")}
      />
    </div>
  )
}

function Galeria({
  titulo,
  tipo,
  visitaId,
  fotos,
}: {
  titulo: string
  tipo: "ANTES" | "DEPOIS"
  visitaId: string
  fotos: FotoUI[]
}) {
  const router = useRouter()
  const camaraRef = useRef<HTMLInputElement>(null)
  const galeriaRef = useRef<HTMLInputElement>(null)
  const [progresso, setProgresso] = useState<{ feita: number; total: number } | null>(
    null
  )
  const [aRemover, setARemover] = useState<FotoUI | null>(null)
  const [aApagar, setAApagar] = useState(false)
  const ocupado = progresso != null

  /** Envia as fotos uma a uma (o limite dos Server Actions é por pedido). */
  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const escolhidas = Array.from(e.target.files ?? [])
    e.target.value = ""
    if (escolhidas.length === 0) return
    const ficheiros = escolhidas.slice(0, MAX_POR_VEZ)
    if (escolhidas.length > MAX_POR_VEZ) {
      toast.warning(`Máximo ${MAX_POR_VEZ} fotos de cada vez.`)
    }

    let enviadas = 0
    let erro = ""
    for (const [i, original] of ficheiros.entries()) {
      setProgresso({ feita: i, total: ficheiros.length })
      const file = await comprimir(original)
      const fd = new FormData()
      fd.set("visitaId", visitaId)
      fd.set("tipo", tipo)
      fd.set("file", file)
      const res = await uploadFoto(fd)
      if (res.ok) enviadas++
      else erro = erro || res.message
    }
    setProgresso(null)

    if (enviadas > 0) {
      toast.success(
        enviadas === 1 ? "Foto adicionada" : `${enviadas} fotos adicionadas`
      )
    }
    const falhadas = ficheiros.length - enviadas
    if (falhadas > 0) {
      toast.error(
        falhadas === 1
          ? "Uma foto não carregou"
          : `${falhadas} fotos não carregaram`,
        { description: erro }
      )
    }
    router.refresh()
  }

  async function confirmarRemover() {
    if (!aRemover) return
    setAApagar(true)
    const res = await apagarFoto(aRemover.id)
    setAApagar(false)
    if (!res.ok) {
      toast.error("Não foi possível apagar", { description: res.message })
      return
    }
    toast.success("Foto removida")
    setARemover(null)
    router.refresh()
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">
          {titulo}
          {fotos.length > 0 && (
            <span className="text-muted-foreground font-normal">
              {" "}
              ({fotos.length})
            </span>
          )}
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={ocupado}
            onClick={() => camaraRef.current?.click()}
          >
            {ocupado ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Camera className="size-4" />
            )}
            {ocupado
              ? `A enviar ${progresso.feita + 1}/${progresso.total}`
              : "Câmara"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={ocupado}
            onClick={() => galeriaRef.current?.click()}
            title="Escolher várias fotos"
          >
            <ImagePlus className="size-4" />
            Galeria
          </Button>
        </div>
        {/* Câmara: tira uma foto na hora. */}
        <input
          ref={camaraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={onFiles}
        />
        {/* Galeria: permite escolher várias de uma vez. */}
        <input
          ref={galeriaRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={onFiles}
        />
      </div>
      {fotos.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-center text-sm">
          Sem fotos.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {fotos.map((f) => (
            <div
              key={f.id}
              className="relative aspect-square overflow-hidden rounded-lg border"
            >
              {f.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={f.url}
                  alt={titulo}
                  className="size-full object-cover"
                />
              ) : (
                <div className="bg-muted size-full" />
              )}
              {/* Sempre visível: no telemóvel não há hover. */}
              <button
                type="button"
                onClick={() => setARemover(f)}
                className="absolute top-1 right-1 rounded-md bg-black/60 p-1.5 text-white active:bg-black/80"
                aria-label="Remover foto"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <AlertDialog
        open={aRemover != null}
        onOpenChange={(v) => !v && setARemover(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover esta foto?</AlertDialogTitle>
            <AlertDialogDescription>
              A foto é apagada definitivamente e deixa de aparecer na ordem de
              serviço.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {aRemover?.url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={aRemover.url}
              alt=""
              className="mx-auto max-h-48 rounded-lg object-contain"
            />
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={aApagar}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={aApagar}
              onClick={(e) => {
                e.preventDefault()
                confirmarRemover()
              }}
            >
              {aApagar && <Loader2 className="size-4 animate-spin" />}
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
