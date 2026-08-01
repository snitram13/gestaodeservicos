import {
  MENSALIDADE_EUR,
  PRECO_FUNCIONARIO_EUR,
  TRIAL_DIAS,
} from "@/lib/constants/subscricao"
import { chaveDia } from "@/lib/formatters/date"

const DIA_MS = 86_400_000

/**
 * Mensalidade total de um cliente: base + (nº de funcionários ativos, sem o
 * dono) × preço por funcionário. Arredonda a 2 casas para evitar erros de
 * vírgula flutuante (ex.: 29.90 + 3×4.99).
 */
export function mensalidadeDe(nFuncionarios: number): number {
  const n = Math.max(0, nFuncionarios)
  return Math.round((MENSALIDADE_EUR + n * PRECO_FUNCIONARIO_EUR) * 100) / 100
}

export type EstadoAcesso = {
  estado: "ilimitado" | "ativo" | "expirado"
  /** Dias que faltam até expirar (null se ilimitado). */
  diasRestantes: number | null
  acessoAte: Date | null
}

/**
 * Calcula o estado de acesso de uma empresa a partir de `acessoAte`.
 * null = ilimitado (ex.: a empresa do super-admin). Data no passado = expirado.
 */
export function estadoAcesso(
  acessoAte: Date | null | undefined,
  agora: Date = new Date()
): EstadoAcesso {
  if (!acessoAte) return { estado: "ilimitado", diasRestantes: null, acessoAte: null }
  const ms = acessoAte.getTime() - agora.getTime()
  if (ms <= 0) return { estado: "expirado", diasRestantes: 0, acessoAte }
  return { estado: "ativo", diasRestantes: Math.ceil(ms / DIA_MS), acessoAte }
}

/** Data de fim do período gratuito, contada a partir de agora. */
export function fimDoTrial(agora: Date = new Date()): Date {
  return new Date(agora.getTime() + TRIAL_DIAS * DIA_MS)
}

/** Soma dias a uma data (sem mexer no original). */
export function adicionarDias(base: Date, dias: number): Date {
  return new Date(base.getTime() + dias * DIA_MS)
}

/**
 * Instante de fim do dia (23:59:59.999 em Lisboa) de uma data `YYYY-MM-DD`.
 * O acesso deve terminar no FIM do dia escolhido, não à meia-noite; e o
 * servidor corre em UTC, por isso Lisboa pode estar 1h à frente (verão).
 */
export function fimDoDiaLisboa(data: string): Date {
  const utc = new Date(`${data}T23:59:59.999Z`)
  if (Number.isNaN(utc.getTime())) return utc
  // Se em Lisboa já for o dia seguinte (UTC+1), recua 1h.
  return chaveDia(utc) === data ? utc : new Date(utc.getTime() - 3_600_000)
}
