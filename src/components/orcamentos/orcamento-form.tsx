"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useFieldArray, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { atualizarOrcamento, criarOrcamento } from "@/actions/orcamentos"
import { CATEGORIA_OPCOES } from "@/lib/constants/categorias"
import { ESTADO_ORCAMENTO_OPCOES } from "@/lib/constants/estados"
import { formatEuro, parseEuro } from "@/lib/formatters/currency"
import { formatTelefone } from "@/lib/formatters/phone"
import type { Orcamento, OrcamentoItem } from "@/db/schema"
import {
  orcamentoSchema,
  ORCAMENTO_ITEM_VAZIO,
  type OrcamentoFormValues,
} from "@/lib/validations/orcamento"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Combobox } from "@/components/common/combobox"
import {
  NovoClienteDialog,
  type ClienteCriado,
} from "@/components/clientes/novo-cliente-dialog"
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

type ClienteOpt = { id: string; nome: string; telefone: string }

export function OrcamentoForm({
  clientes,
  orcamento,
  prefill,
  visitaOrigemId,
}: {
  clientes: ClienteOpt[]
  orcamento?: Orcamento & { itens: OrcamentoItem[] }
  prefill?: Partial<OrcamentoFormValues>
  visitaOrigemId?: string
}) {
  const router = useRouter()
  const isEdit = Boolean(orcamento)

  const defaultValues = useMemo<OrcamentoFormValues>(() => {
    if (orcamento) {
      return {
        clienteId: orcamento.clienteId,
        categoria: orcamento.categoria,
        estado: orcamento.estado,
        titulo: orcamento.titulo,
        descricao: orcamento.descricao ?? "",
        validade: orcamento.validade ?? "",
        taxaIva: orcamento.taxaIva,
        notas: orcamento.notas ?? "",
        itens: orcamento.itens
          .sort((a, b) => a.ordem - b.ordem)
          .map((it) => ({
            descricao: it.descricao,
            quantidade: it.quantidade,
            precoUnit: it.precoUnit,
          })),
      }
    }
    const validade = new Date()
    validade.setDate(validade.getDate() + 30)
    return {
      clienteId: "",
      categoria: "OUTROS",
      estado: "RASCUNHO",
      titulo: "",
      descricao: "",
      validade: validade.toISOString().slice(0, 10),
      taxaIva: "23",
      notas: "",
      itens: [{ ...ORCAMENTO_ITEM_VAZIO }],
      ...prefill,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const form = useForm<OrcamentoFormValues>({
    resolver: zodResolver(orcamentoSchema),
    defaultValues,
  })
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "itens",
  })

  const itens = form.watch("itens")
  const subtotal = (itens ?? []).reduce(
    (s, it) => s + parseEuro(it?.quantidade) * parseEuro(it?.precoUnit),
    0
  )
  const taxa = parseEuro(form.watch("taxaIva"))
  const totalIva = (subtotal * taxa) / 100
  const total = subtotal + totalIva

  const [clientesList, setClientesList] = useState(clientes)
  const clienteOptions = clientesList.map((c) => ({
    value: c.id,
    label: c.nome,
    sub: formatTelefone(c.telefone),
  }))

  function onClienteCriado(c: ClienteCriado) {
    setClientesList((prev) =>
      [...prev, { id: c.id, nome: c.nome, telefone: c.telefone }].sort((a, b) =>
        a.nome.localeCompare(b.nome, "pt")
      )
    )
    form.setValue("clienteId", c.id, { shouldValidate: true })
  }

  async function onSubmit(values: OrcamentoFormValues) {
    const res = isEdit
      ? await atualizarOrcamento(orcamento!.id, values)
      : await criarOrcamento(values, visitaOrigemId)
    if (!res.ok) {
      toast.error("Não foi possível guardar", { description: res.message })
      return
    }
    toast.success(isEdit ? "Orçamento atualizado" : "Orçamento criado")
    router.push(`/orcamentos/${res.id}`)
    router.refresh()
  }

  const isSubmitting = form.formState.isSubmitting

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle>Dados</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="clienteId"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Cliente *</FormLabel>
                  <div className="flex gap-2">
                    <div className="min-w-0 flex-1">
                      <Combobox
                        options={clienteOptions}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Selecionar cliente"
                        searchPlaceholder="Procurar cliente…"
                      />
                    </div>
                    <NovoClienteDialog onCreated={onClienteCriado} />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="titulo"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Título *</FormLabel>
                  <FormControl>
                    <Input
                      className="h-11"
                      placeholder="Ex.: Remodelação de casa de banho"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="categoria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="h-11 w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORIA_OPCOES.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="estado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="h-11 w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ESTADO_ORCAMENTO_OPCOES.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="validade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Válido até</FormLabel>
                  <FormControl>
                    <Input type="date" className="h-11" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="taxaIva"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>IVA (%)</FormLabel>
                  <FormControl>
                    <Input className="h-11" inputMode="decimal" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Linhas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {fields.map((f, index) => (
              <div key={f.id} className="rounded-lg border p-3">
                <div className="flex items-start gap-2">
                  <FormField
                    control={form.control}
                    name={`itens.${index}.descricao`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            className="h-10"
                            placeholder="Descrição"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    aria-label="Remover linha"
                    disabled={fields.length === 1}
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <FormField
                    control={form.control}
                    name={`itens.${index}.quantidade`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground text-xs">
                          Qtd.
                        </FormLabel>
                        <FormControl>
                          <Input className="h-10" inputMode="decimal" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`itens.${index}.precoUnit`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground text-xs">
                          Preço un.
                        </FormLabel>
                        <FormControl>
                          <Input className="h-10" inputMode="decimal" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <div>
                    <p className="text-muted-foreground text-xs">Total</p>
                    <p className="flex h-10 items-center font-medium">
                      {formatEuro(
                        parseEuro(itens?.[index]?.quantidade) *
                          parseEuro(itens?.[index]?.precoUnit)
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              className="w-full border-dashed gap-1.5"
              onClick={() => append({ ...ORCAMENTO_ITEM_VAZIO })}
            >
              <Plus className="size-4" />
              Adicionar linha
            </Button>

            {form.formState.errors.itens?.message && (
              <p className="text-destructive text-sm">
                {form.formState.errors.itens.message}
              </p>
            )}

            <div className="bg-muted/50 ml-auto grid max-w-xs gap-1 rounded-lg p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatEuro(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">IVA ({taxa}%)</span>
                <span>{formatEuro(totalIva)}</span>
              </div>
              <div className="flex justify-between border-t pt-1 text-base font-semibold">
                <span>Total</span>
                <span>{formatEuro(total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <FormField
              control={form.control}
              name="notas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas / condições</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder="Ex.: Validade de 30 dias. Pagamento a pronto."
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="h-11"
            onClick={() => router.back()}
          >
            Cancelar
          </Button>
          <Button type="submit" className="h-11" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Guardar
          </Button>
        </div>
      </form>
    </Form>
  )
}
