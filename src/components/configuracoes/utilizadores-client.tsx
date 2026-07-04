"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Loader2,
  MoreHorizontal,
  Pencil,
  UserCheck,
  UserPlus,
  UserX,
} from "lucide-react"
import { toast } from "sonner"

import {
  atualizarUtilizador,
  criarUtilizador,
  definirEstadoUtilizador,
} from "@/actions/utilizadores"
import type { RoleUtilizador } from "@/lib/constants/enums"
import {
  criarUtilizadorSchema,
  editarUtilizadorSchema,
  CRIAR_UTILIZADOR_VAZIO,
  ROLES_ATRIBUIVEIS,
  type CriarUtilizadorValues,
  type EditarUtilizadorValues,
} from "@/lib/validations/utilizador"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

export type UtilizadorRow = {
  id: string
  nome: string
  email: string
  role: RoleUtilizador
  ativo: boolean
  corAgenda: string | null
}

type RoleAtribuivelForm = (typeof ROLES_ATRIBUIVEIS)[number]

const ROLE_LABEL: Record<RoleAtribuivelForm, string> = {
  ADMIN: "Administrador",
  TECNICO: "Técnico",
}

/* ------------------------------------------------------------------ */
/* Campos partilhados entre criar/editar                               */
/* ------------------------------------------------------------------ */

function CampoRole({
  control,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: any
}) {
  return (
    <FormField
      control={control}
      name="role"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Cargo</FormLabel>
          <Select value={field.value} onValueChange={(v) => field.onChange(v)}>
            <FormControl>
              <SelectTrigger className="h-11 w-full">
                <SelectValue placeholder="Selecionar…" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {ROLES_ATRIBUIVEIS.map((r) => (
                <SelectItem key={r} value={r}>
                  {ROLE_LABEL[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

function CampoCor({
  control,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: any
}) {
  return (
    <FormField
      control={control}
      name="corAgenda"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Cor na agenda</FormLabel>
          <div className="flex items-center gap-3">
            <FormControl>
              <input
                type="color"
                name={field.name}
                ref={field.ref}
                onBlur={field.onBlur}
                onChange={field.onChange}
                value={field.value || "#3b82f6"}
                className="h-11 w-14 shrink-0 cursor-pointer rounded-lg border border-input bg-transparent p-1"
              />
            </FormControl>
            <span className="text-muted-foreground text-sm">
              {field.value || "—"}
            </span>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

/* ------------------------------------------------------------------ */
/* Novo funcionário                                                    */
/* ------------------------------------------------------------------ */

export function NovoFuncionarioDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const form = useForm<CriarUtilizadorValues>({
    resolver: zodResolver(criarUtilizadorSchema),
    defaultValues: CRIAR_UTILIZADOR_VAZIO,
  })

  async function onSubmit(values: CriarUtilizadorValues) {
    const res = await criarUtilizador(values)
    if (!res.ok) {
      toast.error("Não foi possível criar", { description: res.message })
      return
    }
    toast.success("Funcionário criado")
    setOpen(false)
    form.reset(CRIAR_UTILIZADOR_VAZIO)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" className="gap-1.5" />}>
        <UserPlus className="size-4" />
        Novo funcionário
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo funcionário</DialogTitle>
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
                    <Input className="h-11" placeholder="Nome do funcionário" {...field} />
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
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input
                      className="h-11"
                      type="email"
                      inputMode="email"
                      autoComplete="off"
                      placeholder="nome@exemplo.pt"
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
                  <FormLabel>Password *</FormLabel>
                  <FormControl>
                    <Input
                      className="h-11"
                      type="password"
                      autoComplete="new-password"
                      placeholder="Mínimo 6 caracteres"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <CampoRole control={form.control} />
              <CampoCor control={form.control} />
            </div>
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

/* ------------------------------------------------------------------ */
/* Ações por linha (editar / ativar / desativar)                       */
/* ------------------------------------------------------------------ */

export function UtilizadorAcoes({
  item,
  isSelf,
}: {
  item: UtilizadorRow
  isSelf: boolean
}) {
  const [editOpen, setEditOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon-sm" type="button" />}
        >
          <MoreHorizontal className="size-4" />
          <span className="sr-only">Ações</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem
            variant={item.ativo ? "destructive" : "default"}
            disabled={isSelf}
            onClick={() => setConfirmOpen(true)}
          >
            {item.ativo ? (
              <>
                <UserX className="size-4" />
                Desativar
              </>
            ) : (
              <>
                <UserCheck className="size-4" />
                Ativar
              </>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditarUtilizadorDialog
        item={item}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <ConfirmarEstadoDialog
        item={item}
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
      />
    </>
  )
}

function EditarUtilizadorDialog({
  item,
  open,
  onOpenChange,
}: {
  item: UtilizadorRow
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const isOwner = item.role === "OWNER"
  const form = useForm<EditarUtilizadorValues>({
    resolver: zodResolver(editarUtilizadorSchema),
    defaultValues: {
      nome: item.nome,
      // O OWNER mantém o cargo (campo escondido); o servidor preserva-o.
      role: item.role === "TECNICO" ? "TECNICO" : "ADMIN",
      corAgenda: item.corAgenda ?? "",
    },
  })

  async function onSubmit(values: EditarUtilizadorValues) {
    const res = await atualizarUtilizador(item.id, values)
    if (!res.ok) {
      toast.error("Não foi possível guardar", { description: res.message })
      return
    }
    toast.success("Funcionário atualizado")
    onOpenChange(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar funcionário</DialogTitle>
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
                    <Input className="h-11" placeholder="Nome do funcionário" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              {!isOwner && <CampoRole control={form.control} />}
              <CampoCor control={form.control} />
            </div>
            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline" />}>
                Cancelar
              </DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function ConfirmarEstadoDialog({
  item,
  open,
  onOpenChange,
}: {
  item: UtilizadorRow
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const desativar = item.ativo

  async function confirmar() {
    setLoading(true)
    const res = await definirEstadoUtilizador(item.id, !item.ativo)
    setLoading(false)
    if (!res.ok) {
      toast.error("Não foi possível concluir", { description: res.message })
      return
    }
    toast.success(desativar ? "Funcionário desativado" : "Funcionário ativado")
    onOpenChange(false)
    router.refresh()
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {desativar ? "Desativar funcionário?" : "Ativar funcionário?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {desativar
              ? `${item.nome} deixa de ter acesso à aplicação. Pode reativar mais tarde.`
              : `${item.nome} volta a ter acesso à aplicação.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            variant={desativar ? "destructive" : "default"}
            disabled={loading}
            onClick={(e) => {
              e.preventDefault()
              confirmar()
            }}
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            {desativar ? "Desativar" : "Ativar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
