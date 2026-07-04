"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Ban,
  Building2,
  Check,
  Copy,
  CreditCard,
  Loader2,
  RotateCcw,
  Users,
} from "lucide-react"
import { toast } from "sonner"

import {
  criarCliente,
  definirEstadoEmpresa,
  definirLimiteFuncionarios,
  definirModulo,
  registarPagamento,
} from "@/actions/admin"
import { MODULOS_META } from "@/lib/constants/modulos"
import { PRECO_FUNCIONARIO_EUR } from "@/lib/constants/subscricao"
import { formatEuro } from "@/lib/formatters/currency"
import {
  criarClienteSchema,
  CRIAR_CLIENTE_VAZIO,
  type CriarClienteValues,
} from "@/lib/validations/admin"
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
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

/* ------------------------------------------------------------------ */
/* Novo cliente (empresa + dono)                                       */
/* ------------------------------------------------------------------ */

type Credenciais = { email: string; password: string }

export function NovoClienteDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [criado, setCriado] = useState<Credenciais | null>(null)
  const form = useForm<CriarClienteValues>({
    resolver: zodResolver(criarClienteSchema),
    defaultValues: CRIAR_CLIENTE_VAZIO,
  })

  async function onSubmit(values: CriarClienteValues) {
    const res = await criarCliente(values)
    if (!res.ok) {
      toast.error("Não foi possível criar", { description: res.message })
      return
    }
    toast.success("Cliente criado")
    setCriado({ email: res.email, password: res.password })
    form.reset(CRIAR_CLIENTE_VAZIO)
  }

  function fechar(v: boolean) {
    setOpen(v)
    if (!v) {
      // Ao fechar, limpa o ecrã de credenciais e recarrega a lista.
      setCriado(null)
      router.refresh()
    }
  }

  return (
    <Dialog open={open} onOpenChange={fechar}>
      <DialogTrigger render={<Button type="button" className="h-10 gap-1.5" />}>
        <Building2 className="size-4" />
        Novo cliente
      </DialogTrigger>
      <DialogContent>
        {criado ? (
          <CredenciaisView cred={criado} onDone={() => fechar(false)} />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Novo cliente</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
                <FormField
                  control={form.control}
                  name="nomeEmpresa"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da empresa *</FormLabel>
                      <FormControl>
                        <Input className="h-11" placeholder="Empresa do cliente" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nomeDono"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Responsável (dono) *</FormLabel>
                      <FormControl>
                        <Input className="h-11" placeholder="Nome do responsável" {...field} />
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
                      <FormLabel>Email de acesso *</FormLabel>
                      <FormControl>
                        <Input
                          className="h-11"
                          type="email"
                          inputMode="email"
                          autoComplete="off"
                          placeholder="cliente@exemplo.pt"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Palavra-passe</FormLabel>
                      <FormControl>
                        <Input
                          className="h-11"
                          type="text"
                          autoComplete="off"
                          placeholder="Deixar vazio → gerada automaticamente"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="limiteFuncionarios"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lugares de funcionário</FormLabel>
                      <FormControl>
                        <Input
                          className="h-11"
                          type="number"
                          min={0}
                          max={999}
                          {...field}
                        />
                      </FormControl>
                      <p className="text-muted-foreground text-xs">
                        Cada funcionário custa {formatEuro(PRECO_FUNCIONARIO_EUR)}
                        /mês. 0 = só o dono.
                      </p>
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
                    Criar cliente
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function CredenciaisView({
  cred,
  onDone,
}: {
  cred: Credenciais
  onDone: () => void
}) {
  const [copiado, setCopiado] = useState(false)

  async function copiar() {
    const texto = `Acesso à app\nEmail: ${cred.email}\nPalavra-passe: ${cred.password}`
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(true)
      toast.success("Credenciais copiadas")
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      toast.error("Não foi possível copiar — copie manualmente.")
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Cliente criado ✓</DialogTitle>
      </DialogHeader>
      <div className="grid gap-3">
        <p className="text-muted-foreground text-sm">
          Entregue estas credenciais ao cliente. A palavra-passe só é mostrada
          agora — depois o cliente pode entrar em <b>{cred.email}</b>.
        </p>
        <div className="bg-muted grid gap-1 rounded-lg p-3 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium break-all">{cred.email}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Palavra-passe</span>
            <span className="font-mono font-medium break-all">{cred.password}</span>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={copiar}>
          {copiado ? <Check className="size-4" /> : <Copy className="size-4" />}
          Copiar
        </Button>
        <Button type="button" onClick={onDone}>
          Concluir
        </Button>
      </DialogFooter>
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Suspender / reativar empresa                                        */
/* ------------------------------------------------------------------ */

export function EmpresaAcoes({
  item,
}: {
  item: {
    id: string
    nome: string
    ativo: boolean
    isMinha: boolean
    mensalidade: number
  }
}) {
  const router = useRouter()
  const [pagOpen, setPagOpen] = useState(false)
  const [estadoOpen, setEstadoOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const suspender = item.ativo

  async function confirmarPagamento() {
    setLoading(true)
    const res = await registarPagamento(item.id)
    setLoading(false)
    if (!res.ok) {
      toast.error("Não foi possível registar", { description: res.message })
      return
    }
    toast.success("Pagamento registado — acesso +1 mês")
    setPagOpen(false)
    router.refresh()
  }

  async function confirmarEstado() {
    setLoading(true)
    const res = await definirEstadoEmpresa(item.id, !item.ativo)
    setLoading(false)
    if (!res.ok) {
      toast.error("Não foi possível concluir", { description: res.message })
      return
    }
    toast.success(suspender ? "Empresa suspensa" : "Empresa reativada")
    setEstadoOpen(false)
    router.refresh()
  }

  if (item.isMinha) {
    return <span className="text-muted-foreground text-xs">a tua conta</span>
  }

  return (
    <div className="flex justify-end gap-2">
      <Button type="button" size="sm" onClick={() => setPagOpen(true)}>
        <CreditCard className="size-4" />
        Registar pagamento
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setEstadoOpen(true)}
      >
        {suspender ? (
          <>
            <Ban className="size-4" />
            Suspender
          </>
        ) : (
          <>
            <RotateCcw className="size-4" />
            Reativar
          </>
        )}
      </Button>

      {/* Registar pagamento (+1 mês) */}
      <AlertDialog open={pagOpen} onOpenChange={setPagOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Registar pagamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Confirma que <strong>{item.nome}</strong> pagou a mensalidade de{" "}
              {formatEuro(item.mensalidade)}. O acesso é estendido em +1 mês e a
              empresa fica ativa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={loading}
              onClick={(e) => {
                e.preventDefault()
                confirmarPagamento()
              }}
            >
              {loading && <Loader2 className="size-4 animate-spin" />}
              Registar pagamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Suspender / reativar (manual) */}
      <AlertDialog open={estadoOpen} onOpenChange={setEstadoOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {suspender ? "Suspender empresa?" : "Reativar empresa?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {suspender
                ? `${item.nome} deixa de conseguir entrar na aplicação de imediato. Pode reativar quando quiser.`
                : `${item.nome} volta a poder entrar (se o período de acesso ainda for válido).`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant={suspender ? "destructive" : "default"}
              disabled={loading}
              onClick={(e) => {
                e.preventDefault()
                confirmarEstado()
              }}
            >
              {loading && <Loader2 className="size-4 animate-spin" />}
              {suspender ? "Suspender" : "Reativar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Lugares de funcionário (editar limite do plano)                     */
/* ------------------------------------------------------------------ */

export function LimiteFuncionariosControl({
  empresaId,
  limite,
}: {
  empresaId: string
  limite: number
}) {
  const router = useRouter()
  const [valor, setValor] = useState(String(limite))
  const [loading, setLoading] = useState(false)

  async function guardar() {
    const n = Number(valor)
    if (!Number.isInteger(n) || n < 0 || n > 999) {
      toast.error("Indique um número de lugares válido (0–999).")
      return
    }
    setLoading(true)
    const res = await definirLimiteFuncionarios(empresaId, n)
    setLoading(false)
    if (!res.ok) {
      toast.error("Não foi possível guardar", { description: res.message })
      return
    }
    toast.success("Lugares atualizados")
    router.refresh()
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="grid gap-1.5">
        <Label htmlFor="lugares">Lugares de funcionário</Label>
        <Input
          id="lugares"
          type="number"
          min={0}
          max={999}
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          className="h-11 w-28"
        />
      </div>
      <Button type="button" onClick={guardar} disabled={loading} className="h-11">
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Users className="size-4" />
        )}
        Guardar
      </Button>
      <p className="text-muted-foreground text-sm">
        Cada funcionário custa {formatEuro(PRECO_FUNCIONARIO_EUR)}/mês.
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Módulos opcionais (ligar/desligar por cliente)                      */
/* ------------------------------------------------------------------ */

export function ModulosControl({
  empresaId,
  ativos,
}: {
  empresaId: string
  ativos: string[]
}) {
  const router = useRouter()
  const [pending, setPending] = useState<string | null>(null)

  async function toggle(key: string, ativo: boolean) {
    setPending(key)
    const res = await definirModulo(empresaId, key, ativo)
    setPending(null)
    if (!res.ok) {
      toast.error("Não foi possível guardar", { description: res.message })
      return
    }
    toast.success(ativo ? "Módulo ativado" : "Módulo desativado")
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {MODULOS_META.map((m) => {
        const on = ativos.includes(m.key)
        return (
          <div key={m.key} className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-medium">{m.nome}</p>
              <p className="text-muted-foreground text-sm">{m.descricao}</p>
            </div>
            <Switch
              checked={on}
              disabled={pending === m.key}
              onCheckedChange={(v) => toggle(m.key, v)}
            />
          </div>
        )
      })}
    </div>
  )
}
