import { sql } from "drizzle-orm"

import { db } from "@/db/client"

/**
 * Endpoint de "keep-warm": mantém o projeto Supabase ativo (evita a pausa após
 * 7 dias de inatividade no plano gratuito). Chamado por um cron diário.
 */
export async function GET() {
  try {
    await db.execute(sql`select 1`)
    return Response.json({ ok: true })
  } catch {
    return Response.json({ ok: false }, { status: 500 })
  }
}
