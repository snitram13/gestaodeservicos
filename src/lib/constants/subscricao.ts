/**
 * Parâmetros do aluguer da aplicação (SaaS). Cada cliente/tenant tem um período
 * gratuito e depois paga uma mensalidade; o acesso é controlado por
 * `empresa.acessoAte`. Alterar aqui reflete em toda a app.
 */

/** Duração do período gratuito (em dias) ao criar um cliente. */
export const TRIAL_DIAS = 45

/** Valor da mensalidade base (inclui a app + a conta do dono), em euros. */
export const MENSALIDADE_EUR = 29.9

/** Acréscimo por cada funcionário ativo (não-dono), em euros. */
export const PRECO_FUNCIONARIO_EUR = 4.99

/** Avisar o cliente quando faltarem <= estes dias de acesso. */
export const AVISO_DIAS = 10
