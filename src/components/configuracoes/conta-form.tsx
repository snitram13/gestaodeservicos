"use client"

import { useState } from "react"
import { useT } from "@/components/i18n/idioma-provider"
import { KeyRound, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ContaForm({ email }: { email?: string }) {
  const t = useT()
  const [p1, setP1] = useState("")
  const [p2, setP2] = useState("")
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
  const t = useT()
    e.preventDefault()
    if (p1.length < 6) {
      toast.error(t("A password deve ter pelo menos 6 caracteres."))
      return
    }
    if (p1 !== p2) {
      toast.error(t("As passwords não coincidem."))
      return
    }
    setLoading(true)
    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase.auth.updateUser({ password: p1 })
    setLoading(false)
    if (error) {
      toast.error(t("Não foi possível alterar"), { description: error.message })
      return
    }
    toast.success(t("Password alterada"))
    setP1("")
    setP2("")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("Conta")}</CardTitle>
        <CardDescription>{email ?? "—"}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-4 sm:max-w-sm">
          <div className="grid gap-2">
            <Label htmlFor="np">{t("Nova password")}</Label>
            <Input
              id="np"
              type="password"
              value={p1}
              onChange={(e) => setP1(e.target.value)}
              className="h-11"
              autoComplete="new-password"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="np2">{t("Confirmar password")}</Label>
            <Input
              id="np2"
              type="password"
              value={p2}
              onChange={(e) => setP2(e.target.value)}
              className="h-11"
              autoComplete="new-password"
            />
          </div>
          <Button type="submit" className="h-11 w-fit gap-1.5" disabled={loading}>
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <KeyRound className="size-4" />
            )}
            {t("Alterar password")}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
