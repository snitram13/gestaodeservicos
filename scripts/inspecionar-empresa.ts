/**
 * Mostra tudo o que pertence a uma empresa (tenant) — read-only.
 * npx tsx scripts/inspecionar-empresa.ts <empresaId>
 */
import { config } from "dotenv"
config({ path: ".env.local" })

async function main() {
  const empresaId = process.argv[2]
  if (!empresaId) {
    console.error("Uso: npx tsx scripts/inspecionar-empresa.ts <empresaId>")
    process.exit(1)
  }

  const { db, schema } = await import("../src/db/client")
  const { eq, count } = await import("drizzle-orm")

  const emp = await db.query.empresa.findFirst({
    where: eq(schema.empresa.id, empresaId),
  })
  if (!emp) {
    console.error("Empresa não encontrada.")
    process.exit(1)
  }

  console.log(`\nEmpresa: ${emp.nome}  (${emp.id})`)
  console.log(
    `ativo=${emp.ativo}  acessoAte=${emp.acessoAte?.toISOString() ?? "ilimitado"}  criadoEm=${emp.criadoEm?.toISOString()}\n`
  )

  const tabelas = [
    ["utilizador", schema.utilizador],
    ["cliente", schema.cliente],
    ["visita", schema.visita],
    ["servico", schema.servico],
    ["orcamento", schema.orcamento],
    ["orcamentoItem", schema.orcamentoItem],
    ["foto", schema.foto],
    ["avaliacao", schema.avaliacao],
    ["transacaoFinanceira", schema.transacaoFinanceira],
    ["produtoEstoque", schema.produtoEstoque],
    ["pagamento", schema.pagamento],
  ] as const

  for (const [nome, tabela] of tabelas) {
    const [r] = await db
      .select({ n: count() })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from(tabela as any)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .where(eq((tabela as any).empresaId, empresaId))
    console.log(`  ${nome.padEnd(22)} ${r.n}`)
  }

  const us = await db.query.utilizador.findMany({
    where: eq(schema.utilizador.empresaId, empresaId),
  })
  console.log("\nUtilizadores (contas de login):")
  for (const u of us) {
    console.log(`  ${u.email}  ${u.role}  ativo=${u.ativo}  id=${u.id}`)
  }
  console.log()
  process.exit(0)
}

main().catch((e) => {
  console.error("❌ Erro:", e instanceof Error ? e.message : e)
  process.exit(1)
})
