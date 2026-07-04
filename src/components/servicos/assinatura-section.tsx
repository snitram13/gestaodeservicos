"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Eraser, Loader2, PenLine, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { guardarAssinatura, removerAssinatura } from "@/actions/assinatura"
import { Button } from "@/components/ui/button"

export function AssinaturaSection({
  visitaId,
  url,
}: {
  visitaId: string
  url: string | null
}) {
  const router = useRouter()
  const [editando, setEditando] = useState(false)

  async function remover() {
    const res = await removerAssinatura(visitaId)
    if (!res.ok) {
      toast.error("Não foi possível remover", { description: res.message })
      return
    }
    toast.success("Assinatura removida")
    router.refresh()
  }

  if (url && !editando) {
    return (
      <div className="space-y-3">
        <div className="rounded-lg border bg-white p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="Assinatura do cliente" className="mx-auto max-h-32" />
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setEditando(true)}
          >
            <PenLine className="size-4" />
            Substituir
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="text-destructive"
            onClick={remover}
          >
            <Trash2 className="size-4" />
            Remover
          </Button>
        </div>
      </div>
    )
  }

  return <Pad visitaId={visitaId} onDone={() => setEditando(false)} />
}

function Pad({ visitaId, onDone }: { visitaId: string; onDone: () => void }) {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const desenhando = useRef(false)
  const [vazio, setVazio] = useState(true)
  const [loading, setLoading] = useState(false)

  function posicao(e: React.PointerEvent<HTMLCanvasElement>) {
    const c = canvasRef.current!
    const r = c.getBoundingClientRect()
    return {
      x: (e.clientX - r.left) * (c.width / r.width),
      y: (e.clientY - r.top) * (c.height / r.height),
    }
  }

  function comecar(e: React.PointerEvent<HTMLCanvasElement>) {
    const ctx = canvasRef.current!.getContext("2d")!
    const p = posicao(e)
    ctx.beginPath()
    ctx.moveTo(p.x, p.y)
    desenhando.current = true
    canvasRef.current!.setPointerCapture(e.pointerId)
  }

  function mover(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!desenhando.current) return
    const ctx = canvasRef.current!.getContext("2d")!
    const p = posicao(e)
    ctx.lineTo(p.x, p.y)
    ctx.strokeStyle = "#111827"
    ctx.lineWidth = 2.5
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.stroke()
    setVazio(false)
  }

  function terminar() {
    desenhando.current = false
  }

  function limpar() {
    const c = canvasRef.current!
    c.getContext("2d")!.clearRect(0, 0, c.width, c.height)
    setVazio(true)
  }

  async function guardar() {
    if (vazio) {
      toast.error("Peça ao cliente para assinar primeiro.")
      return
    }
    setLoading(true)
    const dataUrl = canvasRef.current!.toDataURL("image/png")
    const res = await guardarAssinatura(visitaId, dataUrl)
    setLoading(false)
    if (!res.ok) {
      toast.error("Não foi possível guardar", { description: res.message })
      return
    }
    toast.success("Assinatura guardada")
    onDone()
    router.refresh()
  }

  return (
    <div className="space-y-3">
      <canvas
        ref={canvasRef}
        width={600}
        height={200}
        className="h-40 w-full touch-none rounded-lg border bg-white"
        onPointerDown={comecar}
        onPointerMove={mover}
        onPointerUp={terminar}
        onPointerLeave={terminar}
      />
      <p className="text-muted-foreground text-xs">
        Peça ao cliente para assinar acima com o dedo.
      </p>
      <div className="flex gap-2">
        <Button type="button" size="sm" variant="outline" onClick={limpar}>
          <Eraser className="size-4" />
          Limpar
        </Button>
        <Button type="button" size="sm" onClick={guardar} disabled={loading}>
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <PenLine className="size-4" />
          )}
          Guardar assinatura
        </Button>
      </div>
    </div>
  )
}
