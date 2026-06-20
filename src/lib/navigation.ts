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

export function tituloDaRota(pathname: string): string {
  const item = [...NAV_ITEMS]
    .sort((a, b) => b.href.length - a.href.length)
    .find((i) => isActiveHref(pathname, i.href))
  return item?.label ?? "PN Gestão"
}
