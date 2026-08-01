"use client"

import { useState } from "react"
import { useT } from "@/components/i18n/idioma-provider"
import { useRouter } from "next/navigation"
import { Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"

import {
  apagarCliente,
  resumoCliente,
  type ResumoCliente,
} from "@/actions/clientes"
import { useRotulos } from "@/components/servicos/rotulos"
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

export function DeleteClienteButton({
  id,
  nome,
}: {
  id: string
  nome: string
}) {
  const t = useT()
  const router = useRouter()
  const r = useRotulos()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resumo, setResumo] = useState<ResumoCliente | null>(null)
  const [aCarregar, setACarregar] = useState(false)

  async function abrir() {
    setOpen(true)
    setResumo(null)
    setACarregar(true)
    // Contagens frescas: o utilizador tem de ver o que vai perder.
    setResumo(await resumoCliente(id))
    setACarregar(false)
  }

  async function onConfirm() {
    setLoading(true)
    const res = await apagarCliente(id)
    setLoading(false)
    if (!res.ok) {
      toast.error(t("Não foi possível apagar"), { description: res.message })
      return
    }
    toast.success(t("Cliente apagado"))
    setOpen(false)
    router.push("/clientes")
    router.refresh()
  }

  const temDados =
    resumo != null &&
    (resumo.visitas > 0 || resumo.orcamentos > 0 || resumo.fotos > 0)

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label={t("Apagar cliente")}
        onClick={abrir}
      >
        <Trash2 className="size-4" />
      </Button>

      <AlertDialog
        open={open}
        onOpenChange={(v) => {
          if (!loading) setOpen(v)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar “{nome}”?</AlertDialogTitle>
            <AlertDialogDescription>
              {aCarregar
                ? "A verificar o que está associado a este cliente…"
                : temDados
                  ? "Apaga também tudo o que está associado a este cliente. Não há forma de recuperar."
                  : "Esta ação não pode ser anulada."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {temDados && resumo && (
            <ul className="text-muted-foreground list-disc space-y-0.5 pl-5 text-sm">
              {resumo.visitas > 0 && (
                <li>
                  <strong className="text-foreground">{resumo.visitas}</strong>{" "}
                  {resumo.visitas === 1 ? r.singular : r.plural}
                </li>
              )}
              {resumo.orcamentos > 0 && (
                <li>
                  <strong className="text-foreground">
                    {resumo.orcamentos}
                  </strong>{" "}
                  {resumo.orcamentos === 1 ? "orçamento" : "orçamentos"}
                </li>
              )}
              {resumo.fotos > 0 && (
                <li>
                  <strong className="text-foreground">{resumo.fotos}</strong>{" "}
                  {resumo.fotos === 1 ? "foto" : "fotos"} e assinaturas
                </li>
              )}
              {resumo.transacoes > 0 && (
                <li>
                  os{" "}
                  <strong className="text-foreground">
                    {resumo.transacoes}
                  </strong>{" "}
                  movimentos no Financeiro{" "}
                  <strong className="text-foreground">{t("mantêm-se")}</strong>, só
                  deixam de estar ligados ao cliente
                </li>
              )}
            </ul>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>{t("Cancelar")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={loading || aCarregar}
              onClick={(e) => {
                e.preventDefault()
                onConfirm()
              }}
            >
              {loading && <Loader2 className="size-4 animate-spin" />}
              {temDados ? "Apagar tudo" : "Apagar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
