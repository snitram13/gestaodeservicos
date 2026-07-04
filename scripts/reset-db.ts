/**
 * Reset da base de dados preservando os clientes (guarda em /tmp e apaga tudo).
 * Depois: drizzle-kit migrate · setup-db · seed.
 * Executar: npx tsx scripts/reset-db.ts
 */
import { writeFileSync } from "node:fs"

import { config } from "dotenv"
import postgres from "postgres"

config({ path: ".env.local" })

async function main() {
  const sql = postgres(process.env.MIGRATION_URL!, { prepare: false, max: 1 })

  let clientes: unknown[] = []
  try {
    clientes = Array.from(await sql`select * from cliente`)
  } catch {
    // tabela pode não existir
  }
  writeFileSync("/tmp/clientes-backup.json", JSON.stringify(clientes))
  console.log(`backup: ${clientes.length} clientes`)

  const drops = [
    `drop table if exists transacao_financeira cascade`,
    `drop table if exists foto cascade`,
    `drop table if exists avaliacao cascade`,
    `drop table if exists orcamento_item cascade`,
    `drop table if exists orcamento cascade`,
    `drop table if exists servico cascade`,
    `drop table if exists visita cascade`,
    `drop table if exists produto_estoque cascade`,
    `drop table if exists cliente cascade`,
    `drop table if exists utilizador cascade`,
    `drop table if exists empresa cascade`,
    `drop type if exists estado_servico cascade`,
    `drop type if exists estado_visita cascade`,
    `drop type if exists categoria_servico cascade`,
    `drop type if exists estado_orcamento cascade`,
    `drop type if exists tipo_transacao cascade`,
    `drop type if exists categoria_transacao cascade`,
    `drop type if exists tipo_foto cascade`,
    `drop type if exists metodo_pagamento cascade`,
    `drop type if exists utilizador_role cascade`,
    `drop sequence if exists servico_numero_seq cascade`,
    `drop sequence if exists orcamento_numero_seq cascade`,
    `drop sequence if exists visita_numero_seq cascade`,
    `drop schema if exists drizzle cascade`,
  ]
  for (const d of drops) await sql.unsafe(d)

  await sql.end()
  console.log("✅ Base de dados limpa (clientes guardados em /tmp).")
}

main().catch((e) => {
  console.error("❌ Erro:", e)
  process.exit(1)
})
