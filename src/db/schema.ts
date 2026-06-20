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
  pgSequence,
  pgTable,
  smallint,
  text,
  timestamp,
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
/* Sequências de numeração                                             */
/* ------------------------------------------------------------------ */

export const visitaNumeroSeq = pgSequence("visita_numero_seq", { startWith: 1 })
export const orcamentoNumeroSeq = pgSequence("orcamento_numero_seq", {
  startWith: 1,
})

/* ------------------------------------------------------------------ */
/* Utilizador                                                          */
/* ------------------------------------------------------------------ */

export const utilizador = pgTable("utilizador", {
  id: uuid("id").primaryKey(),
  nome: text("nome").notNull(),
  email: text("email").notNull().unique(),
  telefone: text("telefone"),
  role: utilizadorRoleEnum("role").notNull().default("OWNER"),
  ativo: boolean("ativo").notNull().default(true),
  corAgenda: text("cor_agenda"),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
})

/* ------------------------------------------------------------------ */
/* Cliente                                                             */
/* ------------------------------------------------------------------ */

export const cliente = pgTable(
  "cliente",
  {
    id: uuid("id").primaryKey().defaultRandom(),
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
    index("idx_cliente_nome").on(t.nome),
    index("idx_cliente_cidade").on(t.cidade),
  ]
)

/* ------------------------------------------------------------------ */
/* Visita (unidade agendável: cliente + data + N serviços)             */
/* ------------------------------------------------------------------ */

export const visita = pgTable(
  "visita",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    numero: integer("numero")
      .notNull()
      .unique()
      .default(sql`nextval('visita_numero_seq')`),
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
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
    atualizadoEm: timestamp("atualizado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("idx_visita_agendado").on(t.agendadoPara),
    index("idx_visita_estado").on(t.estado),
    index("idx_visita_cliente").on(t.clienteId),
    index("idx_visita_estado_agendado").on(t.estado, t.agendadoPara),
  ]
)

/* ------------------------------------------------------------------ */
/* Serviço (linha dentro de uma visita)                                */
/* ------------------------------------------------------------------ */

export const servico = pgTable(
  "servico",
  {
    id: uuid("id").primaryKey().defaultRandom(),
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
  (t) => [index("idx_servico_visita").on(t.visitaId)]
)

/* ------------------------------------------------------------------ */
/* Orçamento + linhas                                                  */
/* ------------------------------------------------------------------ */

export const orcamento = pgTable(
  "orcamento",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    numero: integer("numero")
      .notNull()
      .unique()
      .default(sql`nextval('orcamento_numero_seq')`),
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
    index("idx_orcamento_cliente").on(t.clienteId),
    index("idx_orcamento_visita").on(t.visitaId),
    index("idx_orcamento_estado").on(t.estado),
  ]
)

export const orcamentoItem = pgTable(
  "orcamento_item",
  {
    id: uuid("id").primaryKey().defaultRandom(),
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
    index("idx_tx_data").on(t.data),
    index("idx_tx_tipo_data").on(t.tipo, t.data),
    index("idx_tx_visita").on(t.visitaId),
  ]
)

/* ------------------------------------------------------------------ */
/* Produto em estoque (Fase 3)                                         */
/* ------------------------------------------------------------------ */

export const produtoEstoque = pgTable("produto_estoque", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull(),
  sku: text("sku").unique(),
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
})

/* ------------------------------------------------------------------ */
/* Configuração da empresa (linha única) — usada no PDF e na marca      */
/* ------------------------------------------------------------------ */

export const configuracao = pgTable("configuracao", {
  id: uuid("id").primaryKey().defaultRandom(),
  nomeEmpresa: text("nome_empresa").notNull().default("PN Reparações"),
  slogan: text("slogan"),
  nif: text("nif"),
  telefone: text("telefone"),
  email: text("email"),
  morada: text("morada"),
  iban: text("iban"),
  logoPath: text("logo_path"),
  atualizadoEm: timestamp("atualizado_em", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

/* ------------------------------------------------------------------ */
/* Relações                                                            */
/* ------------------------------------------------------------------ */

export const clienteRelations = relations(cliente, ({ many }) => ({
  visitas: many(visita),
  orcamentos: many(orcamento),
  avaliacoes: many(avaliacao),
  transacoes: many(transacaoFinanceira),
}))

export const visitaRelations = relations(visita, ({ one, many }) => ({
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
  visita: one(visita, {
    fields: [servico.visitaId],
    references: [visita.id],
  }),
}))

export const orcamentoRelations = relations(orcamento, ({ one, many }) => ({
  cliente: one(cliente, {
    fields: [orcamento.clienteId],
    references: [cliente.id],
  }),
  visita: one(visita, {
    fields: [orcamento.visitaId],
    references: [visita.id],
  }),
  itens: many(orcamentoItem),
}))

export const orcamentoItemRelations = relations(orcamentoItem, ({ one }) => ({
  orcamento: one(orcamento, {
    fields: [orcamentoItem.orcamentoId],
    references: [orcamento.id],
  }),
}))

export const fotoRelations = relations(foto, ({ one }) => ({
  visita: one(visita, {
    fields: [foto.visitaId],
    references: [visita.id],
  }),
}))

export const avaliacaoRelations = relations(avaliacao, ({ one }) => ({
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

/* ------------------------------------------------------------------ */
/* Tipos inferidos                                                     */
/* ------------------------------------------------------------------ */

export type Utilizador = typeof utilizador.$inferSelect
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
export type Configuracao = typeof configuracao.$inferSelect
