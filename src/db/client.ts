import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import * as schema from "./schema"

/**
 * Ligação à base de dados (Supabase Postgres) através do pooler de transações
 * (porta 6543). `prepare: false` é obrigatório com o pooler do Supabase
 * (Supavisor em modo transação).
 */
const connectionString = process.env.DATABASE_URL ?? ""

const client = postgres(connectionString, {
  prepare: false, // obrigatório com o pooler de transações do Supabase
  max: 10, // permite consultas paralelas (ex.: dashboard) sem serializar
  idle_timeout: 20, // fecha ligações ociosas (evita acumulação no pooler)
})

export const db = drizzle(client, { schema })

export { schema }
