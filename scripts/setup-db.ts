/**
 * Configuração inicial da base de dados:
 *  1. Ativa RLS (Row Level Security) em todas as tabelas de dados. NÃO cria
 *     políticas permissivas — a isolação por empresa é feita em código (Drizzle
 *     liga como dono e contorna o RLS). Com RLS ligado e sem políticas, qualquer
 *     acesso via API pública (anon/authenticated) fica bloqueado por omissão.
 *  2. Cria o utilizador dono (Supabase Auth) + linha em `utilizador`, associado
 *     a uma empresa (tenant).
 *
 * Executar: npx tsx scripts/setup-db.ts
 */
import { randomBytes } from "node:crypto"

import { config } from "dotenv"
import postgres from "postgres"
import { createClient } from "@supabase/supabase-js"

config({ path: ".env.local" })

const TABELAS = [
  "empresa",
  "utilizador",
  "cliente",
  "visita",
  "orcamento",
  "orcamento_item",
  "servico",
  "foto",
  "avaliacao",
  "transacao_financeira",
  "produto_estoque",
]

const OWNER_EMAIL = "andre.oliveira@sanches.io"

async function aplicarRls() {
  const sql = postgres(process.env.MIGRATION_URL!, { prepare: false, max: 1 })
  for (const t of TABELAS) {
    await sql.unsafe(`alter table "${t}" enable row level security;`)
    // Remove qualquer política permissiva antiga (anulava a isolação por
    // empresa). NÃO recriar — sem política, o acesso via API pública fica
    // bloqueado por omissão e o Drizzle (dono) continua a contornar o RLS.
    await sql.unsafe(`drop policy if exists "${t}_auth_all" on "${t}";`)
  }
  await sql.end()
  console.log(`✓ RLS ativado (sem políticas permissivas) em ${TABELAS.length} tabelas.`)
}

async function criarDono() {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )

  const password =
    process.env.OWNER_PASSWORD ??
    `PN-${randomBytes(4).toString("hex")}-${randomBytes(2).toString("hex")}`

  let userId: string | undefined

  const { data, error } = await admin.auth.admin.createUser({
    email: OWNER_EMAIL,
    password,
    email_confirm: true,
    user_metadata: { nome: "PN Reparações" },
  })

  if (error) {
    console.log(`ℹ createUser: ${error.message} — a procurar utilizador existente...`)
    const { data: list } = await admin.auth.admin.listUsers()
    userId = list?.users.find((u) => u.email === OWNER_EMAIL)?.id
    console.log("ℹ Utilizador já existia — password não alterada.")
  } else {
    userId = data.user?.id
    console.log("\n==================== CREDENCIAIS DE ACESSO ====================")
    console.log(`  Email:    ${OWNER_EMAIL}`)
    console.log(`  Password: ${password}`)
    console.log("  (temporária — poderá alterá-la mais tarde)")
    console.log("===============================================================\n")
  }

  if (!userId) throw new Error("Não foi possível obter o id do utilizador.")

  const sql = postgres(process.env.MIGRATION_URL!, { prepare: false, max: 1 })

  // Empresa (tenant) à qual o dono fica associado. Usa a existente ou cria uma.
  const existentes = await sql`select id from empresa limit 1`
  let empresaId = existentes[0]?.id as string | undefined
  if (!empresaId) {
    const [nova] = await sql`
      insert into empresa (nome) values ('PN REPARAÇÕES') returning id
    `
    empresaId = nova.id as string
    console.log("✓ Empresa 'PN REPARAÇÕES' criada.")
  }

  await sql.unsafe(
    `insert into "utilizador" (id, empresa_id, nome, email, role)
     values ('${userId}', '${empresaId}', 'PN Reparações', '${OWNER_EMAIL}', 'OWNER')
     on conflict (id) do nothing;`
  )
  await sql.end()
  console.log(`✓ Utilizador dono pronto (${OWNER_EMAIL}).`)
}

async function main() {
  await aplicarRls()
  await criarDono()
  console.log("\n✅ Configuração da base de dados concluída.")
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("❌ Erro:", e)
    process.exit(1)
  })
