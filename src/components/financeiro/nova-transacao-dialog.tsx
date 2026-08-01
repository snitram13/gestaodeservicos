"use client"

import { useState } from "react"
import { useT } from "@/components/i18n/idioma-provider"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Plus } from "lucide-react"
import { toast } from "sonner"

import { criarTransacao } from "@/actions/financeiro"
import { METODOS_PAGAMENTO, type TipoTransacao } from "@/lib/constants/enums"
import {
  CATEGORIA_TRANSACAO_LABEL,
  CATEGORIAS_ENTRADA,
  CATEGORIAS_SAIDA,
  METODO_LABEL,
} from "@/lib/constants/financeiro"
import {
  transacaoSchema,
  type TransacaoFormValues,
} from "@/lib/validations/transacao"
import { useFormatos } from "@/components/i18n/idioma-provider"
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

/** Valores iniciais — a data de hoje vem no fuso do país da empresa. */
const VAZIO = (hoje: string): TransacaoFormValues => ({
  tipo: "ENTRADA",
  categoria: "SERVICO",
  valor: "",
  data: hoje,
  descricao: "",
  metodoPagamento: "DINHEIRO",
})

export function NovaTransacaoDialog() {
  const t = useT()
  const fm = useFormatos()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const form = useForm<TransacaoFormValues>({
    resolver: zodResolver(transacaoSchema),
    defaultValues: VAZIO(fm.hoje()),
  })

  const tipo = form.watch("tipo")
  const categorias = tipo === "ENTRADA" ? CATEGORIAS_ENTRADA : CATEGORIAS_SAIDA

  function setTipo(t: TipoTransacao) {
    form.setValue("tipo", t)
    form.setValue("categoria", t === "ENTRADA" ? "SERVICO" : "MATERIAL")
  }

  async function onSubmit(values: TransacaoFormValues) {
    const res = await criarTransacao(values)
    if (!res.ok) {
      toast.error(t("Não foi possível registar"), { description: res.message })
      return
    }
    toast.success(t("Transação registada"))
    setOpen(false)
    form.reset(VAZIO(fm.hoje()))
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="h-10 gap-1.5" />}>
        <Plus className="size-4" />{t("Nova transação")}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("Nova transação")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={tipo === "ENTRADA" ? "default" : "outline"}
                onClick={() => setTipo("ENTRADA")}
              >{t("Entrada")}</Button>
              <Button
                type="button"
                variant={tipo === "SAIDA" ? "default" : "outline"}
                onClick={() => setTipo("SAIDA")}
              >{t("Saída")}</Button>
            </div>

            <FormField
              control={form.control}
              name="categoria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("Categoria")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="h-11 w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categorias.map((c) => (
                        <SelectItem key={c} value={c}>
                          {t(CATEGORIA_TRANSACAO_LABEL[c])}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="valor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("Valor (€)")}</FormLabel>
                    <FormControl>
                      <Input className="h-11" inputMode="decimal" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="data"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("Data")}</FormLabel>
                    <FormControl>
                      <Input type="date" className="h-11" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {tipo === "ENTRADA" && (
              <FormField
                control={form.control}
                name="metodoPagamento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("Método de pagamento")}</FormLabel>
                    <Select
                      value={field.value || undefined}
                      onValueChange={(v) => field.onChange(v ?? "")}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11 w-full">
                          <SelectValue placeholder={t("Selecionar…")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {METODOS_PAGAMENTO.map((m) => (
                          <SelectItem key={m} value={m}>
                            {t(METODO_LABEL[m])}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("Descrição")}</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <DialogClose
                render={<Button type="button" variant="outline" />}
              >{t("Cancelar")}</DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                {t("Guardar")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
