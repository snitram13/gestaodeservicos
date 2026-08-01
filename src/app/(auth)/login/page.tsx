import { Wrench } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { LoginForm } from "@/components/auth/login-form"
import { getT } from "@/lib/i18n"

export const metadata = {
  title: "Entrar",
}

/**
 * Ecrã de entrada. NÃO tem escolha de idioma: quem entra recebe logo o idioma
 * do país da empresa (ou o que tiver escolhido nas Definições), por isso um
 * seletor aqui não mudava nada depois do login. Este ecrã segue o idioma da
 * última pessoa que entrou neste dispositivo (cookie); na primeira visita fica
 * em português.
 */
export default async function LoginPage() {
  const t = await getT()
  return (
    <Card className="w-full max-w-sm" size="default">
      <CardHeader className="items-center text-center">
        <div className="bg-primary text-primary-foreground mx-auto mb-2 flex size-12 items-center justify-center rounded-xl">
          <Wrench className="size-6" />
        </div>
        <CardTitle className="text-xl">{t("Gestão de Serviços")}</CardTitle>
        <CardDescription>{t("Inicie sessão para continuar")}</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
    </Card>
  )
}
