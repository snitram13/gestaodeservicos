"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { useT } from "@/components/i18n/idioma-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function LoginForm() {
  const router = useRouter()
  const t = useT()
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const email = String(formData.get("email") ?? "").trim()
    const password = String(formData.get("password") ?? "")

    if (!email || !password) {
      toast.error(t("Preencha o email e a palavra-passe."))
      return
    }

    setLoading(true)
    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)

    if (error) {
      toast.error(t("Não foi possível entrar"), {
        description: t(
          "Verifique o email e a palavra-passe e tente novamente."
        ),
      })
      return
    }

    toast.success(t("Sessão iniciada"))
    router.push("/")
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="email">{t("Email")}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder={t("nome@email.com")}
          className="h-11"
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">{t("Palavra-passe")}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          className="h-11"
          required
        />
      </div>
      <Button type="submit" className="h-11 w-full" disabled={loading}>
        {loading && <Loader2 className="size-4 animate-spin" />}
        {t("Entrar")}
      </Button>
    </form>
  )
}
