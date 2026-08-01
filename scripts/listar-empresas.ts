/**
 * Lista todas as empresas (tenants) com o seu estado de acesso.
 * npx tsx scripts/listar-empresas.ts
 */
import { config } from "dotenv"
config({ path: ".env.local" })

async function main() {
  const { db, schema } = await import("../src/db/client")
  const empresas = await db.select({
    id: schema.empresa.id,
    nome: schema.empresa.nome,
    ativo: schema.empresa.ativo,
    acessoAte: schema.empresa.acessoAte,
  }).from(schema.empresa)

  for (const e of empresas) {
    console.log(
      `${e.id}  ativo=${e.ativo}  acessoAte=${e.acessoAte ? e.acessoAte.toISOString() : "null (ilimitado)"}  | ${e.nome}`
    )
  }
  process.exit(0)
}

main().catch((e) => {
  console.error("❌ Erro:", e instanceof Error ? e.message : e)
  process.exit(1)
})
