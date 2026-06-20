CREATE TABLE "configuracao" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome_empresa" text DEFAULT 'PN Reparações' NOT NULL,
	"slogan" text,
	"nif" text,
	"telefone" text,
	"email" text,
	"morada" text,
	"iban" text,
	"logo_path" text,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
