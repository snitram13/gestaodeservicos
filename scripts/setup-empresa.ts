/** Cria o bucket do logótipo, RLS e a linha de configuração. npx tsx scripts/setup-empresa.ts */
import { config } from "dotenv"
import { createClient } from "@supabase/supabase-js"
import postgres from "postgres"

config({ path: ".env.local" })

async function main() {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )

  const { error: be } = await admin.storage.createBucket("empresa", {
    public: true,
    fileSizeLimit: "2MB",
  })
  console.log("bucket 'empresa':", be ? be.message : "criado")

  const sql = postgres(process.env.MIGRATION_URL!, { prepare: false, max: 1 })
  await sql.unsafe(`alter table "configuracao" enable row level security`)
  await sql.unsafe(`drop policy if exists "configuracao_auth_all" on "configuracao"`)
  await sql.unsafe(
    `create policy "configuracao_auth_all" on "configuracao" for all to authenticated using (true) with check (true)`
  )

  const existing = await sql`select id from configuracao limit 1`
  if (existing.length === 0) {
    await sql`insert into configuracao (nome_empresa, slogan, email) values ('PN Reparações', 'Reparações ao domicílio · Grande Porto', 'andre.oliveira@sanches.io')`
    console.log("✓ linha de configuração criada")
  } else {
    console.log("✓ configuração já existe")
  }

  await sql.end()
  console.log("✅ Empresa configurada.")
}

main().catch((e) => {
  console.error("❌ Erro:", e instanceof Error ? e.message : e)
  process.exit(1)
})
