"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Ban,
  Building2,
  CalendarClock,
  Check,
  Copy,
  CreditCard,
  Infinity as InfinityIcon,
  Loader2,
  MoreHorizontal,
  RotateCcw,
  Trash2,
  Users,
} from "lucide-react"
import { toast } from "sonner"

import {
  apagarClientePlataforma,
  criarCliente,
  definirAcesso,
  definirEstadoEmpresa,
  definirLimiteFuncionarios,
  registarPagamento,
  type AjusteAcesso,
} from "@/actions/admin"
import { PRECO_FUNCIONARIO_EUR } from "@/lib/constants/subscricao"
import { estadoAcesso } from "@/lib/subscricao"
import { formatEuro } from "@/lib/formatters/currency"
import { chaveDia, formatData } from "@/lib/formatters/date"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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
/* Ações por cliente (pagamento / acesso / suspender)                  */
/* ------------------------------------------------------------------ */

export type EmpresaItem = {
  id: string
  nome: string
  ativo: boolean
  isMinha: boolean
  mensalidade: number
  /** Fim do acesso em ISO (null = ilimitado). */
  acessoAte: string | null
}

export function EmpresaAcoes({ item }: { item: EmpresaItem }) {
  const router = useRouter()
  const [pagOpen, setPagOpen] = useState(false)
  const [estadoOpen, setEstadoOpen] = useState(false)
  const [acessoOpen, setAcessoOpen] = useState(false)
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
        onClick={() => setAcessoOpen(true)}
      >
        <CalendarClock className="size-4" />
        Acesso
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button type="button" variant="ghost" size="icon-sm" />}
        >
          <MoreHorizontal className="size-4" />
          <span className="sr-only">Mais ações</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            variant={suspender ? "destructive" : "default"}
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
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <GerirAcessoDialog
        item={item}
        open={acessoOpen}
        onOpenChange={setAcessoOpen}
      />

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
/* Gerir acesso (dar mais dias/meses, data exata, ilimitado)           */
/* ------------------------------------------------------------------ */

const ATALHOS: { label: string; ajuste: AjusteAcesso }[] = [
  { label: "+7 dias", ajuste: { tipo: "dias", valor: 7 } },
  { label: "+15 dias", ajuste: { tipo: "dias", valor: 15 } },
  { label: "+1 mês", ajuste: { tipo: "meses", valor: 1 } },
  { label: "+3 meses", ajuste: { tipo: "meses", valor: 3 } },
]

export function GerirAcessoDialog({
  item,
  open,
  onOpenChange,
}: {
  item: EmpresaItem
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* Montado só quando abre → os campos partem sempre do valor atual. */}
        {open && (
          <AcessoConteudo item={item} onDone={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  )
}

function AcessoConteudo({
  item,
  onDone,
}: {
  item: EmpresaItem
  onDone: () => void
}) {
  const router = useRouter()
  const atual = item.acessoAte ? new Date(item.acessoAte) : null
  const est = estadoAcesso(atual)
  const [data, setData] = useState(chaveDia(atual ?? new Date()))
  const [pendente, setPendente] = useState<string | null>(null)

  async function aplicar(ajuste: AjusteAcesso, chave: string) {
    setPendente(chave)
    const res = await definirAcesso(item.id, ajuste)
    setPendente(null)
    if (!res.ok) {
      toast.error("Não foi possível alterar o acesso", {
        description: res.message,
      })
      return
    }
    toast.success(
      res.acessoAte
        ? `Acesso até ${formatData(res.acessoAte)}`
        : "Acesso ilimitado"
    )
    onDone()
    router.refresh()
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Acesso — {item.nome}</DialogTitle>
      </DialogHeader>

      <div className="grid gap-4">
        <div className="bg-muted rounded-lg p-3 text-sm">
          <span className="text-muted-foreground">Situação atual: </span>
          {est.estado === "ilimitado" ? (
            <strong>acesso ilimitado</strong>
          ) : est.estado === "expirado" ? (
            <strong className="text-destructive">
              expirado em {formatData(est.acessoAte)}
            </strong>
          ) : (
            <>
              <strong>até {formatData(est.acessoAte)}</strong>{" "}
              <span className="text-muted-foreground">
                (faltam {est.diasRestantes} dias)
              </span>
            </>
          )}
          {!item.ativo && (
            <p className="text-destructive mt-1">
              A empresa está suspensa — dar acesso volta a ativá-la.
            </p>
          )}
        </div>

        <div className="grid gap-2">
          <Label>Dar mais tempo</Label>
          <div className="flex flex-wrap gap-2">
            {ATALHOS.map((a) => (
              <Button
                key={a.label}
                type="button"
                variant="outline"
                className="h-11"
                disabled={pendente != null}
                onClick={() => aplicar(a.ajuste, a.label)}
              >
                {pendente === a.label && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                {a.label}
              </Button>
            ))}
          </div>
          <p className="text-muted-foreground text-xs">
            Soma ao fim do acesso atual (ou a hoje, se já tiver expirado). Não
            regista pagamento — é tempo de experiência oferecido.
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="acesso-data">Ou definir a data de fim</Label>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              id="acesso-data"
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="h-11 w-44"
            />
            <Button
              type="button"
              className="h-11"
              disabled={pendente != null || !data}
              onClick={() => aplicar({ tipo: "data", data }, "data")}
            >
              {pendente === "data" && <Loader2 className="size-4 animate-spin" />}
              Guardar data
            </Button>
          </div>
          <p className="text-muted-foreground text-xs">
            O acesso termina no fim desse dia.
          </p>
        </div>

        <div className="grid gap-2 border-t pt-3">
          <Button
            type="button"
            variant="ghost"
            className="h-11 justify-start"
            disabled={pendente != null || est.estado === "ilimitado"}
            onClick={() => aplicar({ tipo: "ilimitado" }, "ilimitado")}
          >
            {pendente === "ilimitado" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <InfinityIcon className="size-4" />
            )}
            {est.estado === "ilimitado"
              ? "Já tem acesso ilimitado"
              : "Tornar o acesso ilimitado (sem data de fim)"}
          </Button>
        </div>
      </div>

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>
          Fechar
        </DialogClose>
      </DialogFooter>
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Apagar cliente (definitivo)                                         */
/* ------------------------------------------------------------------ */

export function ApagarClienteControl({
  empresaId,
  nome,
  totais,
}: {
  empresaId: string
  nome: string
  /** Contagens para o super-admin ver o que vai destruir. */
  totais: { utilizadores: number; clientes: number; visitas: number; orcamentos: number }
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirmacao, setConfirmacao] = useState("")
  const [loading, setLoading] = useState(false)
  const podeApagar =
    confirmacao.trim().toLocaleLowerCase("pt-PT") ===
    nome.trim().toLocaleLowerCase("pt-PT")

  async function apagar() {
    setLoading(true)
    const res = await apagarClientePlataforma(empresaId, confirmacao)
    setLoading(false)
    if (!res.ok) {
      toast.error("Não foi possível apagar", { description: res.message })
      return
    }
    toast.success(`"${nome}" foi apagado`)
    setOpen(false)
    // A página deste cliente deixou de existir.
    router.replace("/admin")
    router.refresh()
  }

  return (
    <>
      <Button
        type="button"
        variant="destructive"
        className="h-11"
        onClick={() => {
          setConfirmacao("")
          setOpen(true)
        }}
      >
        <Trash2 className="size-4" />
        Apagar cliente
      </Button>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!loading) setOpen(v)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apagar “{nome}” definitivamente?</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 text-sm">
            <p className="text-muted-foreground">
              Isto apaga <strong className="text-foreground">tudo</strong> deste
              cliente e <strong className="text-foreground">não tem volta</strong>
              :
            </p>
            <ul className="text-muted-foreground list-disc space-y-0.5 pl-5">
              <li>{totais.utilizadores} conta(s) de login (o email fica livre)</li>
              <li>{totais.clientes} cliente(s) na agenda dele</li>
              <li>{totais.visitas} serviço(s) e {totais.orcamentos} orçamento(s)</li>
              <li>fotos, assinaturas e PDFs guardados</li>
              <li>o histórico de pagamentos deixa de contar no financeiro</li>
            </ul>
            <p className="text-muted-foreground">
              Se só queres cortar o acesso, usa <strong>Suspender</strong> — os
              dados ficam guardados.
            </p>
            <div className="grid gap-1.5">
              <Label htmlFor="confirmar-nome">
                Escreve <strong>{nome}</strong> para confirmar
              </Label>
              <Input
                id="confirmar-nome"
                value={confirmacao}
                onChange={(e) => setConfirmacao(e.target.value)}
                autoComplete="off"
                className="h-11"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancelar
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              disabled={!podeApagar || loading}
              onClick={apagar}
            >
              {loading && <Loader2 className="size-4 animate-spin" />}
              Apagar para sempre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
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

