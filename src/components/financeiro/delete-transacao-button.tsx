"use client"

import { useState } from "react"
import { useT } from "@/components/i18n/idioma-provider"
import { useRouter } from "next/navigation"
import { Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { apagarTransacao } from "@/actions/financeiro"
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

export function DeleteTransacaoButton({ id }: { id: string }) {
  const t = useT()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function onConfirm() {
  const t = useT()
    setLoading(true)
    const res = await apagarTransacao(id)
    setLoading(false)
    if (!res.ok) {
      toast.error(t("Não foi possível apagar"))
      return
    }
    toast.success(t("Transação apagada"))
    router.refresh()
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground"
            aria-label={t("Apagar")}
          />
        }
      >
        <Trash2 className="size-4" />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("Apagar transação?")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("Esta ação não pode ser anulada.")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("Cancelar")}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            {t("Apagar")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
