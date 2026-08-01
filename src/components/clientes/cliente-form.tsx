"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { atualizarCliente, criarCliente } from "@/actions/clientes"
import { procurarMorada } from "@/actions/morada"
import {
  clienteSchemaDe,
  CLIENTE_VAZIO,
  type ClienteFormValues,
} from "@/lib/validations/cliente"
import { metaPais, PAIS_PADRAO, type Pais } from "@/lib/constants/paises"
import { useT } from "@/components/i18n/idioma-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export function ClienteForm({
  clienteId,
  defaultValues,
  pais = PAIS_PADRAO,
}: {
  clienteId?: string
  defaultValues?: ClienteFormValues
  /** País da empresa: manda no telefone, código postal e nº fiscal. */
  pais?: Pais
}) {
  const router = useRouter()
  const t = useT()
  const meta = metaPais(pais)
  // Nº de dígitos do código postal do país (PT 4+3, ES/FR 5).
  const digitosCp = pais === "PT" ? 7 : 5
  const isEdit = Boolean(clienteId)
  const form = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteSchemaDe(pais)),
    defaultValues: defaultValues ?? CLIENTE_VAZIO,
  })
  const [cpLoading, setCpLoading] = useState(false)

  function formatCp(v: string) {
    const d = v.replace(/\D/g, "").slice(0, digitosCp)
    // Só Portugal usa o hífen 0000-000.
    if (pais !== "PT") return d
    return d.length > 4 ? `${d.slice(0, 4)}-${d.slice(4)}` : d
  }

  // Procura a morada quando o código postal está completo (PT e FR têm
  // serviço de consulta; em Espanha preenche-se à mão).
  async function procurarCp(valor: string) {
    if (!meta.moradaAutomatica) return
    if (valor.replace(/\D/g, "").length !== digitosCp) return
    setCpLoading(true)
    const res = await procurarMorada(valor)
    setCpLoading(false)
    if (!res.ok) {
      toast.error(t("Código postal"), { description: res.message })
      return
    }
    if (res.cidade) form.setValue("cidade", res.cidade, { shouldValidate: true })
    if (res.morada && !(form.getValues("morada") || "").trim()) {
      form.setValue("morada", res.morada, { shouldValidate: true })
    }
    toast.success(t("Morada preenchida a partir do código postal"))
  }

  async function onSubmit(values: ClienteFormValues) {
    const res = isEdit
      ? await atualizarCliente(clienteId!, values)
      : await criarCliente(values)

    if (!res.ok) {
      toast.error(t("Não foi possível guardar"), { description: res.message })
      return
    }
    toast.success(isEdit ? "Cliente atualizado" : "Cliente criado")
    router.push(isEdit ? `/clientes/${clienteId}` : `/clientes/${res.id}`)
    router.refresh()
  }

  const isSubmitting = form.formState.isSubmitting

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <Card>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>{t("Nome *")}</FormLabel>
                  <FormControl>
                    <Input className="h-11" placeholder={t("Nome do cliente")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="telefone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("Telefone *")}</FormLabel>
                  <FormControl>
                    <Input
                      className="h-11"
                      type="tel"
                      inputMode="tel"
                      placeholder={meta.exemploTelefone}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("Email")}</FormLabel>
                  <FormControl>
                    <Input
                      className="h-11"
                      type="email"
                      inputMode="email"
                      placeholder="nome@email.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nif"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{meta.rotuloFiscal}</FormLabel>
                  <FormControl>
                    <Input
                      className="h-11"
                      inputMode="numeric"
                      placeholder={meta.exemploFiscal}
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
                  <FormLabel>{t(meta.rotuloCodigoPostal)}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        className="h-11 pr-9"
                        inputMode="numeric"
                        placeholder={meta.exemploCodigoPostal}
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
                  <p className="text-muted-foreground text-xs">{t("Preenche a morada e a cidade automaticamente.")}</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="morada"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>{t("Morada")}</FormLabel>
                  <FormControl>
                    <Input
                      className="h-11"
                      placeholder={t("Rua, número, andar…")}
                      {...field}
                    />
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
                  <FormLabel>{t("Cidade / localidade")}</FormLabel>
                  <FormControl>
                    <Input className="h-11" placeholder={t("Localidade")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notas"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>{t("Observações")}</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder={t("Notas internas sobre o cliente…")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
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
          >{t("Cancelar")}</Button>
          <Button type="submit" className="h-11" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Guardar
          </Button>
        </div>
      </form>
    </Form>
  )
}
