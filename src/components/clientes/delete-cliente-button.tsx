"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { apagarCliente } from "@/actions/clientes"
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function DeleteClienteButton({
  id,
  nome,
}: {
  id: string
  nome: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function onConfirm() {
    setLoading(true)
    const res = await apagarCliente(id)
    setLoading(false)
    if (!res.ok) {
      toast.error("Não foi possível apagar", { description: res.message })
      return
    }
    toast.success("Cliente apagado")
    router.push("/clientes")
    router.refresh()
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button variant="outline" size="icon" aria-label="Apagar cliente" />
        }
      >
        <Trash2 className="size-4" />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Apagar cliente?</AlertDialogTitle>
          <AlertDialogDescription>
            Vai apagar “{nome}”. Esta ação não pode ser anulada.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            Apagar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
