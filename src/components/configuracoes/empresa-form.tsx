"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Building2, Loader2, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"

import {
  guardarConfiguracao,
  removerLogo,
  uploadLogo,
} from "@/actions/configuracao"
import { logoUrl } from "@/lib/logo"
import type { Empresa } from "@/db/schema"
import {
  configuracaoSchema,
  type ConfiguracaoFormValues,
} from "@/lib/validations/configuracao"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

export function EmpresaForm({ configuracao: cfg }: { configuracao: Empresa }) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [logoPath, setLogoPath] = useState(cfg.logoPath)
  const [uploading, setUploading] = useState(false)

  const form = useForm<ConfiguracaoFormValues>({
    resolver: zodResolver(configuracaoSchema),
    defaultValues: {
      nomeEmpresa: cfg.nome,
      slogan: cfg.slogan ?? "",
      nif: cfg.nif ?? "",
      telefone: cfg.telefone ?? "",
      email: cfg.email ?? "",
      morada: cfg.morada ?? "",
      iban: cfg.iban ?? "",
    },
  })

  const url = logoUrl(logoPath)

  async function onLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append("file", file)
    const res = await uploadLogo(fd)
    setUploading(false)
    if (!res.ok) {
      toast.error("Falha no upload", { description: res.message })
      return
    }
    setLogoPath(res.path)
    toast.success("Logótipo atualizado")
    router.refresh()
  }

  async function onRemover() {
    setUploading(true)
    const res = await removerLogo()
    setUploading(false)
    if (!res.ok) {
      toast.error("Não foi possível remover")
      return
    }
    setLogoPath(null)
    toast.success("Logótipo removido")
    router.refresh()
  }

  async function onSubmit(values: ConfiguracaoFormValues) {
    const res = await guardarConfiguracao(values)
    if (!res.ok) {
      toast.error("Não foi possível guardar", { description: res.message })
      return
    }
    toast.success("Dados guardados")
    router.refresh()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle>Logótipo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="bg-muted flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border">
                {url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={url}
                    alt="Logótipo"
                    className="size-full object-contain"
                  />
                ) : (
                  <Building2 className="text-muted-foreground size-8" />
                )}
              </div>
              <div className="flex flex-col items-start gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={onLogo}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Upload className="size-4" />
                  )}
                  Carregar logótipo
                </Button>
                {url && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive gap-1.5"
                    onClick={onRemover}
                    disabled={uploading}
                  >
                    <Trash2 className="size-4" />
                    Remover
                  </Button>
                )}
                <p className="text-muted-foreground text-xs">
                  PNG ou JPG, até 2 MB. Aparece nos orçamentos.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dados da empresa</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="nomeEmpresa"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Nome da empresa *</FormLabel>
                  <FormControl>
                    <Input className="h-11" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="slogan"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Slogan</FormLabel>
                  <FormControl>
                    <Input className="h-11" placeholder="Ex.: Reparações ao domicílio" {...field} />
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
                  <FormLabel>NIF</FormLabel>
                  <FormControl>
                    <Input className="h-11" inputMode="numeric" placeholder="9 dígitos" {...field} />
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
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input className="h-11" type="tel" inputMode="tel" placeholder="+351 …" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input className="h-11" type="email" inputMode="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="morada"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Morada</FormLabel>
                  <FormControl>
                    <Input className="h-11" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="iban"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>IBAN (opcional, aparece no PDF)</FormLabel>
                  <FormControl>
                    <Input className="h-11" placeholder="PT50 …" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" className="h-11" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && (
              <Loader2 className="size-4 animate-spin" />
            )}
            Guardar
          </Button>
        </div>
      </form>
    </Form>
  )
}
