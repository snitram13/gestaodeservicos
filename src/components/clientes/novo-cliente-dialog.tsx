"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, UserPlus } from "lucide-react"
import { toast } from "sonner"

import { criarCliente } from "@/actions/clientes"
import { procurarMorada } from "@/actions/morada"
import {
  clienteSchema,
  CLIENTE_VAZIO,
  type ClienteFormValues,
} from "@/lib/validations/cliente"
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

export type ClienteCriado = {
  id: string
  nome: string
  telefone: string
  morada: string | null
  cidade: string | null
}

export function NovoClienteDialog({
  onCreated,
}: {
  onCreated: (c: ClienteCriado) => void
}) {
  const [open, setOpen] = useState(false)
  const [cpLoading, setCpLoading] = useState(false)
  const form = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteSchema),
    defaultValues: CLIENTE_VAZIO,
  })

  function formatCp(v: string) {
    const d = v.replace(/\D/g, "").slice(0, 7)
    return d.length > 4 ? `${d.slice(0, 4)}-${d.slice(4)}` : d
  }

  async function procurarCp(valor: string) {
    if (valor.replace(/\D/g, "").length !== 7) return
    setCpLoading(true)
    const res = await procurarMorada(valor)
    setCpLoading(false)
    if (!res.ok) {
      toast.error("Código postal", { description: res.message })
      return
    }
    if (res.cidade) form.setValue("cidade", res.cidade, { shouldValidate: true })
    if (res.morada && !(form.getValues("morada") || "").trim()) {
      form.setValue("morada", res.morada, { shouldValidate: true })
    }
    toast.success("Morada preenchida a partir do código postal")
  }

  async function onSubmit(values: ClienteFormValues) {
    const res = await criarCliente(values)
    if (!res.ok) {
      toast.error("Não foi possível criar", { description: res.message })
      return
    }
    toast.success("Cliente criado")
    onCreated({
      id: res.id,
      nome: values.nome.trim(),
      telefone: values.telefone.trim(),
      morada: values.morada.trim() || null,
      cidade: values.cidade.trim() || null,
    })
    setOpen(false)
    form.reset(CLIENTE_VAZIO)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button type="button" variant="outline" className="h-11 shrink-0 gap-1.5" />
        }
      >
        <UserPlus className="size-4" />
        Novo
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo cliente</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <Input className="h-11" placeholder="Nome do cliente" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone *</FormLabel>
                    <FormControl>
                      <Input
                        className="h-11"
                        type="tel"
                        inputMode="tel"
                        placeholder="912 345 678"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="codigoPostal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código postal</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          className="h-11 pr-9"
                          inputMode="numeric"
                          placeholder="0000-000"
                          name={field.name}
                          ref={field.ref}
                          value={field.value ?? ""}
                          onBlur={field.onBlur}
                          onChange={(e) => {
                            const f = formatCp(e.target.value)
                            field.onChange(f)
                            if (f.replace(/\D/g, "").length === 7) procurarCp(f)
                          }}
                        />
                        {cpLoading && (
                          <Loader2 className="text-muted-foreground absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin" />
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="morada"
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
            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline" />}>
                Cancelar
              </DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                Criar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
