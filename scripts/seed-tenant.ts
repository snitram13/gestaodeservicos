/**
 * Enche um tenant com dados de exemplo (cliente, serviço, orçamento,
 * movimento) para se poder ver os ecrãs de detalhe.
 *   npx tsx scripts/seed-tenant.ts <empresaId>
 */
import { config } from "dotenv"
config({ path: ".env.local" })

async function main() {
  const empresaId = process.argv[2]
  if (!empresaId) throw new Error("Falta o empresaId")
  const { db, schema } = await import("../src/db/client")

  const [cli] = await db
    .insert(schema.cliente)
    .values({
      empresaId,
      nome: "María García",
      telefone: "612345678",
      email: "maria@ejemplo.es",
      morada: "Calle Mayor 12",
      cidade: "Madrid",
      codigoPostal: "28001",
    })
    .returning({ id: schema.cliente.id })

  const [vis] = await db
    .insert(schema.visita)
    .values({
      empresaId,
      clienteId: cli.id,
      numero: 1,
      titulo: "Cambio de grifo",
      agendadoPara: new Date(Date.now() + 86_400_000),
      moradaServico: "Calle Mayor 12",
      cidade: "Madrid",
      valor: "120",
      deslocacao: "20",
    })
    .returning({ id: schema.visita.id })

  await db.insert(schema.servico).values({
    empresaId,
    visitaId: vis.id,
    categoria: "CANALIZACAO",
    titulo: "Cambio de grifo",
    maoDeObra: "80",
    material: "20",
    valor: "100",
  })

  const [orc] = await db
    .insert(schema.orcamento)
    .values({
      empresaId,
      clienteId: cli.id,
      numero: 1,
      titulo: "Reforma de baño",
      subtotal: "500",
      taxaIva: "21",
      totalIva: "105",
      total: "605",
    })
    .returning({ id: schema.orcamento.id })

  await db.insert(schema.orcamentoItem).values({
    empresaId,
    orcamentoId: orc.id,
    descricao: "Mano de obra",
    quantidade: "1",
    precoUnit: "500",
    totalLinha: "500",
  })

  await db.insert(schema.transacaoFinanceira).values({
    empresaId,
    tipo: "ENTRADA",
    categoria: "SERVICO",
    valor: "120",
    data: new Date().toISOString().slice(0, 10),
    clienteId: cli.id,
    visitaId: vis.id,
    metodoPagamento: "DINHEIRO",
  })

  console.log(`✅ cliente=${cli.id} visita=${vis.id} orcamento=${orc.id}`)
  process.exit(0)
}

main().catch((e) => {
  console.error("❌ Erro:", e instanceof Error ? e.message : e)
  process.exit(1)
})
