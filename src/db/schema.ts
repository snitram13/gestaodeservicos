import { relations, sql } from "drizzle-orm"
import {
  boolean,
  check,
  date,
  doublePrecision,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core"

import {
  CATEGORIAS_SERVICO,
  CATEGORIAS_TRANSACAO,
  ESTADOS_ORCAMENTO,
  ESTADOS_VISITA,
  METODOS_PAGAMENTO,
  ROLES_UTILIZADOR,
  TIPOS_FOTO,
  TIPOS_TRANSACAO,
} from "../lib/constants/enums"

/* ------------------------------------------------------------------ */
/* Enumerações                                                         */
/* ------------------------------------------------------------------ */

export const utilizadorRoleEnum = pgEnum("utilizador_role", ROLES_UTILIZADOR)
export const categoriaServicoEnum = pgEnum("categoria_servico", CATEGORIAS_SERVICO)
export const estadoVisitaEnum = pgEnum("estado_visita", ESTADOS_VISITA)
export const estadoOrcamentoEnum = pgEnum("estado_orcamento", ESTADOS_ORCAMENTO)
export const tipoTransacaoEnum = pgEnum("tipo_transacao", TIPOS_TRANSACAO)
export const categoriaTransacaoEnum = pgEnum("categoria_transacao", CATEGORIAS_TRANSACAO)
export const tipoFotoEnum = pgEnum("tipo_foto", TIPOS_FOTO)
export const metodoPagamentoEnum = pgEnum("metodo_pagamento", METODOS_PAGAMENTO)

/* ------------------------------------------------------------------ */
/* Empresa (TENANT) — raiz de isolação multi-empresa                   */
/*                                                                     */
/* Cada empresa é um negócio independente. TUDO pertence a uma empresa */
/* (empresaId). Absorve também o perfil da empresa (antiga            */
/* `configuracao`, agora 1 empresa = a sua configuração) usado no PDF  */
/* e na marca. A numeração de visitas/orçamentos é POR empresa, via    */
/* contadores atómicos (prox_num_*): cada empresa começa no #1.        */
/* ------------------------------------------------------------------ */

export const empresa = pgTable("empresa", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull().default("A minha empresa"),
  slogan: text("slogan"),
  nif: text("nif"),
  telefone: text("telefone"),
  email: text("email"),
  morada: text("morada"),
  iban: text("iban"),
  logoPath: text("logo_path"),
  // Contadores de numeração por empresa (incrementados atomicamente).
  proxNumVisita: integer("prox_num_visita").notNull().default(1),
  proxNumOrcamento: integer("prox_num_orcamento").notNull().default(1),
  ativo: boolean("ativo").notNull().default(true),
  // Nº máximo de funcionários (lugares) que o cliente pode ter. A mensalidade é
  // 29,90 + (funcionários ativos, não-OWNER) × 4,99.
  limiteFuncionarios: integer("limite_funcionarios").notNull().default(0),
  // Módulos opcionais ativos (chaves em src/lib/constants/modulos.ts). O
  // super-admin liga/desliga por cliente no /admin.
  modulos: text("modulos").array().notNull().default(sql`'{}'::text[]`),
  // Data-limite de acesso (período gratuito / mensalidade). null = ilimitado
  // (ex.: a empresa do próprio super-admin). Passada esta data, ninguém dessa
  // empresa entra até o super-admin registar o pagamento (estende a data).
  acessoAte: timestamp("acesso_ate", { withTimezone: true }),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  atualizadoEm: timestamp("atualizado_em", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

/* ------------------------------------------------------------------ */
/* Utilizador                                                          */
/*                                                                     */
/* id = auth.users.id (Supabase Auth). Cada utilizador pertence a UMA  */
/* empresa. O `role` só restringe a gestão de utilizadores/empresa —   */
/* dentro da empresa o acesso aos dados de negócio é total.            */
/* ------------------------------------------------------------------ */

export const utilizador = pgTable(
  "utilizador",
  {
    id: uuid("id").primaryKey(),
    empresaId: uuid("empresa_id")
      .notNull()
      .references(() => empresa.id, { onDelete: "cascade" }),
    nome: text("nome").notNull(),
    email: text("email").notNull().unique(),
    telefone: text("telefone"),
    role: utilizadorRoleEnum("role").notNull().default("TECNICO"),
    ativo: boolean("ativo").notNull().default(true),
    corAgenda: text("cor_agenda"),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("idx_utilizador_empresa").on(t.empresaId)]
)

/* ------------------------------------------------------------------ */
/* Cliente                                                             */
/* ------------------------------------------------------------------ */

export const cliente = pgTable(
  "cliente",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    empresaId: uuid("empresa_id")
      .notNull()
      .references(() => empresa.id, { onDelete: "cascade" }),
    nome: text("nome").notNull(),
    telefone: text("telefone").notNull(),
    email: text("email"),
    nif: text("nif"),
    morada: text("morada"),
    cidade: text("cidade"),
    codigoPostal: text("codigo_postal"),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    notas: text("notas"),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
    atualizadoEm: timestamp("atualizado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("idx_cliente_empresa_nome").on(t.empresaId, t.nome),
    index("idx_cliente_empresa_cidade").on(t.empresaId, t.cidade),
  ]
)

/* ------------------------------------------------------------------ */
/* Visita (unidade agendável: cliente + data + N serviços)             */
/* ------------------------------------------------------------------ */

export const visita = pgTable(
  "visita",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    empresaId: uuid("empresa_id")
      .notNull()
      .references(() => empresa.id, { onDelete: "cascade" }),
    // Número sequencial POR empresa (alocado pela app via empresa.prox_num_visita).
    numero: integer("numero").notNull(),
    clienteId: uuid("cliente_id")
      .notNull()
      .references(() => cliente.id, { onDelete: "restrict" }),
    tecnicoId: uuid("tecnico_id").references(() => utilizador.id, {
      onDelete: "set null",
    }),
    estado: estadoVisitaEnum("estado").notNull().default("AGENDADO"),
    titulo: text("titulo"),
    descricao: text("descricao"),
    moradaServico: text("morada_servico"),
    cidade: text("cidade"),
    agendadoPara: timestamp("agendado_para", { withTimezone: true }).notNull(),
    duracaoMin: integer("duracao_min"),
    concluidoEm: timestamp("concluido_em", { withTimezone: true }),
    deslocacao: numeric("deslocacao", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    valor: numeric("valor", { precision: 10, scale: 2 }).notNull().default("0"),
    kmPercorridos: numeric("km_percorridos", { precision: 8, scale: 1 })
      .notNull()
      .default("0"),
    // Assinatura do cliente (módulo Ordens de Serviço) — path no Storage.
    assinaturaPath: text("assinatura_path"),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
    atualizadoEm: timestamp("atualizado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("uq_visita_empresa_numero").on(t.empresaId, t.numero),
    index("idx_visita_empresa_agendado").on(t.empresaId, t.agendadoPara),
    index("idx_visita_empresa_estado_agendado").on(
      t.empresaId,
      t.estado,
      t.agendadoPara
    ),
    index("idx_visita_cliente").on(t.clienteId),
    index("idx_visita_tecnico").on(t.tecnicoId),
  ]
)

/* ------------------------------------------------------------------ */
/* Serviço (linha dentro de uma visita)                                */
/* ------------------------------------------------------------------ */

export const servico = pgTable(
  "servico",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    empresaId: uuid("empresa_id")
      .notNull()
      .references(() => empresa.id, { onDelete: "cascade" }),
    visitaId: uuid("visita_id")
      .notNull()
      .references(() => visita.id, { onDelete: "cascade" }),
    categoria: categoriaServicoEnum("categoria").notNull(),
    titulo: text("titulo").notNull(),
    descricao: text("descricao"),
    maoDeObra: numeric("mao_de_obra", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    material: numeric("material", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    valor: numeric("valor", { precision: 10, scale: 2 }).notNull().default("0"),
    ordem: integer("ordem").notNull().default(0),
  },
  (t) => [
    index("idx_servico_visita").on(t.visitaId),
    index("idx_servico_empresa").on(t.empresaId),
  ]
)

/* ------------------------------------------------------------------ */
/* Orçamento + linhas                                                  */
/* ------------------------------------------------------------------ */

export const orcamento = pgTable(
  "orcamento",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    empresaId: uuid("empresa_id")
      .notNull()
      .references(() => empresa.id, { onDelete: "cascade" }),
    // Número sequencial POR empresa (alocado via empresa.prox_num_orcamento).
    numero: integer("numero").notNull(),
    clienteId: uuid("cliente_id")
      .notNull()
      .references(() => cliente.id, { onDelete: "restrict" }),
    visitaId: uuid("visita_id").references(() => visita.id, {
      onDelete: "set null",
    }),
    tecnicoId: uuid("tecnico_id").references(() => utilizador.id, {
      onDelete: "set null",
    }),
    estado: estadoOrcamentoEnum("estado").notNull().default("RASCUNHO"),
    categoria: categoriaServicoEnum("categoria").notNull().default("OUTROS"),
    titulo: text("titulo").notNull(),
    descricao: text("descricao"),
    // Local da obra (morada do serviço) — mostrado no PDF.
    morada: text("morada"),
    cidade: text("cidade"),
    validade: date("validade"),
    taxaIva: numeric("taxa_iva", { precision: 4, scale: 2 })
      .notNull()
      .default("23"),
    subtotal: numeric("subtotal", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    totalIva: numeric("total_iva", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    total: numeric("total", { precision: 10, scale: 2 }).notNull().default("0"),
    enviadoEm: timestamp("enviado_em", { withTimezone: true }),
    aceiteEm: timestamp("aceite_em", { withTimezone: true }),
    pdfPath: text("pdf_path"),
    notas: text("notas"),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
    atualizadoEm: timestamp("atualizado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("uq_orcamento_empresa_numero").on(t.empresaId, t.numero),
    index("idx_orcamento_empresa_estado").on(t.empresaId, t.estado),
    index("idx_orcamento_cliente").on(t.clienteId),
    index("idx_orcamento_visita").on(t.visitaId),
  ]
)

export const orcamentoItem = pgTable(
  "orcamento_item",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    empresaId: uuid("empresa_id")
      .notNull()
      .references(() => empresa.id, { onDelete: "cascade" }),
    orcamentoId: uuid("orcamento_id")
      .notNull()
      .references(() => orcamento.id, { onDelete: "cascade" }),
    descricao: text("descricao").notNull(),
    quantidade: numeric("quantidade", { precision: 10, scale: 2 })
      .notNull()
      .default("1"),
    precoUnit: numeric("preco_unit", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    totalLinha: numeric("total_linha", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    ordem: integer("ordem").notNull().default(0),
  },
  (t) => [index("idx_orcamento_item_orcamento").on(t.orcamentoId)]
)

/* ------------------------------------------------------------------ */
/* Fotos antes/depois (por visita)                                     */
/* ------------------------------------------------------------------ */

export const foto = pgTable(
  "foto",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    empresaId: uuid("empresa_id")
      .notNull()
      .references(() => empresa.id, { onDelete: "cascade" }),
    visitaId: uuid("visita_id")
      .notNull()
      .references(() => visita.id, { onDelete: "cascade" }),
    tipo: tipoFotoEnum("tipo").notNull(),
    storagePath: text("storage_path").notNull(),
    ordem: integer("ordem").notNull().default(0),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("idx_foto_visita").on(t.visitaId)]
)

/* ------------------------------------------------------------------ */
/* Avaliação (por visita)                                              */
/* ------------------------------------------------------------------ */

export const avaliacao = pgTable(
  "avaliacao",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    empresaId: uuid("empresa_id")
      .notNull()
      .references(() => empresa.id, { onDelete: "cascade" }),
    visitaId: uuid("visita_id")
      .notNull()
      .unique()
      .references(() => visita.id, { onDelete: "cascade" }),
    clienteId: uuid("cliente_id")
      .notNull()
      .references(() => cliente.id, { onDelete: "cascade" }),
    nota: smallint("nota").notNull(),
    comentario: text("comentario"),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("idx_avaliacao_cliente").on(t.clienteId),
    check("avaliacao_nota_check", sql`${t.nota} >= 1 and ${t.nota} <= 5`),
  ]
)

/* ------------------------------------------------------------------ */
/* Transação financeira (entradas/saídas)                              */
/* ------------------------------------------------------------------ */

export const transacaoFinanceira = pgTable(
  "transacao_financeira",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    empresaId: uuid("empresa_id")
      .notNull()
      .references(() => empresa.id, { onDelete: "cascade" }),
    tipo: tipoTransacaoEnum("tipo").notNull(),
    categoria: categoriaTransacaoEnum("categoria").notNull(),
    valor: numeric("valor", { precision: 10, scale: 2 }).notNull(),
    data: date("data").notNull(),
    descricao: text("descricao"),
    visitaId: uuid("visita_id").references(() => visita.id, {
      onDelete: "set null",
    }),
    clienteId: uuid("cliente_id").references(() => cliente.id, {
      onDelete: "set null",
    }),
    metodoPagamento: metodoPagamentoEnum("metodo_pagamento"),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("idx_tx_empresa_data").on(t.empresaId, t.data),
    index("idx_tx_empresa_tipo_data").on(t.empresaId, t.tipo, t.data),
    index("idx_tx_visita").on(t.visitaId),
  ]
)

/* ------------------------------------------------------------------ */
/* Produto em estoque (Fase 3)                                         */
/* ------------------------------------------------------------------ */

export const produtoEstoque = pgTable(
  "produto_estoque",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    empresaId: uuid("empresa_id")
      .notNull()
      .references(() => empresa.id, { onDelete: "cascade" }),
    nome: text("nome").notNull(),
    sku: text("sku"),
    unidade: text("unidade").notNull().default("un"),
    quantidade: numeric("quantidade", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    quantidadeMin: numeric("quantidade_min", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    custoUnit: numeric("custo_unit", { precision: 10, scale: 2 }),
    precoVenda: numeric("preco_venda", { precision: 10, scale: 2 }),
    fornecedor: text("fornecedor"),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
    atualizadoEm: timestamp("atualizado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("idx_produto_empresa").on(t.empresaId),
    uniqueIndex("uq_produto_empresa_sku").on(t.empresaId, t.sku),
  ]
)

/* ------------------------------------------------------------------ */
/* Pagamento (ledger da PLATAFORMA: mensalidades pagas pelos tenants)   */
/*                                                                     */
/* NÃO são dados de negócio do tenant — é o registo do aluguer que cada */
/* empresa cliente paga ao dono da plataforma. Só o super-admin acede   */
/* (via Drizzle). Cada `registarPagamento` insere uma linha.            */
/* ------------------------------------------------------------------ */

export const pagamento = pgTable(
  "pagamento",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    empresaId: uuid("empresa_id")
      .notNull()
      .references(() => empresa.id, { onDelete: "cascade" }),
    valor: numeric("valor", { precision: 10, scale: 2 }).notNull(),
    data: date("data").notNull(),
    // Data até à qual o acesso ficou válido após este pagamento (histórico).
    periodoAte: timestamp("periodo_ate", { withTimezone: true }),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("idx_pagamento_empresa").on(t.empresaId)]
)

/* ------------------------------------------------------------------ */
/* Relações                                                            */
/* ------------------------------------------------------------------ */

export const empresaRelations = relations(empresa, ({ many }) => ({
  utilizadores: many(utilizador),
  clientes: many(cliente),
  visitas: many(visita),
  orcamentos: many(orcamento),
  transacoes: many(transacaoFinanceira),
  produtos: many(produtoEstoque),
  pagamentos: many(pagamento),
}))

export const pagamentoRelations = relations(pagamento, ({ one }) => ({
  empresa: one(empresa, {
    fields: [pagamento.empresaId],
    references: [empresa.id],
  }),
}))

export const utilizadorRelations = relations(utilizador, ({ one, many }) => ({
  empresa: one(empresa, {
    fields: [utilizador.empresaId],
    references: [empresa.id],
  }),
  visitas: many(visita),
  orcamentos: many(orcamento),
}))

export const clienteRelations = relations(cliente, ({ one, many }) => ({
  empresa: one(empresa, {
    fields: [cliente.empresaId],
    references: [empresa.id],
  }),
  visitas: many(visita),
  orcamentos: many(orcamento),
  avaliacoes: many(avaliacao),
  transacoes: many(transacaoFinanceira),
}))

export const visitaRelations = relations(visita, ({ one, many }) => ({
  empresa: one(empresa, {
    fields: [visita.empresaId],
    references: [empresa.id],
  }),
  cliente: one(cliente, {
    fields: [visita.clienteId],
    references: [cliente.id],
  }),
  tecnico: one(utilizador, {
    fields: [visita.tecnicoId],
    references: [utilizador.id],
  }),
  servicos: many(servico),
  orcamentos: many(orcamento),
  fotos: many(foto),
  avaliacao: one(avaliacao),
  transacoes: many(transacaoFinanceira),
}))

export const servicoRelations = relations(servico, ({ one }) => ({
  empresa: one(empresa, {
    fields: [servico.empresaId],
    references: [empresa.id],
  }),
  visita: one(visita, {
    fields: [servico.visitaId],
    references: [visita.id],
  }),
}))

export const orcamentoRelations = relations(orcamento, ({ one, many }) => ({
  empresa: one(empresa, {
    fields: [orcamento.empresaId],
    references: [empresa.id],
  }),
  cliente: one(cliente, {
    fields: [orcamento.clienteId],
    references: [cliente.id],
  }),
  visita: one(visita, {
    fields: [orcamento.visitaId],
    references: [visita.id],
  }),
  tecnico: one(utilizador, {
    fields: [orcamento.tecnicoId],
    references: [utilizador.id],
  }),
  itens: many(orcamentoItem),
}))

export const orcamentoItemRelations = relations(orcamentoItem, ({ one }) => ({
  empresa: one(empresa, {
    fields: [orcamentoItem.empresaId],
    references: [empresa.id],
  }),
  orcamento: one(orcamento, {
    fields: [orcamentoItem.orcamentoId],
    references: [orcamento.id],
  }),
}))

export const fotoRelations = relations(foto, ({ one }) => ({
  empresa: one(empresa, {
    fields: [foto.empresaId],
    references: [empresa.id],
  }),
  visita: one(visita, {
    fields: [foto.visitaId],
    references: [visita.id],
  }),
}))

export const avaliacaoRelations = relations(avaliacao, ({ one }) => ({
  empresa: one(empresa, {
    fields: [avaliacao.empresaId],
    references: [empresa.id],
  }),
  visita: one(visita, {
    fields: [avaliacao.visitaId],
    references: [visita.id],
  }),
  cliente: one(cliente, {
    fields: [avaliacao.clienteId],
    references: [cliente.id],
  }),
}))

export const transacaoRelations = relations(
  transacaoFinanceira,
  ({ one }) => ({
    empresa: one(empresa, {
      fields: [transacaoFinanceira.empresaId],
      references: [empresa.id],
    }),
    visita: one(visita, {
      fields: [transacaoFinanceira.visitaId],
      references: [visita.id],
    }),
    cliente: one(cliente, {
      fields: [transacaoFinanceira.clienteId],
      references: [cliente.id],
    }),
  })
)

export const produtoEstoqueRelations = relations(produtoEstoque, ({ one }) => ({
  empresa: one(empresa, {
    fields: [produtoEstoque.empresaId],
    references: [empresa.id],
  }),
}))

/* ------------------------------------------------------------------ */
/* Tipos inferidos                                                     */
/* ------------------------------------------------------------------ */

export type Empresa = typeof empresa.$inferSelect
export type NovaEmpresa = typeof empresa.$inferInsert
export type Utilizador = typeof utilizador.$inferSelect
export type NovoUtilizador = typeof utilizador.$inferInsert
export type Cliente = typeof cliente.$inferSelect
export type NovoCliente = typeof cliente.$inferInsert
export type Visita = typeof visita.$inferSelect
export type NovaVisita = typeof visita.$inferInsert
export type Servico = typeof servico.$inferSelect
export type Orcamento = typeof orcamento.$inferSelect
export type OrcamentoItem = typeof orcamentoItem.$inferSelect
export type Foto = typeof foto.$inferSelect
export type Avaliacao = typeof avaliacao.$inferSelect
export type TransacaoFinanceira = typeof transacaoFinanceira.$inferSelect
export type ProdutoEstoque = typeof produtoEstoque.$inferSelect
export type Pagamento = typeof pagamento.$inferSelect

/**
 * @deprecated A configuração da empresa passou a viver na tabela `empresa`
 * (1 empresa = a sua configuração). Mantido como alias de tipo para
 * compatibilidade de código antigo; usar `Empresa`.
 */
export type Configuracao = Empresa
