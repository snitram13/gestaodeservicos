"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Euro, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { registarPagamentoVisita } from "@/actions/financeiro"
import { METODOS_PAGAMENTO } from "@/lib/constants/enums"
import { METODO_LABEL } from "@/lib/constants/financeiro"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function RegistarPagamentoButton({
  visitaId,
  valorSugerido,
}: {
  visitaId: string
  valorSugerido: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [valor, setValor] = useState(valorSugerido)
  const [metodo, setMetodo] = useState("DINHEIRO")
  const [loading, setLoading] = useState(false)

  async function onConfirm() {
    setLoading(true)
    const res = await registarPagamentoVisita(visitaId, valor, metodo)
    setLoading(false)
    if (!res.ok) {
      toast.error("Não foi possível registar", { description: res.message })
      return
    }
    toast.success("Pagamento registado")
    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" className="h-9 gap-1.5" />}>
        <Euro className="size-4" />
        Registar pagamento
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registar pagamento</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="pg-valor">Valor (€)</Label>
            <Input
              id="pg-valor"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              inputMode="decimal"
              className="h-11"
            />
          </div>
          <div className="grid gap-2">
            <Label>Método de pagamento</Label>
            <Select value={metodo} onValueChange={(v) => setMetodo(v ?? "DINHEIRO")}>
              <SelectTrigger className="h-11 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {METODOS_PAGAMENTO.map((m) => (
                  <SelectItem key={m} value={m}>
                    {METODO_LABEL[m]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>
            Cancelar
          </DialogClose>
          <Button onClick={onConfirm} disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            Registar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
