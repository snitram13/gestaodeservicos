"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { eq } from "drizzle-orm"

import { db } from "@/db/client"
import { utilizador } from "@/db/schema"
import { getUser } from "@/lib/auth"
import { COOKIE_IDIOMA, idiomaValido } from "@/lib/constants/idiomas"

/**
 * Define o idioma da interface. Guarda sempre num cookie (para o ecrã de login,
 * onde ainda não há sessão) e, se houver sessão, também no `utilizador` — assim
 * a escolha segue a pessoa para qualquer dispositivo.
 */
export async function definirIdioma(valor: string): Promise<{ ok: true }> {
  const idioma = idiomaValido(valor)

  const jar = await cookies()
  jar.set(COOKIE_IDIOMA, idioma, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  })

  const user = await getUser()
  if (user) {
    await db
      .update(utilizador)
      .set({ idioma })
      .where(eq(utilizador.id, user.id))
  }

  revalidatePath("/", "layout")
  return { ok: true }
}
