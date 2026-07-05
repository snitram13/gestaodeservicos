"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useFieldArray, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { atualizarVisita, criarVisita } from "@/actions/visitas"
import { CATEGORIA_OPCOES } from "@/lib/constants/categorias"
import { ESTADO_VISITA_OPCOES } from "@/lib/constants/estados"
import { formatEuro, parseEuro } from "@/lib/formatters/currency"
import { formatTelefone } from "@/lib/formatters/phone"
import type { Servico, Visita } from "@/db/schema"
import {
  SERVICO_LINHA_VAZIO,
  visitaSchema,
  type VisitaFormValues,
} from "@/lib/validations/visita"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRotulos } from "@/components/servicos/rotulos"
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

type ClienteOpt = {
  id: string
  nome: string
  telefone: string
  morada: string | null
  cidade: string | null
}

type TecnicoOpt = {
  id: string
  nome: string
  corAgenda: string | null
}

// Valor sentinela para "sem técnico" (o Select não usa string vazia).
const SEM_TECNICO = "__none__"

function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`
}

function defaultsNovo(): VisitaFormValues {
  const base = new Date()
  base.setMinutes(0, 0, 0)
  base.setHours(base.getHours() + 1)
  return {
    clienteId: "",
    tecnicoId: "",
    estado: "AGENDADO",
    agendadoPara: toLocalInput(base),
    moradaServico: "",
    cidade: "",
    descricao: "",
    deslocacao: "0",
    kmPercorridos: "0",
    servicos: [{ ...SERVICO_LINHA_VAZIO }],
  }
}

export function VisitaForm({
  clientes,
  tecnicos = [],
  visita,
  prefill,
  orcamentoOrigemId,
}: {
  clientes: ClienteOpt[]
  tecnicos?: TecnicoOpt[]
  visita?: Visita & { servicos: Servico[] }
  prefill?: Partial<VisitaFormValues>
  orcamentoOrigemId?: string
}) {
  const router = useRouter()
  const r = useRotulos()
  const isEdit = Boolean(visita)
  const [clientesList, setClientesList] = useState(clientes)

  const defaultValues = useMemo<VisitaFormValues>(() => {
    if (visita) {
      return {
        clienteId: visita.clienteId,
        tecnicoId: visita.tecnicoId ?? "",
        estado: visita.estado,
        agendadoPara: toLocalInput(new Date(visita.agendadoPara)),
        moradaServico: visita.moradaServico ?? "",
        cidade: visita.cidade ?? "",
        descricao: visita.descricao ?? "",
        deslocacao: visita.deslocacao,
        kmPercorridos: visita.kmPercorridos,
        servicos: [...visita.servicos]
          .sort((a, b) => a.ordem - b.ordem)
          .map((s) => ({
            categoria: s.categoria,
            titulo: s.titulo,
            descricao: s.descricao ?? "",
            maoDeObra: s.maoDeObra,
            material: s.material,
          })),
      }
    }
    return { ...defaultsNovo(), ...prefill }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const form = useForm<VisitaFormValues>({
    resolver: zodResolver(visitaSchema),
    defaultValues,
  })
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "servicos",
  })

  const clienteOptions = clientesList.map((c) => ({
    value: c.id,
    label: c.nome,
    sub: formatTelefone(c.telefone),
  }))

  function autofill(c: { morada: string | null; cidade: string | null }) {
    if (!form.getValues("moradaServico"))
      form.setValue("moradaServico", c.morada ?? "")
    if (!form.getValues("cidade")) form.setValue("cidade", c.cidade ?? "")
  }
  function onClienteChange(id: string) {
    form.setValue("clienteId", id, { shouldValidate: true })
    const c = clientesList.find((x) => x.id === id)
    if (c) autofill(c)
  }
  function onClienteCriado(c: ClienteCriado) {
    setClientesList((prev) =>
      [...prev, c].sort((a, b) => a.nome.localeCompare(b.nome, "pt"))
    )
    form.setValue("clienteId", c.id, { shouldValidate: true })
    autofill(c)
  }

  // Cliente já pré-selecionado (ex.: criar serviço a partir do orçamento):
  // preenche a morada/cidade logo, sem ter de reabrir o seletor.
  useEffect(() => {
    if (isEdit) return
    const id = form.getValues("clienteId")
    if (!id || form.getValues("moradaServico")) return
    const c = clientesList.find((x) => x.id === id)
    if (c) autofill(c)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const servicosW = form.watch("servicos")
  const deslocacaoW = form.watch("deslocacao")
  const totalServicos = (servicosW ?? []).reduce(
    (s, x) => s + parseEuro(x?.maoDeObra) + parseEuro(x?.material),
    0
  )
  const total = totalServicos + parseEuro(deslocacaoW)

  async function onSubmit(values: VisitaFormValues) {
    const res = isEdit
      ? await atualizarVisita(visita!.id, values)
      : await criarVisita(values, orcamentoOrigemId)
    if (!res.ok) {
      toast.error("Não foi possível guardar", { description: res.message })
      return
    }
    toast.success(isEdit ? r.atualizado : r.criado)
    router.push(`/visitas/${res.id}`)
    router.refresh()
  }

  const isSubmitting = form.formState.isSubmitting

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle>{r.Singular}</CardTitle>
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
                        onChange={onClienteChange}
                        placeholder="Selecionar cliente"
                        searchPlaceholder="Procurar cliente…"
                        empty="Nenhum cliente encontrado."
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
              name="agendadoPara"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data e hora *</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" className="h-11" {...field} />
                  </FormControl>
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
                        <SelectValue>
                          {(v) =>
                            ESTADO_VISITA_OPCOES.find((o) => o.value === v)
                              ?.label ?? ""
                          }
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ESTADO_VISITA_OPCOES.map((o) => (
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
              name="tecnicoId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Técnico</FormLabel>
                  <Select
                    value={field.value ? field.value : SEM_TECNICO}
                    onValueChange={(v) =>
                      field.onChange(v === SEM_TECNICO ? "" : (v ?? ""))
                    }
                  >
                    <FormControl>
                      <SelectTrigger className="h-11 w-full">
                        <SelectValue placeholder="Sem técnico">
                          {(v) =>
                            !v || v === SEM_TECNICO
                              ? "Sem técnico"
                              : (tecnicos.find((t) => t.id === v)?.nome ??
                                "Sem técnico")
                          }
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={SEM_TECNICO}>Sem técnico</SelectItem>
                      {tecnicos.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.nome}
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
              name="moradaServico"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Morada</FormLabel>
                  <FormControl>
                    <Input className="h-11" placeholder="Rua, número…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cidade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cidade / localidade</FormLabel>
                  <FormControl>
                    <Input className="h-11" placeholder="Localidade" {...field} />
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
                  <FormLabel>{r.notas}</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Observações gerais…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Serviços</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {fields.map((f, index) => (
              <div key={f.id} className="rounded-lg border p-3">
                <input
                  type="hidden"
                  {...form.register(`servicos.${index}.descricao`)}
                />
                <div className="flex items-start gap-2">
                  <FormField
                    control={form.control}
                    name={`servicos.${index}.categoria`}
                    render={({ field }) => (
                      <FormItem className="w-44 shrink-0">
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger className="h-10 w-full">
                              <SelectValue>
                                {(v) =>
                                  CATEGORIA_OPCOES.find((o) => o.value === v)
                                    ?.label ?? ""
                                }
                              </SelectValue>
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
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`servicos.${index}.titulo`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            className="h-10"
                            placeholder="Serviço (ex.: Troca de torneira)"
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
                    aria-label="Remover serviço"
                    disabled={fields.length === 1}
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <FormField
                    control={form.control}
                    name={`servicos.${index}.maoDeObra`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground text-xs">
                          Mão de obra
                        </FormLabel>
                        <FormControl>
                          <Input className="h-10" inputMode="decimal" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`servicos.${index}.material`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground text-xs">
                          Material
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
                        parseEuro(servicosW?.[index]?.maoDeObra) +
                          parseEuro(servicosW?.[index]?.material)
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
              onClick={() => append({ ...SERVICO_LINHA_VAZIO })}
            >
              <Plus className="size-4" />
              Adicionar serviço
            </Button>

            {form.formState.errors.servicos?.message && (
              <p className="text-destructive text-sm">
                {form.formState.errors.servicos.message}
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="deslocacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deslocação (€)</FormLabel>
                    <FormControl>
                      <Input className="h-11" inputMode="decimal" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="kmPercorridos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Km percorridos</FormLabel>
                    <FormControl>
                      <Input className="h-11" inputMode="decimal" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="bg-muted/50 ml-auto grid max-w-xs gap-1 rounded-lg p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Serviços</span>
                <span>{formatEuro(totalServicos)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Deslocação</span>
                <span>{formatEuro(parseEuro(deslocacaoW))}</span>
              </div>
              <div className="flex justify-between border-t pt-1 text-base font-semibold">
                <span>Total</span>
                <span>{formatEuro(total)}</span>
              </div>
            </div>
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
