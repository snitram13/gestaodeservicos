/**
 * Cria o bucket "empresa" do Storage (logótipo/imagens da empresa).
 * O perfil da empresa vive agora na tabela `empresa` (criada pela migração e
 * pelo registo), por isso este script já não mexe na base de dados.
 * npx tsx scripts/setup-empresa.ts
 */
import { config } from "dotenv"
import { createClient } from "@supabase/supabase-js"

config({ path: ".env.local" })

async function main() {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )

  const { error: be } = await admin.storage.createBucket("empresa", {
    public: true,
    fileSizeLimit: "2MB",
  })
  console.log("bucket 'empresa':", be ? be.message : "criado")

  console.log("✅ Bucket da empresa configurado.")
}

main().catch((e) => {
  console.error("❌ Erro:", e instanceof Error ? e.message : e)
  process.exit(1)
})
