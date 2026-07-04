/**
 * Restaura clientes (backup) e semeia visitas/serviços/transações de exemplo.
 * Idempotente nas visitas (só semeia se ainda não existirem).
 * Executar: npx tsx scripts/seed.ts
 */
import { existsSync, readFileSync } from "node:fs"

import { config } from "dotenv"
import { eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import * as schema from "../src/db/schema"

config({ path: ".env.local" })

function diaISO(offset: number) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}
function dataHora(offset: number, hora: number) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  d.setHours(hora, 0, 0, 0)
  return d
}

type ClienteBackup = {
  id: string
  nome: string
  telefone: string
  email: string | null
  nif: string | null
  morada: string | null
  cidade: string | null
  codigo_postal: string | null
  notas: string | null
}

async function main() {
  const client = postgres(process.env.MIGRATION_URL!, { prepare: false, max: 1 })
  const db = drizzle(client, { schema })

  // 0. Empresa (tenant). Usa a existente ("PN REPARAÇÕES") ou cria uma.
  let [emp] = await db.select().from(schema.empresa).limit(1)
  if (!emp) {
    ;[emp] = await db
      .insert(schema.empresa)
      .values({ nome: "PN REPARAÇÕES" })
      .returning()
    console.log("✓ Empresa 'PN REPARAÇÕES' criada.")
  }

  // 1. Restaurar clientes do backup, se a tabela estiver vazia
  let clientes = await db.select().from(schema.cliente)
  if (clientes.length === 0 && existsSync("/tmp/clientes-backup.json")) {
    const backup: ClienteBackup[] = JSON.parse(
      readFileSync("/tmp/clientes-backup.json", "utf8")
    )
    if (backup.length > 0) {
      await db
        .insert(schema.cliente)
        .values(
          backup.map((c) => ({
            id: c.id,
            empresaId: emp.id,
            nome: c.nome,
            telefone: c.telefone,
            email: c.email,
            nif: c.nif,
            morada: c.morada,
            cidade: c.cidade,
            codigoPostal: c.codigo_postal,
            notas: c.notas,
          }))
        )
        .onConflictDoNothing()
      console.log(`✓ Restaurados ${backup.length} clientes do backup.`)
    }
  }

  // 2. Garantir pelo menos 3 clientes de exemplo
  clientes = await db.select().from(schema.cliente)
  if (clientes.length === 0) {
    await db.insert(schema.cliente).values([
      {
        empresaId: emp.id,
        nome: "Maria Silva",
        telefone: "912345678",
        email: "maria.silva@exemplo.pt",
        morada: "Rua de Santa Catarina 120",
        cidade: "Porto",
        codigoPostal: "4000-447",
      },
      {
        empresaId: emp.id,
        nome: "João Pereira",
        telefone: "936112233",
        morada: "Av. da República 45",
        cidade: "Vila Nova de Gaia",
        codigoPostal: "4430-187",
      },
      {
        empresaId: emp.id,
        nome: "Ana Costa",
        telefone: "925778899",
        morada: "Rua Brito Capelo 200",
        cidade: "Matosinhos",
        codigoPostal: "4450-068",
      },
    ])
    clientes = await db.select().from(schema.cliente)
    console.log("✓ 3 clientes de exemplo criados.")
  }

  // 3. Semear visitas (só se não existirem)
  const visitasExist = await db.select().from(schema.visita).limit(1)
  if (visitasExist.length > 0) {
    console.log("ℹ Já existem visitas — seed de visitas ignorado.")
    await client.end()
    return
  }

  const [maria, joao, ana] = clientes

  // Contador local para o `numero` sequencial das visitas (por empresa).
  let proxNumVisita = 1

  async function criarVisita(
    dados: Omit<typeof schema.visita.$inferInsert, "empresaId" | "numero">,
    servicos: Omit<
      typeof schema.servico.$inferInsert,
      "visitaId" | "empresaId"
    >[]
  ) {
    const somaServicos = servicos.reduce((s, x) => s + Number(x.valor), 0)
    const total = somaServicos + Number(dados.deslocacao ?? 0)
    const [v] = await db
      .insert(schema.visita)
      .values({
        ...dados,
        empresaId: emp.id,
        numero: proxNumVisita++,
        valor: String(total),
      })
      .returning({ id: schema.visita.id })
    await db
      .insert(schema.servico)
      .values(
        servicos.map((s, i) => ({
          ...s,
          empresaId: emp.id,
          visitaId: v.id,
          ordem: i,
        }))
      )
    return v.id
  }

  const v1 = await criarVisita(
    {
      clienteId: maria.id,
      estado: "CONCLUIDO",
      cidade: "Porto",
      agendadoPara: dataHora(-6, 10),
      concluidoEm: dataHora(-6, 11),
      deslocacao: "10",
      kmPercorridos: "8",
    },
    [
      {
        categoria: "CANALIZACAO",
        titulo: "Troca de torneira",
        maoDeObra: "35",
        material: "15",
        valor: "50",
      },
      {
        categoria: "PEQUENAS_REPARACOES",
        titulo: "Aperto de fugas",
        maoDeObra: "25",
        material: "0",
        valor: "25",
      },
    ]
  )

  await criarVisita(
    {
      clienteId: maria.id,
      estado: "AGENDADO",
      cidade: "Porto",
      agendadoPara: dataHora(2, 15),
      deslocacao: "10",
    },
    [
      {
        categoria: "MONTAGEM_MOVEIS",
        titulo: "Montagem de armário IKEA",
        maoDeObra: "70",
        material: "0",
        valor: "70",
      },
    ]
  )

  await criarVisita(
    {
      clienteId: joao.id,
      estado: "AGENDADO",
      cidade: "Vila Nova de Gaia",
      agendadoPara: dataHora(0, 17),
      deslocacao: "10",
    },
    [
      {
        categoria: "INSTALACAO_CANDEEIROS",
        titulo: "Instalação de 3 candeeiros",
        maoDeObra: "80",
        material: "0",
        valor: "80",
      },
      {
        categoria: "ELETRICIDADE",
        titulo: "Substituição de tomada",
        maoDeObra: "35",
        material: "10",
        valor: "45",
      },
    ]
  )

  const v4 = await criarVisita(
    {
      clienteId: ana.id,
      estado: "CONCLUIDO",
      cidade: "Matosinhos",
      agendadoPara: dataHora(-3, 9),
      concluidoEm: dataHora(-3, 12),
      deslocacao: "10",
      kmPercorridos: "12",
    },
    [
      {
        categoria: "PINTURA",
        titulo: "Pintura de quarto",
        maoDeObra: "200",
        material: "50",
        valor: "250",
      },
    ]
  )

  // 4. Transações (uma visita concluída paga, outra por receber)
  await db.insert(schema.transacaoFinanceira).values([
    {
      empresaId: emp.id,
      tipo: "ENTRADA",
      categoria: "SERVICO",
      valor: "85",
      data: diaISO(-6),
      descricao: "Pagamento — Maria Silva",
      visitaId: v1,
      clienteId: maria.id,
      metodoPagamento: "MBWAY",
    },
    {
      empresaId: emp.id,
      tipo: "SAIDA",
      categoria: "COMBUSTIVEL",
      valor: "30",
      data: diaISO(-2),
      descricao: "Combustível",
    },
  ])
  // v4 (Ana) fica concluída e por receber → aparece em "A receber"
  void v4

  // 5. Sincronizar o contador de numeração da empresa (próximo = max+1).
  await db
    .update(schema.empresa)
    .set({ proxNumVisita })
    .where(eq(schema.empresa.id, emp.id))

  console.log("✅ Seed concluído: clientes + 4 visitas + serviços + transações.")
  await client.end()
}

main().catch((e) => {
  console.error("❌ Erro no seed:", e)
  process.exit(1)
})
