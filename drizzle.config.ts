import { config } from "dotenv"
import { defineConfig } from "drizzle-kit"

// As migrações usam o pooler de SESSÃO (porta 5432), que suporta DDL.
config({ path: ".env.local" })

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.MIGRATION_URL ?? process.env.DATABASE_URL ?? "",
  },
  verbose: true,
  strict: true,
})
