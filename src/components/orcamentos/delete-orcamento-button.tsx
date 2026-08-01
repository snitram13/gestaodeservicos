"use client"

import { useState } from "react"
import { useT } from "@/components/i18n/idioma-provider"
import { useRouter } from "next/navigation"
import { Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { apagarOrcamento } from "@/actions/orcamentos"
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

export function DeleteOrcamentoButton({ id }: { id: string }) {
  const t = useT()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function onConfirm() {
  const t = useT()
    setLoading(true)
    const res = await apagarOrcamento(id)
    setLoading(false)
    if (!res.ok) {
      toast.error(t("Não foi possível apagar"), { description: res.message })
      return
    }
    toast.success(t("Orçamento apagado"))
    router.push("/orcamentos")
    router.refresh()
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button variant="outline" size="icon" aria-label={t("Apagar orçamento")} />
        }
      >
        <Trash2 className="size-4" />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("Apagar orçamento?")}</AlertDialogTitle>
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
