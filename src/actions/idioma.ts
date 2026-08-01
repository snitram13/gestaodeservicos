"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { eq } from "drizzle-orm"

import { db } from "@/db/client"
import { utilizador } from "@/db/schema"
import { getUser } from "@/lib/auth"
import { COOKIE_IDIOMA, idiomaValido } from "@/lib/constants/idiomas"
import { getIdioma } from "@/lib/i18n"

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

/**
 * Chamada logo a seguir ao login: grava no dispositivo o idioma da conta que
 * acabou de entrar (o do país da empresa, ou o que a pessoa escolheu). É isto
 * que faz o ecrã de entrada aparecer em francês/espanhol nas vezes seguintes,
 * já sem depender do idioma do browser.
 */
export async function sincronizarIdiomaDaConta(): Promise<{ ok: true }> {
  const user = await getUser()
  if (!user) return { ok: true }

  const idioma = await getIdioma()
  const jar = await cookies()
  jar.set(COOKIE_IDIOMA, idioma, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  })
  return { ok: true }
}
