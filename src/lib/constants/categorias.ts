import {
  Zap,
  Droplets,
  Paintbrush,
  Hammer,
  Lightbulb,
  Wrench,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react"

import { CATEGORIAS_SERVICO, type CategoriaServico } from "./enums"

type CategoriaMeta = {
  label: string
  icon: LucideIcon
  /** cor do ícone */
  texto: string
  /** fundo + texto do chip */
  chip: string
}

export const CATEGORIA_META: Record<CategoriaServico, CategoriaMeta> = {
  ELETRICIDADE: {
    label: "Eletricidade",
    icon: Zap,
    texto: "text-amber-600",
    chip: "bg-amber-100 text-amber-700",
  },
  CANALIZACAO: {
    label: "Canalização",
    icon: Droplets,
    texto: "text-sky-600",
    chip: "bg-sky-100 text-sky-700",
  },
  PINTURA: {
    label: "Pintura",
    icon: Paintbrush,
    texto: "text-violet-600",
    chip: "bg-violet-100 text-violet-700",
  },
  MONTAGEM_MOVEIS: {
    label: "Montagem de móveis",
    icon: Hammer,
    texto: "text-orange-600",
    chip: "bg-orange-100 text-orange-700",
  },
  INSTALACAO_CANDEEIROS: {
    label: "Instalação de candeeiros",
    icon: Lightbulb,
    texto: "text-yellow-600",
    chip: "bg-yellow-100 text-yellow-700",
  },
  PEQUENAS_REPARACOES: {
    label: "Pequenas reparações",
    icon: Wrench,
    texto: "text-emerald-600",
    chip: "bg-emerald-100 text-emerald-700",
  },
  OUTROS: {
    label: "Outros",
    icon: MoreHorizontal,
    texto: "text-slate-600",
    chip: "bg-slate-100 text-slate-700",
  },
}

export const CATEGORIA_OPCOES = CATEGORIAS_SERVICO.map((c) => ({
  value: c,
  label: CATEGORIA_META[c].label,
}))
