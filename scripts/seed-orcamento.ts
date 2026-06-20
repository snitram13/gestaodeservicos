/** Cria um orçamento de exemplo (idempotente). npx tsx scripts/seed-orcamento.ts */
import { config } from "dotenv"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import * as schema from "../src/db/schema"

config({ path: ".env.local" })

async function main() {
  const client = postgres(process.env.MIGRATION_URL!, { prepare: false, max: 1 })
  const db = drizzle(client, { schema })

  const existentes = await db.select().from(schema.orcamento).limit(1)
  if (existentes.length > 0) {
    console.log("ℹ Já existem orçamentos — seed ignorado.")
    await client.end()
    return
  }

  const clientes = await db.select().from(schema.cliente).limit(1)
  if (clientes.length === 0) {
    console.log("ℹ Sem clientes — corra primeiro scripts/seed.ts.")
    await client.end()
    return
  }
  const clienteId = clientes[0].id

  const subtotal = 260
  const taxa = 23
  const totalIva = (subtotal * taxa) / 100
  const total = subtotal + totalIva
  const validade = new Date()
  validade.setDate(validade.getDate() + 30)

  const [o] = await db
    .insert(schema.orcamento)
    .values({
      clienteId,
      categoria: "CANALIZACAO",
      estado: "ENVIADO",
      titulo: "Reparação de canalização",
      descricao: "Substituição de um troço de canalização na cozinha.",
      validade: validade.toISOString().slice(0, 10),
      taxaIva: String(taxa),
      subtotal: String(subtotal),
      totalIva: String(totalIva),
      total: String(total),
      notas: "Orçamento válido por 30 dias. Pagamento a pronto.",
      enviadoEm: new Date(),
    })
    .returning({ id: schema.orcamento.id })

  await db.insert(schema.orcamentoItem).values([
    {
      orcamentoId: o.id,
      descricao: "Mão de obra (substituição de canalização)",
      quantidade: "1",
      precoUnit: "180",
      totalLinha: "180",
      ordem: 0,
    },
    {
      orcamentoId: o.id,
      descricao: "Tubos e acessórios",
      quantidade: "1",
      precoUnit: "65",
      totalLinha: "65",
      ordem: 1,
    },
    {
      orcamentoId: o.id,
      descricao: "Deslocação",
      quantidade: "1",
      precoUnit: "15",
      totalLinha: "15",
      ordem: 2,
    },
  ])

  console.log("✅ Orçamento de exemplo criado.")
  await client.end()
}

main().catch((e) => {
  console.error("❌ Erro:", e)
  process.exit(1)
})
