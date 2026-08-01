/**
 * Migração para MULTI-PAÍS + MULTI-IDIOMA. Idempotente e aditiva:
 *  1. tipo enum `pais` (PT/ES/FR) e `empresa.pais` (default PT);
 *  2. tipo enum `idioma` (pt/es/fr) e `utilizador.idioma` (null = segue o país).
 *
 * As empresas que já existem ficam todas em Portugal, como estavam.
 * Executar: npx tsx scripts/migrar-i18n.ts
 */
import { config } from "dotenv"
import postgres from "postgres"

config({ path: ".env.local" })

async function main() {
  const url = process.env.MIGRATION_URL ?? process.env.DATABASE_URL
  if (!url) throw new Error("Falta MIGRATION_URL/DATABASE_URL no .env.local")
  const sql = postgres(url, { max: 1, prepare: false })

  await sql`
    do $$ begin
      create type pais as enum ('PT', 'ES', 'FR');
    exception when duplicate_object then null; end $$;
  `
  await sql`
    do $$ begin
      create type idioma as enum ('pt', 'es', 'fr');
    exception when duplicate_object then null; end $$;
  `
  await sql`
    alter table empresa
      add column if not exists pais pais not null default 'PT'
  `
  await sql`
    alter table utilizador
      add column if not exists idioma idioma
  `

  const [{ n }] = await sql`select count(*)::int as n from empresa where pais = 'PT'`
  console.log(`✅ Migração aplicada. Empresas em PT: ${n}`)
  await sql.end()
  process.exit(0)
}

main().catch((e) => {
  console.error("❌ Erro:", e instanceof Error ? e.message : e)
  process.exit(1)
})
