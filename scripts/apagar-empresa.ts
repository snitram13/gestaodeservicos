/**
 * Apaga por completo uma empresa (tenant): dados de negócio, ficheiros no
 * storage, contas de login (Supabase Auth) e a própria empresa.
 * IRREVERSÍVEL. Exige confirmação explícita:
 *   npx tsx scripts/apagar-empresa.ts <empresaId> --sim
 */
import { config } from "dotenv"
config({ path: ".env.local" })

async function main() {
  const empresaId = process.argv[2]
  const confirmado = process.argv.includes("--sim")
  if (!empresaId) {
    console.error("Uso: npx tsx scripts/apagar-empresa.ts <empresaId> --sim")
    process.exit(1)
  }

  const { db, schema } = await import("../src/db/client")
  const { eq } = await import("drizzle-orm")
  // Cliente admin criado aqui (o de src/lib importa "server-only", que não
  // carrega fora do Next).
  const { createClient } = await import("@supabase/supabase-js")
  const createSupabaseAdminClient = () =>
    createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    )
  const BUCKET_SERVICO = "servico"

  const emp = await db.query.empresa.findFirst({
    where: eq(schema.empresa.id, empresaId),
  })
  if (!emp) {
    console.error("Empresa não encontrada.")
    process.exit(1)
  }
  const us = await db.query.utilizador.findMany({
    where: eq(schema.utilizador.empresaId, empresaId),
  })

  console.log(`\nEmpresa: ${emp.nome} (${emp.id})`)
  console.log(`Contas a apagar: ${us.map((u) => u.email).join(", ") || "—"}`)
  if (!confirmado) {
    console.log("\nNada foi apagado. Repete com --sim para confirmar.\n")
    process.exit(0)
  }

  const admin = createSupabaseAdminClient()

  // 1) Ficheiros do storage (fotos + assinaturas + PDFs partilhados).
  const pastas = [`${empresaId}`, `partilha/${empresaId}`]
  for (const pasta of pastas) {
    const caminhos: string[] = []
    // O storage não apaga pastas — é preciso listar recursivamente.
    async function listar(prefixo: string) {
      const { data } = await admin.storage.from(BUCKET_SERVICO).list(prefixo, {
        limit: 1000,
      })
      for (const item of data ?? []) {
        const caminho = `${prefixo}/${item.name}`
        if (item.id) caminhos.push(caminho)
        else await listar(caminho) // subpasta
      }
    }
    await listar(pasta)
    if (caminhos.length > 0) {
      await admin.storage.from(BUCKET_SERVICO).remove(caminhos)
      console.log(`  storage: ${caminhos.length} ficheiro(s) removidos de ${pasta}/`)
    }
  }

  // 2) Dados de negócio — filhos primeiro (as FKs não têm cascade).
  const ordem = [
    ["orcamentoItem", schema.orcamentoItem],
    ["foto", schema.foto],
    ["avaliacao", schema.avaliacao],
    ["transacaoFinanceira", schema.transacaoFinanceira],
    ["servico", schema.servico],
    ["orcamento", schema.orcamento],
    ["visita", schema.visita],
    ["cliente", schema.cliente],
    ["produtoEstoque", schema.produtoEstoque],
    ["pagamento", schema.pagamento],
    ["utilizador", schema.utilizador],
  ] as const
  for (const [nome, tabela] of ordem) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await db.delete(tabela as any).where(eq((tabela as any).empresaId, empresaId))
    console.log(`  ${nome}: apagado`)
  }

  // 3) Contas de login no Supabase Auth.
  for (const u of us) {
    const { error } = await admin.auth.admin.deleteUser(u.id)
    console.log(`  auth ${u.email}: ${error ? `ERRO ${error.message}` : "apagado"}`)
  }

  // 4) A empresa.
  await db.delete(schema.empresa).where(eq(schema.empresa.id, empresaId))
  console.log(`\n✅ Empresa "${emp.nome}" apagada.\n`)
  process.exit(0)
}

main().catch((e) => {
  console.error("❌ Erro:", e instanceof Error ? e.message : e)
  process.exit(1)
})
