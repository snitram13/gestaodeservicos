import {
  ESTADOS_VISITA,
  ESTADOS_ORCAMENTO,
  type EstadoVisita,
  type EstadoOrcamento,
} from "./enums"

export const ESTADO_VISITA_META: Record<
  EstadoVisita,
  { label: string; badge: string; dot: string }
> = {
  AGENDADO: {
    label: "Agendado",
    badge: "border-blue-200 bg-blue-50 text-blue-700",
    dot: "bg-blue-500",
  },
  EM_ANDAMENTO: {
    label: "Em andamento",
    badge: "border-amber-200 bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
  },
  CONCLUIDO: {
    label: "Concluído",
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
  },
  CANCELADO: {
    label: "Cancelado",
    badge: "border-slate-200 bg-slate-100 text-slate-500",
    dot: "bg-slate-400",
  },
}

export const ESTADO_VISITA_OPCOES = ESTADOS_VISITA.map((e) => ({
  value: e,
  label: ESTADO_VISITA_META[e].label,
}))

export const ESTADO_ORCAMENTO_META: Record<
  EstadoOrcamento,
  { label: string; badge: string }
> = {
  RASCUNHO: {
    label: "Rascunho",
    badge: "border-slate-200 bg-slate-100 text-slate-600",
  },
  ENVIADO: {
    label: "Enviado",
    badge: "border-blue-200 bg-blue-50 text-blue-700",
  },
  ACEITE: {
    label: "Aceite",
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  RECUSADO: {
    label: "Recusado",
    badge: "border-red-200 bg-red-50 text-red-700",
  },
  EXPIRADO: {
    label: "Expirado",
    badge: "border-amber-200 bg-amber-50 text-amber-700",
  },
}

export const ESTADO_ORCAMENTO_OPCOES = ESTADOS_ORCAMENTO.map((e) => ({
  value: e,
  label: ESTADO_ORCAMENTO_META[e].label,
}))
