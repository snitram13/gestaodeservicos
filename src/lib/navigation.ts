import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Wrench,
  FileText,
  Euro,
  MessageCircle,
  UserPlus,
  FilePlus,
  Settings,
  ClipboardList,
  type LucideIcon,
} from "lucide-react"

export type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  /** Aparece na barra de separadores do telemóvel. */
  mobileTab?: boolean
}

/** Fonte única de navegação — usada pela sidebar, gaveta e barra inferior. */
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Início", icon: LayoutDashboard, mobileTab: true },
  { href: "/clientes", label: "Clientes", icon: Users, mobileTab: true },
  { href: "/agenda", label: "Agenda", icon: CalendarDays, mobileTab: true },
  { href: "/visitas", label: "Visitas", icon: Wrench, mobileTab: true },
  { href: "/orcamentos", label: "Orçamentos", icon: FileText },
  { href: "/financeiro", label: "Financeiro", icon: Euro },
  { href: "/mensagens", label: "Mensagens", icon: MessageCircle },
]

export const MOBILE_TABS = NAV_ITEMS.filter((i) => i.mobileTab)

/**
 * Navegação de negócio, com o item "Visitas" renomeado para "Serviços" quando o
 * módulo Ordens de Serviço está ligado para a empresa.
 */
export function navNegocio(temServicos: boolean): NavItem[] {
  if (!temServicos) return NAV_ITEMS
  return NAV_ITEMS.map((i) =>
    i.href === "/visitas"
      ? { ...i, label: "Serviços", icon: ClipboardList }
      : i
  )
}

export function mobileTabsNegocio(temServicos: boolean): NavItem[] {
  return navNegocio(temServicos).filter((i) => i.mobileTab)
}

/**
 * Navegação do SUPER-ADMIN (controlador da plataforma de aluguer). Substitui a
 * navegação de negócio — o dono da plataforma não usa clientes/visitas/agenda,
 * gere os seus clientes/tenants e o financeiro do aluguer.
 */
export const ADMIN_NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Painel", icon: LayoutDashboard, mobileTab: true },
  { href: "/admin/financeiro", label: "Financeiro", icon: Euro, mobileTab: true },
  { href: "/admin/definicoes", label: "Definições", icon: Settings },
]

export const ADMIN_MOBILE_TABS = ADMIN_NAV_ITEMS.filter((i) => i.mobileTab)

export type QuickAction = {
  href: string
  label: string
  icon: LucideIcon
}

export const QUICK_ACTIONS: QuickAction[] = [
  { href: "/visitas/novo", label: "Nova visita", icon: Wrench },
  { href: "/clientes/novo", label: "Novo cliente", icon: UserPlus },
  { href: "/orcamentos/novo", label: "Novo orçamento", icon: FilePlus },
]

export function isActiveHref(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function tituloDaRota(pathname: string, temServicos = false): string {
  const item = [...navNegocio(temServicos), ...ADMIN_NAV_ITEMS]
    .sort((a, b) => b.href.length - a.href.length)
    .find((i) => isActiveHref(pathname, i.href))
  return item?.label ?? "Gestão de Serviços"
}
