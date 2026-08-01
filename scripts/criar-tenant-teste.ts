/**
 * Cria um cliente (tenant) de teste num país à escolha, com o dono já criado.
 *   npx tsx scripts/criar-tenant-teste.ts <PT|ES|FR> <email> <password> [nome]
 * Apagar depois com: npx tsx scripts/apagar-empresa.ts <id> --sim
 */
import { config } from "dotenv"
config({ path: ".env.local" })

const IVA: Record<string, string> = { PT: "23", ES: "21", FR: "20" }

async function main() {
  const [pais, email, password, ...resto] = process.argv.slice(2)
  if (!pais || !email || !password || !IVA[pais]) {
    console.error(
      "Uso: npx tsx scripts/criar-tenant-teste.ts <PT|ES|FR> <email> <password> [nome]"
    )
    process.exit(1)
  }
  const nome = resto.join(" ") || `Teste ${pais}`

  const { db, schema } = await import("../src/db/client")
  const { createClient } = await import("@supabase/supabase-js")
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error || !data?.user) throw new Error(error?.message ?? "sem utilizador")

  const [emp] = await db
    .insert(schema.empresa)
    .values({
      nome,
      pais: pais as "PT" | "ES" | "FR",
      taxaIvaPadrao: IVA[pais],
      // 30 dias de acesso, chega para experimentar.
      acessoAte: new Date(Date.now() + 30 * 86_400_000),
      limiteFuncionarios: 2,
      modulos: ["ordens_servico"],
    })
    .returning({ id: schema.empresa.id })

  await db.insert(schema.utilizador).values({
    id: data.user.id,
    empresaId: emp.id,
    nome: "Dono de teste",
    email,
    role: "OWNER",
    ativo: true,
  })

  console.log(`✅ ${nome} (${pais})  id=${emp.id}  login=${email} / ${password}`)
  process.exit(0)
}

main().catch((e) => {
  console.error("❌ Erro:", e instanceof Error ? e.message : e)
  process.exit(1)
})
