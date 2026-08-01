import { Wrench } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { LoginForm } from "@/components/auth/login-form"
import { SeletorIdioma } from "@/components/i18n/seletor-idioma"
import { getIdioma, getT } from "@/lib/i18n"

export const metadata = {
  title: "Entrar",
}

export default async function LoginPage() {
  const [t, idioma] = await Promise.all([getT(), getIdioma()])
  return (
    <Card className="w-full max-w-sm" size="default">
      <CardHeader className="items-center text-center">
        <div className="bg-primary text-primary-foreground mx-auto mb-2 flex size-12 items-center justify-center rounded-xl">
          <Wrench className="size-6" />
        </div>
        <CardTitle className="text-xl">{t("Gestão de Serviços")}</CardTitle>
        <CardDescription>{t("Inicie sessão para continuar")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <LoginForm />
        {/* Escolha do idioma antes de entrar (fica guardada no dispositivo). */}
        <div className="border-t pt-4">
          <SeletorIdioma atual={idioma} className="justify-center" />
        </div>
      </CardContent>
    </Card>
  )
}
