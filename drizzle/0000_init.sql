CREATE TYPE "public"."categoria_servico" AS ENUM('ELETRICIDADE', 'CANALIZACAO', 'PINTURA', 'MONTAGEM_MOVEIS', 'INSTALACAO_CANDEEIROS', 'PEQUENAS_REPARACOES', 'OUTROS');--> statement-breakpoint
CREATE TYPE "public"."categoria_transacao" AS ENUM('SERVICO', 'ADIANTAMENTO', 'MATERIAL', 'COMBUSTIVEL', 'FERRAMENTA', 'PUBLICIDADE', 'IMPOSTO', 'OUTRO');--> statement-breakpoint
CREATE TYPE "public"."estado_orcamento" AS ENUM('RASCUNHO', 'ENVIADO', 'ACEITE', 'RECUSADO', 'EXPIRADO');--> statement-breakpoint
CREATE TYPE "public"."estado_visita" AS ENUM('AGENDADO', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO');--> statement-breakpoint
CREATE TYPE "public"."metodo_pagamento" AS ENUM('DINHEIRO', 'MBWAY', 'TRANSFERENCIA', 'MULTIBANCO', 'OUTRO');--> statement-breakpoint
CREATE TYPE "public"."tipo_foto" AS ENUM('ANTES', 'DEPOIS');--> statement-breakpoint
CREATE TYPE "public"."tipo_transacao" AS ENUM('ENTRADA', 'SAIDA');--> statement-breakpoint
CREATE TYPE "public"."utilizador_role" AS ENUM('OWNER', 'TECNICO', 'ADMIN');--> statement-breakpoint
CREATE SEQUENCE "public"."orcamento_numero_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE SEQUENCE "public"."visita_numero_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE TABLE "avaliacao" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"visita_id" uuid NOT NULL,
	"cliente_id" uuid NOT NULL,
	"nota" smallint NOT NULL,
	"comentario" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "avaliacao_visita_id_unique" UNIQUE("visita_id"),
	CONSTRAINT "avaliacao_nota_check" CHECK ("avaliacao"."nota" >= 1 and "avaliacao"."nota" <= 5)
);
--> statement-breakpoint
CREATE TABLE "cliente" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"telefone" text NOT NULL,
	"email" text,
	"nif" text,
	"morada" text,
	"cidade" text,
	"codigo_postal" text,
	"latitude" double precision,
	"longitude" double precision,
	"notas" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "foto" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"visita_id" uuid NOT NULL,
	"tipo" "tipo_foto" NOT NULL,
	"storage_path" text NOT NULL,
	"ordem" integer DEFAULT 0 NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orcamento" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"numero" integer DEFAULT nextval('orcamento_numero_seq') NOT NULL,
	"cliente_id" uuid NOT NULL,
	"visita_id" uuid,
	"tecnico_id" uuid,
	"estado" "estado_orcamento" DEFAULT 'RASCUNHO' NOT NULL,
	"categoria" "categoria_servico" DEFAULT 'OUTROS' NOT NULL,
	"titulo" text NOT NULL,
	"descricao" text,
	"validade" date,
	"taxa_iva" numeric(4, 2) DEFAULT '23' NOT NULL,
	"subtotal" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_iva" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total" numeric(10, 2) DEFAULT '0' NOT NULL,
	"enviado_em" timestamp with time zone,
	"aceite_em" timestamp with time zone,
	"pdf_path" text,
	"notas" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orcamento_numero_unique" UNIQUE("numero")
);
--> statement-breakpoint
CREATE TABLE "orcamento_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"orcamento_id" uuid NOT NULL,
	"descricao" text NOT NULL,
	"quantidade" numeric(10, 2) DEFAULT '1' NOT NULL,
	"preco_unit" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_linha" numeric(10, 2) DEFAULT '0' NOT NULL,
	"ordem" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "produto_estoque" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"sku" text,
	"unidade" text DEFAULT 'un' NOT NULL,
	"quantidade" numeric(10, 2) DEFAULT '0' NOT NULL,
	"quantidade_min" numeric(10, 2) DEFAULT '0' NOT NULL,
	"custo_unit" numeric(10, 2),
	"preco_venda" numeric(10, 2),
	"fornecedor" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "produto_estoque_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "servico" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"visita_id" uuid NOT NULL,
	"categoria" "categoria_servico" NOT NULL,
	"titulo" text NOT NULL,
	"descricao" text,
	"mao_de_obra" numeric(10, 2) DEFAULT '0' NOT NULL,
	"material" numeric(10, 2) DEFAULT '0' NOT NULL,
	"valor" numeric(10, 2) DEFAULT '0' NOT NULL,
	"ordem" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transacao_financeira" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tipo" "tipo_transacao" NOT NULL,
	"categoria" "categoria_transacao" NOT NULL,
	"valor" numeric(10, 2) NOT NULL,
	"data" date NOT NULL,
	"descricao" text,
	"visita_id" uuid,
	"cliente_id" uuid,
	"metodo_pagamento" "metodo_pagamento",
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "utilizador" (
	"id" uuid PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"email" text NOT NULL,
	"telefone" text,
	"role" "utilizador_role" DEFAULT 'OWNER' NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"cor_agenda" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "utilizador_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "visita" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"numero" integer DEFAULT nextval('visita_numero_seq') NOT NULL,
	"cliente_id" uuid NOT NULL,
	"tecnico_id" uuid,
	"estado" "estado_visita" DEFAULT 'AGENDADO' NOT NULL,
	"titulo" text,
	"descricao" text,
	"morada_servico" text,
	"cidade" text,
	"agendado_para" timestamp with time zone NOT NULL,
	"duracao_min" integer,
	"concluido_em" timestamp with time zone,
	"deslocacao" numeric(10, 2) DEFAULT '0' NOT NULL,
	"valor" numeric(10, 2) DEFAULT '0' NOT NULL,
	"km_percorridos" numeric(8, 1) DEFAULT '0' NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "visita_numero_unique" UNIQUE("numero")
);
--> statement-breakpoint
ALTER TABLE "avaliacao" ADD CONSTRAINT "avaliacao_visita_id_visita_id_fk" FOREIGN KEY ("visita_id") REFERENCES "public"."visita"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "avaliacao" ADD CONSTRAINT "avaliacao_cliente_id_cliente_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."cliente"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "foto" ADD CONSTRAINT "foto_visita_id_visita_id_fk" FOREIGN KEY ("visita_id") REFERENCES "public"."visita"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orcamento" ADD CONSTRAINT "orcamento_cliente_id_cliente_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."cliente"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orcamento" ADD CONSTRAINT "orcamento_visita_id_visita_id_fk" FOREIGN KEY ("visita_id") REFERENCES "public"."visita"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orcamento" ADD CONSTRAINT "orcamento_tecnico_id_utilizador_id_fk" FOREIGN KEY ("tecnico_id") REFERENCES "public"."utilizador"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orcamento_item" ADD CONSTRAINT "orcamento_item_orcamento_id_orcamento_id_fk" FOREIGN KEY ("orcamento_id") REFERENCES "public"."orcamento"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "servico" ADD CONSTRAINT "servico_visita_id_visita_id_fk" FOREIGN KEY ("visita_id") REFERENCES "public"."visita"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transacao_financeira" ADD CONSTRAINT "transacao_financeira_visita_id_visita_id_fk" FOREIGN KEY ("visita_id") REFERENCES "public"."visita"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transacao_financeira" ADD CONSTRAINT "transacao_financeira_cliente_id_cliente_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."cliente"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visita" ADD CONSTRAINT "visita_cliente_id_cliente_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."cliente"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visita" ADD CONSTRAINT "visita_tecnico_id_utilizador_id_fk" FOREIGN KEY ("tecnico_id") REFERENCES "public"."utilizador"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_avaliacao_cliente" ON "avaliacao" USING btree ("cliente_id");--> statement-breakpoint
CREATE INDEX "idx_cliente_nome" ON "cliente" USING btree ("nome");--> statement-breakpoint
CREATE INDEX "idx_cliente_cidade" ON "cliente" USING btree ("cidade");--> statement-breakpoint
CREATE INDEX "idx_foto_visita" ON "foto" USING btree ("visita_id");--> statement-breakpoint
CREATE INDEX "idx_orcamento_cliente" ON "orcamento" USING btree ("cliente_id");--> statement-breakpoint
CREATE INDEX "idx_orcamento_visita" ON "orcamento" USING btree ("visita_id");--> statement-breakpoint
CREATE INDEX "idx_orcamento_estado" ON "orcamento" USING btree ("estado");--> statement-breakpoint
CREATE INDEX "idx_orcamento_item_orcamento" ON "orcamento_item" USING btree ("orcamento_id");--> statement-breakpoint
CREATE INDEX "idx_servico_visita" ON "servico" USING btree ("visita_id");--> statement-breakpoint
CREATE INDEX "idx_tx_data" ON "transacao_financeira" USING btree ("data");--> statement-breakpoint
CREATE INDEX "idx_tx_tipo_data" ON "transacao_financeira" USING btree ("tipo","data");--> statement-breakpoint
CREATE INDEX "idx_tx_visita" ON "transacao_financeira" USING btree ("visita_id");--> statement-breakpoint
CREATE INDEX "idx_visita_agendado" ON "visita" USING btree ("agendado_para");--> statement-breakpoint
CREATE INDEX "idx_visita_estado" ON "visita" USING btree ("estado");--> statement-breakpoint
CREATE INDEX "idx_visita_cliente" ON "visita" USING btree ("cliente_id");--> statement-breakpoint
CREATE INDEX "idx_visita_estado_agendado" ON "visita" USING btree ("estado","agendado_para");