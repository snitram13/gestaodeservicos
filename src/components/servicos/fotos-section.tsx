"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Camera, Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { apagarFoto, uploadFoto } from "@/actions/fotos"
import { Button } from "@/components/ui/button"

export type FotoUI = {
  id: string
  tipo: "ANTES" | "DEPOIS"
  url: string | null
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
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    setLoading(true)
    const fd = new FormData()
    fd.set("visitaId", visitaId)
    fd.set("tipo", tipo)
    fd.set("file", file)
    const res = await uploadFoto(fd)
    setLoading(false)
    if (!res.ok) {
      toast.error("Não foi possível carregar", { description: res.message })
      return
    }
    toast.success("Foto adicionada")
    router.refresh()
  }

  async function remover(id: string) {
    const res = await apagarFoto(id)
    if (!res.ok) {
      toast.error("Não foi possível apagar", { description: res.message })
      return
    }
    toast.success("Foto removida")
    router.refresh()
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium">{titulo}</p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={loading}
          onClick={() => inputRef.current?.click()}
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Camera className="size-4" />
          )}
          Adicionar
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={onFile}
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
              className="group relative aspect-square overflow-hidden rounded-lg border"
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
              <button
                type="button"
                onClick={() => remover(f.id)}
                className="absolute top-1 right-1 rounded-md bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="Remover foto"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
